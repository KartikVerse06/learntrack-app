import { test, expect } from "@playwright/test";

test.describe("Full Learning Lifecycle E2E Journey", () => {
  test.setTimeout(120000);

  const timestamp = Date.now();
  const testUser = {
    name: "Lifecycle Explorer",
    email: `lifecycle_e2e_${timestamp}@example.com`,
    password: "Password123!",
  };

  test("should execute complete integrated user journey: Register -> Plan -> Focus -> Log -> Learn -> Revisions -> Calendar -> Analytics", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION & DASHBOARD
    // -------------------------------------------------------------------------
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

    expect(page.url()).toContain("/dashboard");

    // -------------------------------------------------------------------------
    // 2. DAILY PLANNER: CREATE LEARNING TASK
    // -------------------------------------------------------------------------
    await page.goto("/planner");
    await expect(page.getByRole("heading", { name: /daily learning planner/i })).toBeVisible();

    // Click Add Learning Task / Plan Your First Topic button
    const addTaskButton = page.getByRole("button", {
      name: /add learning task|plan your first topic/i,
    }).first();
    await expect(addTaskButton).toBeVisible();
    await addTaskButton.click();

    // Fill Task Form Dialog
    const titleInput = page.locator('input[id="task-title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Raft Consensus Architecture");

    const submitTaskButton = page.locator('button[type="submit"]:has-text("Add to Agenda")');
    await expect(submitTaskButton).toBeVisible();
    await submitTaskButton.click();

    // Verify task appears on the planner agenda
    await expect(page.getByText("Raft Consensus Architecture").first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 3. FOCUS SESSION: LAUNCH AND COMPLETE 45-MINUTE BLOCK
    // -------------------------------------------------------------------------
    // Click Start Focus link directly on the task card
    const startFocusLink = page.getByRole("link", { name: /start focus/i }).first();
    await expect(startFocusLink).toBeVisible();
    await startFocusLink.click();

    await page.waitForURL("**/focus**");
    expect(page.url()).toContain("/focus");

    // If on focus landing card, click "Start Focus Block" button
    const startBlockButton = page.getByRole("button", { name: /start focus block/i });
    if (await startBlockButton.isVisible()) {
      await startBlockButton.click();
    }

    // Verify timer clock is visible
    await expect(page.getByText(/\d{1,2}:\d{2}/)).toBeVisible();

    // Complete session early using deterministic "Finish Early" control
    const finishEarlyButton = page.getByRole("button", { name: /finish early/i });
    await expect(finishEarlyButton).toBeVisible();
    await finishEarlyButton.click();

    // Confirm in dialog
    const confirmFinishButton = page.getByRole("button", { name: /log completed time/i });
    await expect(confirmFinishButton).toBeVisible();
    await confirmFinishButton.click();

    // -------------------------------------------------------------------------
    // 4. LEARNING LOG MODAL: SUBMIT REFLECTION
    // -------------------------------------------------------------------------
    const whatLearnedTextarea = page.locator("textarea#whatLearned");
    await expect(whatLearnedTextarea).toBeVisible();
    await whatLearnedTextarea.fill(
      "Mastered Raft leader election, randomized election timeouts, and heartbeat intervals."
    );

    const saveLogButton = page.getByRole("button", { name: /save & return to planner/i });
    await expect(saveLogButton).toBeVisible();
    await saveLogButton.click();

    await page.waitForURL("**/planner");
    expect(page.url()).toContain("/planner");

    // -------------------------------------------------------------------------
    // 5. TASK DETAILS: MARK AS LEARNED & SCHEDULE REVISIONS
    // -------------------------------------------------------------------------
    // Click Details link on the task card
    const detailsLink = page.getByRole("link", { name: /details/i }).first();
    await expect(detailsLink).toBeVisible();
    await detailsLink.click();

    await page.waitForURL("**/tasks/**");
    expect(page.url()).toContain("/tasks/");

    // Click Mark as Learned
    const markLearnedBtn = page.getByRole("button", { name: /mark as learned/i }).first();
    await expect(markLearnedBtn).toBeVisible();
    await markLearnedBtn.click();

    const confirmCycleBtn = page.getByRole("button", {
      name: /confirm & start 30-day cycle/i,
    });
    await expect(confirmCycleBtn).toBeVisible();
    await confirmCycleBtn.click();

    // Verify 4 revision milestones are visible on the roadmap tab
    await expect(page.getByText(/revision 1/i)).toBeVisible();
    await expect(page.getByText(/revision 4/i)).toBeVisible();

    // -------------------------------------------------------------------------
    // 6. REVISION CENTER: VERIFY REVISION MILESTONES
    // -------------------------------------------------------------------------
    await page.goto("/revisions");
    await expect(page.getByRole("heading", { name: /revision/i })).toBeVisible();
    await expect(page.getByText("Raft Consensus Architecture").first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 7. CALENDAR: VERIFY CALENDAR RENDERING
    // -------------------------------------------------------------------------
    await page.goto("/calendar");
    await expect(page.locator(".fc, [data-testid='calendar'], .fc-view-harness").first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 8. ANALYTICS: VERIFY METRICS & KPI DASHBOARD
    // -------------------------------------------------------------------------
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();
    await expect(page.getByText(/total focus/i).first()).toBeVisible();
  });
});
