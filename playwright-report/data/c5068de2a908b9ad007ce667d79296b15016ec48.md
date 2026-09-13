# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reports-export.spec.ts >> LearnTrack Reports Export & Download E2E System >> should login, access /reports, inspect UI modules, and download PDF, CSV, and JSON
- Location: tests\e2e\reports-export.spec.ts:6:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e9]:
    - heading "Sign in to LearnTrack" [level=3] [ref=e10]
    - paragraph [ref=e11]: Deliberate learning planner, 45m focus blocks, and spaced revisions
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - text: Email address
        - textbox "Email address" [ref=e15]:
          - /placeholder: alex@example.com
      - generic [ref=e16]:
        - text: Password
        - textbox "Password" [ref=e17]:
          - /placeholder: ••••••••
      - button "Click here to fill demo learner credentials" [ref=e19] [cursor=pointer]
    - generic [ref=e23]:
      - button "Sign in" [ref=e24] [cursor=pointer]
      - paragraph [ref=e26]:
        - text: Don't have an account?
        - link "Create account" [ref=e27] [cursor=pointer]:
          - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("LearnTrack Reports Export & Download E2E System", () => {
  4  |   test.setTimeout(60000);
  5  | 
  6  |   test("should login, access /reports, inspect UI modules, and download PDF, CSV, and JSON", async ({
  7  |     page,
  8  |     request,
  9  |   }) => {
  10 |     // 1. Log in with demo account
  11 |     await page.goto("/login");
  12 |     await page.waitForLoadState("networkidle");
  13 | 
  14 |     // Ensure React hydration has attached event listeners
> 15 |     await page.waitForFunction(() => {
     |                ^ Error: page.waitForFunction: Test timeout of 60000ms exceeded.
  16 |       const btn = document.querySelector('button[type="submit"]');
  17 |       return btn && Object.keys(btn).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactProps"));
  18 |     }, { timeout: 15000 });
  19 | 
  20 |     await page.fill('input[id="email"]', "demo@learntrack.app");
  21 |     await page.fill('input[id="password"]', "Password123!");
  22 |     await page.click('button[type="submit"]');
  23 |     await expect(page).toHaveURL(/.*dashboard/, { timeout: 25000 });
  24 | 
  25 |     // 2. Navigate to /reports
  26 |     await page.goto("/reports");
  27 |     await page.waitForLoadState("networkidle");
  28 | 
  29 |     // 3. Verify Header and Page Structure
  30 |     const headerTitle = page.locator("h1");
  31 |     await expect(headerTitle).toContainText("Reports & Data Export Center");
  32 | 
  33 |     const tenantBadge = page.locator("text=Tenant Verified");
  34 |     await expect(tenantBadge).toBeVisible();
  35 | 
  36 |     // 4. Verify Master Hero Card
  37 |     const masterCard = page.locator("text=Complete LearnTrack Portfolio Dossier");
  38 |     await expect(masterCard).toBeVisible();
  39 | 
  40 |     // 5. Verify 8 Module Cards
  41 |     await expect(page.locator("text=Learning Progress & Tasks")).toBeVisible();
  42 |     await expect(page.locator("text=Focus Time & Deep Work")).toBeVisible();
  43 |     await expect(page.locator("text=Learning Logs & Reflections")).toBeVisible();
  44 |     await expect(page.locator("text=Spaced Revision Schedule")).toBeVisible();
  45 |     await expect(page.locator("text=Topic Mastery & Retention")).toBeVisible();
  46 |     await expect(page.locator("text=Calendar & Activity Feed")).toBeVisible();
  47 |     await expect(page.locator("text=Performance Analytics & Streaks")).toBeVisible();
  48 |     await expect(page.locator("text=Financial History & 50/20/20/10")).toBeVisible();
  49 | 
  50 |     // 6. Test Date Range Presets
  51 |     const thisMonthBtn = page.getByRole("button", { name: "This Month" });
  52 |     await thisMonthBtn.click();
  53 |     await expect(thisMonthBtn).toHaveClass(/shadow-sm/);
  54 | 
  55 |     const customBtn = page.getByRole("button", { name: "Custom Range" });
  56 |     await customBtn.click();
  57 |     await expect(page.locator('input[id="custom-from"]')).toBeVisible();
  58 |     await expect(page.locator('input[id="custom-to"]')).toBeVisible();
  59 | 
  60 |     // 7. Verify In-Browser Download Triggers (Download Event Capture)
  61 |     // Download CSV
  62 |     const [csvDownload] = await Promise.all([
  63 |       page.waitForEvent("download"),
  64 |       page.locator('button:has-text("Unified CSV")').click(),
  65 |     ]);
  66 |     expect(csvDownload.suggestedFilename()).toContain(".csv");
  67 | 
  68 |     // Download PDF
  69 |     const [pdfDownload] = await Promise.all([
  70 |       page.waitForEvent("download"),
  71 |       page.locator('button:has-text("Master PDF")').click(),
  72 |     ]);
  73 |     expect(pdfDownload.suggestedFilename()).toContain(".pdf");
  74 | 
  75 |     // Download JSON
  76 |     const [jsonDownload] = await Promise.all([
  77 |       page.waitForEvent("download"),
  78 |       page.locator('button:has-text("Full JSON")').click(),
  79 |     ]);
  80 |     expect(jsonDownload.suggestedFilename()).toContain(".json");
  81 | 
  82 |     // 8. Test API Security: Unauthenticated request should be rejected with 401
  83 |     const unauthResponse = await request.get("http://localhost:3001/api/reports/download?type=focus-time&format=pdf");
  84 |     expect(unauthResponse.status()).toBe(401);
  85 |   });
  86 | });
  87 | 
```