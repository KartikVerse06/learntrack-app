import { test, expect } from "@playwright/test";

test.describe("LearnTrack Reports Export & Download E2E System", () => {
  test.setTimeout(60000);

  test("should login, access /reports, inspect UI modules, and download PDF, CSV, and JSON", async ({
    page,
    request,
  }) => {
    // 1. Log in with demo account
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Ensure React hydration has attached event listeners
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]');
      return btn && Object.keys(btn).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactProps"));
    }, { timeout: 15000 });

    await page.fill('input[id="email"]', "demo@learntrack.app");
    await page.fill('input[id="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 25000 });

    // 2. Navigate to /reports
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");

    // 3. Verify Header and Page Structure
    const headerTitle = page.locator("h1");
    await expect(headerTitle).toContainText("Reports & Data Export Center");

    const tenantBadge = page.locator("text=Tenant Verified");
    await expect(tenantBadge).toBeVisible();

    // 4. Verify Master Hero Card
    const masterCard = page.locator("text=Complete LearnTrack Portfolio Dossier");
    await expect(masterCard).toBeVisible();

    // 5. Verify 8 Module Cards
    await expect(page.locator("text=Learning Progress & Tasks")).toBeVisible();
    await expect(page.locator("text=Focus Time & Deep Work")).toBeVisible();
    await expect(page.locator("text=Learning Logs & Reflections")).toBeVisible();
    await expect(page.locator("text=Spaced Revision Schedule")).toBeVisible();
    await expect(page.locator("text=Topic Mastery & Retention")).toBeVisible();
    await expect(page.locator("text=Calendar & Activity Feed")).toBeVisible();
    await expect(page.locator("text=Performance Analytics & Streaks")).toBeVisible();
    await expect(page.locator("text=Financial History & 50/20/20/10")).toBeVisible();

    // 6. Test Date Range Presets
    const thisMonthBtn = page.getByRole("button", { name: "This Month" });
    await thisMonthBtn.click();
    await expect(thisMonthBtn).toHaveClass(/shadow-sm/);

    const customBtn = page.getByRole("button", { name: "Custom Range" });
    await customBtn.click();
    await expect(page.locator('input[id="custom-from"]')).toBeVisible();
    await expect(page.locator('input[id="custom-to"]')).toBeVisible();

    // 7. Verify In-Browser Download Triggers (Download Event Capture)
    // Download CSV
    const [csvDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('button:has-text("Unified CSV")').click(),
    ]);
    expect(csvDownload.suggestedFilename()).toContain(".csv");

    // Download PDF
    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('button:has-text("Master PDF")').click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toContain(".pdf");

    // Download JSON
    const [jsonDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('button:has-text("Full JSON")').click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toContain(".json");

    // 8. Test API Security: Unauthenticated request should be rejected with 401
    const unauthResponse = await request.get("http://localhost:3001/api/reports/download?type=focus-time&format=pdf");
    expect(unauthResponse.status()).toBe(401);
  });
});
