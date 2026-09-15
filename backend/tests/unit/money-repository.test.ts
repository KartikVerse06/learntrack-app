import { describe, it, expect, beforeEach } from "vitest";
import { createUser, hashPassword } from "@/repositories/user-repository";
import {
  upsertMonthlyBudget,
  getBudgetByMonth,
  createExpense,
  deleteExpense,
  getMoneySummary,
  getMonthlyHistory,
} from "@/repositories/money-repository";

describe("Money Repository CRUD & Summaries", () => {
  let testUserId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("TestPass123!");
    const user = await createUser({
      name: "Money Tester",
      email: `money_repo_${timestamp}@example.com`,
      passwordHash: hash,
    });
    testUserId = user.id;
  });

  it("should create and retrieve a monthly budget with server-calculated allocation", async () => {
    const budget = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 9,
      amount: 5000,
    });

    expect(budget).toBeDefined();
    expect(budget.userId).toBe(testUserId);
    expect(budget.year).toBe(2026);
    expect(budget.month).toBe(9);
    expect(budget.amount).toBe(5000);
    expect(budget.needsAmount).toBe(2500);
    expect(budget.savingsAmount).toBe(1000);
    expect(budget.growthAmount).toBe(1000);
    expect(budget.wantsAmount).toBe(500);

    const fetched = await getBudgetByMonth(testUserId, 2026, 9);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(budget.id);
  });

  it("should update existing monthly budget without creating duplicates", async () => {
    const b1 = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 10,
      amount: 5000,
    });

    const b2 = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 10,
      amount: 8000,
    });

    expect(b1.id).toBe(b2.id);
    expect(b2.amount).toBe(8000);
    expect(b2.needsAmount).toBe(4000);
    expect(b2.savingsAmount).toBe(1600);
    expect(b2.growthAmount).toBe(1600);
    expect(b2.wantsAmount).toBe(800);
  });

  it("should record expenses and correctly compute category spent and remaining amounts", async () => {
    const budget = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 11,
      amount: 5000,
    });

    // Add Needs expense (e.g. groceries ₹1,800)
    const exp1 = await createExpense(testUserId, {
      budgetId: budget.id,
      category: "NEEDS",
      amount: 1800,
      date: "2026-11-05",
      note: "Monthly groceries",
    });
    expect(exp1.id).toBeDefined();
    expect(exp1.amount).toBe(1800);

    // Add Growth expense (e.g. Next.js course ₹500)
    await createExpense(testUserId, {
      budgetId: budget.id,
      category: "GROWTH",
      amount: 500,
      date: "2026-11-10",
      note: "Web dev course",
    });

    const summary = await getMoneySummary(testUserId, 2026, 11);
    expect(summary.budget).not.toBeNull();
    expect(summary.totalSpent).toBe(2300);
    expect(summary.totalRemaining).toBe(2700);
    expect(summary.isOverBudget).toBe(false);

    // Needs category check: 2,500 allocated - 1,800 spent = 700 remaining
    expect(summary.categoryBreakdown.NEEDS.allocated).toBe(2500);
    expect(summary.categoryBreakdown.NEEDS.spent).toBe(1800);
    expect(summary.categoryBreakdown.NEEDS.remaining).toBe(700);
    expect(summary.categoryBreakdown.NEEDS.isOverBudget).toBe(false);

    // Growth category check: 1,000 allocated - 500 spent = 500 remaining
    expect(summary.categoryBreakdown.GROWTH.allocated).toBe(1000);
    expect(summary.categoryBreakdown.GROWTH.spent).toBe(500);
    expect(summary.categoryBreakdown.GROWTH.remaining).toBe(500);
  });

  it("should detect when an individual category or total budget is over budget", async () => {
    const budget = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 12,
      amount: 1000,
    });
    // Wants allocation: 10% of 1000 = 100

    await createExpense(testUserId, {
      budgetId: budget.id,
      category: "WANTS",
      amount: 250,
      date: "2026-12-15",
      note: "Concert tickets",
    });

    const summary = await getMoneySummary(testUserId, 2026, 12);
    expect(summary.categoryBreakdown.WANTS.allocated).toBe(100);
    expect(summary.categoryBreakdown.WANTS.spent).toBe(250);
    expect(summary.categoryBreakdown.WANTS.remaining).toBe(-150);
    expect(summary.categoryBreakdown.WANTS.isOverBudget).toBe(true);

    // But overall total remaining is 1000 - 250 = 750 (not over total budget)
    expect(summary.totalRemaining).toBe(750);
    expect(summary.isOverBudget).toBe(false);

    // Now push over total budget
    await createExpense(testUserId, {
      budgetId: budget.id,
      category: "NEEDS",
      amount: 800,
      date: "2026-12-20",
    });

    const overSummary = await getMoneySummary(testUserId, 2026, 12);
    expect(overSummary.totalSpent).toBe(1050);
    expect(overSummary.totalRemaining).toBe(-50);
    expect(overSummary.isOverBudget).toBe(true);
  });

  it("should delete an expense and update totals accordingly", async () => {
    const budget = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 8,
      amount: 5000,
    });

    const exp = await createExpense(testUserId, {
      budgetId: budget.id,
      category: "SAVINGS",
      amount: 1000,
      date: "2026-08-01",
    });

    let summary = await getMoneySummary(testUserId, 2026, 8);
    expect(summary.totalSpent).toBe(1000);

    await deleteExpense(testUserId, exp.id);

    summary = await getMoneySummary(testUserId, 2026, 8);
    expect(summary.totalSpent).toBe(0);
    expect(summary.totalRemaining).toBe(5000);
  });

  it("should return monthly history in descending order", async () => {
    await upsertMonthlyBudget(testUserId, { year: 2026, month: 7, amount: 6500 });
    await upsertMonthlyBudget(testUserId, { year: 2026, month: 8, amount: 8000 });
    await upsertMonthlyBudget(testUserId, { year: 2026, month: 9, amount: 5000 });

    const history = await getMonthlyHistory(testUserId);
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0].month).toBe(9);
    expect(history[1].month).toBe(8);
    expect(history[2].month).toBe(7);
  });
});
