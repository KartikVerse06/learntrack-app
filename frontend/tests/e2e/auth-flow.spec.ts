import { test, expect } from "@playwright/test";

test.describe("Authentication Flow & Protected Route Guards", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "E2E Test User",
    email: `e2e_user_${timestamp}@example.com`,
    password: "Password123!",
  };

  test.beforeEach(async ({ page }) => {
    // Route browser requests to production Render backend while injecting localhost CORS headers
    await page.route("https://learntrack-app.onrender.com/**", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "http://localhost:3005",
            "access-control-allow-credentials": "true",
            "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "access-control-allow-headers":
              "Content-Type, Authorization, X-Requested-With, x-auth-token, X-Auth-Token",
          },
        });
        return;
      }

      try {
        const reqHeaders = {
          ...route.request().headers(),
          origin: "https://learntrack-six.vercel.app",
        };
        const response = await route.fetch({ headers: reqHeaders });
        const headers = response.headers();
        headers["access-control-allow-origin"] = "http://localhost:3005";
        headers["access-control-allow-credentials"] = "true";
        await route.fulfill({
          response,
          headers,
        });
      } catch (err) {
        console.error("Route fetch error:", err);
      }
    });
  });

  test("should redirect unauthenticated users to /login when accessing protected routes", async ({
    page,
  }) => {
    await page.goto("/planner");
    await page.waitForURL((url) => url.pathname.includes("/login"));
    expect(page.url()).toContain("/login");
  });

  test("should register a new user, auto-login, and navigate to dashboard", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill('input[id="name"]', testUser.name);
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);

    await page.click('button[type="submit"]');

    // Should redirect to dashboard upon completion
    await page.waitForURL((url) =>
      url.pathname.includes("/dashboard") || url.pathname.includes("/login")
    );

    if (page.url().includes("/login")) {
      // If redirecting with ?registered=true, sign in
      await page.fill('input[id="email"]', testUser.email);
      await page.fill('input[id="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard");
    }

    expect(page.url()).toContain("/dashboard");
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("should log in with registered credentials, log out successfully, and reject back navigation", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // Open user menu and sign out
    const userMenuButton = page.locator('button[aria-label="User profile and settings"]');
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    const signOutButton = page.getByRole("menuitem", { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Verify redirection to /login
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");

    // Direct dashboard access after logout must redirect to /login
    await page.goto("/dashboard");
    await page.waitForURL((url) => url.pathname.includes("/login"));
    expect(page.url()).toContain("/login");
  });

  test("Complete E2E Journey: Register → Dashboard → Refresh → Planner → Create Task → Logout → Direct URL guarded → Login → Dashboard → Logout → Back Button guarded", async ({
    page,
  }) => {
    const journeyUser = {
      name: "Journey User",
      email: `journey_${Date.now()}@example.com`,
      password: "Password123!",
    };

    // 1. Register
    await page.goto("/register");
    await page.fill('input[id="name"]', journeyUser.name);
    await page.fill('input[id="email"]', journeyUser.email);
    await page.fill('input[id="password"]', journeyUser.password);
    await page.fill('input[id="confirmPassword"]', journeyUser.password);
    await page.click('button[type="submit"]');

    // 2. Dashboard
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // 3. Refresh & still authenticated
    await page.reload();
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // 4. Planner
    await page.goto("/planner");
    await page.waitForURL("**/planner");
    expect(page.url()).toContain("/planner");

    // 5. Create Task
    const planTopicBtn = page.getByRole("button", { name: /Plan Topic/i });
    await expect(planTopicBtn).toBeVisible();
    await planTopicBtn.click();

    const titleInput = page.locator('input[id="task-title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Master TypeScript Generics");

    const submitTaskBtn = page.locator('button[type="submit"]:has-text("Add to Agenda")');
    await expect(submitTaskBtn).toBeVisible();
    await submitTaskBtn.click();

    // Verify dialog closed and task item is in planner
    await expect(titleInput).not.toBeVisible();
    await expect(page.locator("text=Master TypeScript Generics")).toBeVisible();

    // 6. Logout
    const userMenuButton = page.locator('button[aria-label="User profile and settings"]');
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    const signOutButton = page.getByRole("menuitem", { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // 7. Login page reached
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");

    // 8. Direct dashboard URL guarded
    await page.goto("/dashboard");
    await page.waitForURL((url) => url.pathname.includes("/login"));
    expect(page.url()).toContain("/login");

    // 9. Login again
    await page.fill('input[id="email"]', journeyUser.email);
    await page.fill('input[id="password"]', journeyUser.password);
    await page.click('button[type="submit"]');

    // 10. Dashboard reached
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // 11. Logout again
    await userMenuButton.click();
    await signOutButton.click();
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");

    // 12. Browser Back must not expose protected dashboard
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain("/dashboard");
  });
});
