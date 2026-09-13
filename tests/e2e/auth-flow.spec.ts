import { test, expect } from "@playwright/test";

test.describe("Authentication Flow & Protected Route Guards", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "E2E Test User",
    email: `e2e_user_${timestamp}@example.com`,
    password: "Password123!",
  };

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

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login upon completion
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

  test("should log in with registered credentials and log out successfully", async ({
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
  });
});
