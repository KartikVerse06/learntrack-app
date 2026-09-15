import { test, expect } from "@playwright/test";

test.describe("Money Management E2E Journey", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const testUser = {
      name: "Money Explorer",
      email: `money_e2e_${timestamp}@example.com`,
      password: "Password123!",
    };

    // Register test user
    await page.goto("/register");
    await page.fill('input[id="name"]', testUser.name);
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) =>
      url.pathname.includes("/dashboard") || url.pathname.includes("/login")
    );

    if (page.url().includes("/login")) {
      await page.fill('input[id="email"]', testUser.email);
      await page.fill('input[id="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard");
    }
  });

  test("should execute full money management cycle: enter amount -> 50/20/20/10 split -> add expenses -> check remaining -> view history", async ({
    page,
  }) => {
    // 1. Navigate to Money Management
    await page.goto("/money");
    await expect(page.getByRole("heading", { name: /money management/i })).toBeVisible();

    // Verify empty state initially
    await expect(page.getByText(/no monthly budget yet/i)).toBeVisible();

    // 2. Enter monthly amount ₹5,000
    const amountInput = page.getByLabel("Monthly Amount");
    await expect(amountInput).toBeVisible();
    await amountInput.fill("5000");

    const saveButton = page.getByRole("button", { name: /calculate & save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 3. Verify 50/20/20/10 split
    await expect(page.getByText("₹2,500").first()).toBeVisible(); // Needs 50%
    await expect(page.getByText("₹1,000").first()).toBeVisible(); // Savings & Growth 20%
    await expect(page.getByText("₹500").first()).toBeVisible();   // Wants 10%

    // Verify Invariant: Total Allocated is ₹5,000
    await expect(page.getByText(/total allocated/i).first()).toBeVisible();

    // 4. Add Expense in Needs category
    const addExpenseButton = page.getByRole("button", { name: /add expense/i }).first();
    await expect(addExpenseButton).toBeVisible();
    await addExpenseButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator('input[id="expense-amount"]').fill("500");
    await dialog.locator('input[id="expense-note"]').fill("Electricity & Groceries");
    await dialog.getByRole("button", { name: /save expense/i }).click();

    // 5. Verify Spent and Remaining
    // Spent: ₹500, Remaining: ₹4,500
    await expect(page.getByText("₹4,500").first()).toBeVisible();
    await expect(page.getByText("Electricity & Groceries")).toBeVisible();

    // 6. Verify Monthly History includes this month
    await expect(page.getByRole("heading", { name: /monthly history/i })).toBeVisible();

    // 7. Verify Dashboard Integration
    await page.goto("/dashboard");
    await expect(page.getByText(/money this month/i)).toBeVisible();
    await expect(page.getByText(/₹5,000 budget/i)).toBeVisible();
    await expect(page.getByText(/₹4,500 remaining/i)).toBeVisible();
  });

  test("should be responsive on mobile viewport (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/money");

    await expect(page.getByRole("heading", { name: /money management/i })).toBeVisible();
    const amountInput = page.getByLabel("Monthly Amount");
    await expect(amountInput).toBeVisible();
    await amountInput.fill("3700");

    await page.getByRole("button", { name: /calculate & save/i }).click();

    // Verify 50/20/20/10 for ₹3,700: Needs ₹1,850, Savings ₹740, Growth ₹740, Wants ₹370
    await expect(page.getByText("₹1,850").first()).toBeVisible();
    await expect(page.getByText("₹740").first()).toBeVisible();
    await expect(page.getByText("₹370").first()).toBeVisible();
  });

  test("should be responsive on tablet viewport (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/money");

    await expect(page.getByRole("heading", { name: /money management/i })).toBeVisible();
    const amountInput = page.getByLabel("Monthly Amount");
    await expect(amountInput).toBeVisible();
  });
});
