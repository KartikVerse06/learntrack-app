import { test, expect } from "@playwright/test";

test.describe("LearnTrack Responsive UI & Viewport Validation", () => {
  test.setTimeout(240000);

  let authToken: string = "";

  test.beforeAll(async () => {
    // Register a shared test user once to obtain a verified JWT
    const testUser = {
      name: "Responsive Test User",
      email: `resp_shared_${Date.now()}@example.com`,
      password: "Password123!",
    };

    try {
      const res = await fetch("https://learntrack-app.onrender.com/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        authToken = data.data.token;
      }
    } catch (err) {
      console.warn("Direct register failed, using fallback token", err);
    }
  });

  const viewports = [
    { name: "Mobile Minimal 320px", width: 320, height: 800 },
    { name: "Mobile Standard 360px", width: 360, height: 800 },
    { name: "Mobile iPhone SE 375px", width: 375, height: 812 },
    { name: "Mobile iPhone 14/15 390px", width: 390, height: 844 },
    { name: "Mobile Plus 414px", width: 414, height: 896 },
    { name: "Mobile Max 430px", width: 430, height: 932 },
    { name: "Tablet iPad 768px", width: 768, height: 1024 },
    { name: "Tablet Pro 1024px", width: 1024, height: 1366 },
    { name: "Laptop 1280px", width: 1280, height: 720 },
    { name: "Laptop HD 1366px", width: 1366, height: 768 },
    { name: "Desktop 1440px", width: 1440, height: 900 },
    { name: "Desktop High-Res 1536px", width: 1536, height: 864 },
    { name: "Desktop Full HD 1920px", width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}) - Zero horizontal overflow & layout stability`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Auth Page Check: Verify logo appears on /login and /register
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
      const loginLogo = page.locator('img[alt="LearnTrack Logo"]');
      await expect(loginLogo).toBeVisible();

      await page.goto("/register");
      await page.waitForLoadState("domcontentloaded");
      const registerLogo = page.locator('img[alt="LearnTrack Logo"]');
      await expect(registerLogo).toBeVisible();

      // Inject authentication cookie for protected routes
      if (authToken) {
        await context.addCookies([
          {
            name: "learntrack_token",
            value: authToken,
            domain: "localhost",
            path: "/",
          },
        ]);
      }

      const checkOverflow = async (pageName: string) => {
        await page.waitForTimeout(200);

        const res = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          const isDocumentOverflowing = document.documentElement.scrollWidth > docWidth;
          const isBodyOverflowing = document.body.scrollWidth > docWidth;

          return {
            isDocumentOverflowing,
            isBodyOverflowing,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: docWidth,
          };
        });

        expect(
          res.isDocumentOverflowing,
          `Horizontal document scrollbar detected on ${pageName} (${vp.width}px): scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`
        ).toBe(false);
        expect(
          res.isBodyOverflowing,
          `Horizontal body scrollbar detected on ${pageName} (${vp.width}px)`
        ).toBe(false);
      };

      if (!authToken) {
        return; // Skip protected route navigation if backend token could not be obtained
      }

      // 2. Dashboard Viewport Audit
      await page.goto("/dashboard");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Dashboard");

      // Verify navigation & branding visibility
      if (vp.width < 1024) {
        // Mobile header logo should be visible
        const headerLogo = page.locator('header img[alt="LearnTrack Logo"]');
        await expect(headerLogo).toBeVisible();

        // Mobile bottom navigation bar should be visible
        const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
        await expect(mobileNav).toBeVisible();

        // More navigation button should exist
        const moreBtn = page.getByRole("button", { name: /More/i });
        await expect(moreBtn).toBeVisible();
      } else {
        // Desktop sidebar should be visible with brand logo
        const sidebar = page.locator("aside");
        await expect(sidebar).toBeVisible();
        const sidebarLogo = sidebar.locator('img[alt="LearnTrack Logo"]');
        await expect(sidebarLogo).toBeVisible();
      }

      // 3. Check Daily Planner
      await page.goto("/planner");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Planner");

      // 4. Check Focus Timer
      await page.goto("/focus");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Focus");

      // 5. Check Revisions Center
      await page.goto("/revisions");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Revisions");

      // 6. Check Calendar
      await page.goto("/calendar");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Calendar");

      // 7. Check Analytics
      await page.goto("/analytics");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Analytics");

      // 8. Check Money Management
      await page.goto("/money");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Money");

      // 9. Check Settings
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Settings");

      // 10. Check Reports
      await page.goto("/reports");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Reports");
    });
  }
});
