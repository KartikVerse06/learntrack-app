import { test, expect } from "@playwright/test";

test.describe("LearnTrack Responsive UI & Viewport Validation", () => {
  test.setTimeout(120000);

  const timestamp = Date.now();
  const testUser = {
    name: "Responsive Test User",
    email: `resp_audit_${timestamp}@example.com`,
    password: "Password123!",
  };

  const viewports = [
    { name: "Mobile iPhone SE", width: 375, height: 667 },
    { name: "Mobile iPhone 14/15", width: 390, height: 844 },
    { name: "Tablet iPad Mini/Air", width: 768, height: 1024 },
    { name: "Laptop Small", width: 1366, height: 768 },
    { name: "Desktop Full HD", width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}) - Zero horizontal overflow & layout stability`, async ({
      page,
    }) => {
      const runUser = {
        name: `Responsive User ${vp.width}`,
        email: `resp_${vp.width}_${Date.now()}@example.com`,
        password: "Password123!",
      };

      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Authenticate / Register if needed
      await page.goto("/register");
      await page.fill('input[id="name"]', runUser.name);
      await page.fill('input[id="email"]', runUser.email);
      await page.fill('input[id="password"]', runUser.password);
      await page.click('button[type="submit"]');

      await page.waitForURL((url) =>
        url.pathname.includes("/dashboard") || url.pathname.includes("/login")
      );

      if (page.url().includes("/login")) {
        await page.fill('input[id="email"]', runUser.email);
        await page.fill('input[id="password"]', runUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL("**/dashboard");
      }

      const checkOverflow = async (pageName: string) => {
        await page.waitForTimeout(300);

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
          `Horizontal document scrollbar detected on ${pageName}: scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`
        ).toBe(false);
        expect(
          res.isBodyOverflowing,
          `Horizontal body scrollbar detected on ${pageName}`
        ).toBe(false);
      };

      // 2. Dashboard Viewport Audit
      await page.goto("/dashboard");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Dashboard");

      // Verify navigation accessibility
      if (vp.width < 1024) {
        // Mobile bottom navigation bar should be visible
        const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
        await expect(mobileNav).toBeVisible();

        // More navigation button should exist
        const moreBtn = page.getByRole("button", { name: /More/i });
        await expect(moreBtn).toBeVisible();
      } else {
        // Desktop sidebar should be visible
        const sidebar = page.locator("aside");
        await expect(sidebar).toBeVisible();
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

      // 10. Check Learning Logs
      await page.goto("/learning-logs");
      await page.waitForLoadState("domcontentloaded");
      await checkOverflow("Learning Logs");
    });
  }
});
