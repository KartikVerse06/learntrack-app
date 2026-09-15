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

describe("Money Zero-Trust Multi-Tenant Security", () => {
  let userAId: string;
  let userBId: string;
  let budgetAId: string;
  let budgetBId: string;
  let expenseAId: string;
  let expenseBId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("SecurePass123!");

    const userA = await createUser({
      name: "Tenant Alpha",
      email: `alpha_money_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Tenant Beta",
      email: `beta_money_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    // Create budget for User A
    const budgetA = await upsertMonthlyBudget(userAId, {
      year: 2026,
      month: 9,
      amount: 5000,
    });
    budgetAId = budgetA.id;

    // Create budget for User B
    const budgetB = await upsertMonthlyBudget(userBId, {
      year: 2026,
      month: 9,
      amount: 10000,
    });
    budgetBId = budgetB.id;

    // Create expense for User A
    const expA = await createExpense(userAId, {
      budgetId: budgetAId,
      category: "NEEDS",
      amount: 1000,
      date: "2026-09-02",
      note: "Alpha rent contribution",
    });
    expenseAId = expA.id;

    // Create expense for User B
    const expB = await createExpense(userBId, {
      budgetId: budgetBId,
      category: "WANTS",
      amount: 2500,
      date: "2026-09-03",
      note: "Beta electronics",
    });
    expenseBId = expB.id;
  });

  it("should enforce tenant isolation on budget retrieval", async () => {
    // User A can view User A's budget
    const budgetA = await getBudgetByMonth(userAId, 2026, 9);
    expect(budgetA).not.toBeNull();
    expect(budgetA?.amount).toBe(5000);

    // User B can view User B's budget
    const budgetB = await getBudgetByMonth(userBId, 2026, 9);
    expect(budgetB).not.toBeNull();
    expect(budgetB?.amount).toBe(10000);

    // User A querying for a month User B has won't see User B's data
    const nonExistentForA = await getBudgetByMonth(userAId, 2026, 1);
    expect(nonExistentForA).toBeNull();
  });

  it("should prevent User A from adding an expense to User B's budget (forged budgetId)", async () => {
    // User A tries to attach an expense using User B's budgetId
    await expect(
      createExpense(userAId, {
        budgetId: budgetBId, // Forged
        category: "NEEDS",
        amount: 500,
        date: "2026-09-04",
        note: "Malicious cross-tenant expense",
      })
    ).rejects.toThrow("Budget not found or access denied.");
  });

  it("should prevent User A from deleting User B's expense", async () => {
    // User A tries to delete User B's expense
    await expect(deleteExpense(userAId, expenseBId)).rejects.toThrow(
      "Expense not found or access denied."
    );

    // Verify User B's expense still exists
    const summaryB = await getMoneySummary(userBId, 2026, 9);
    expect(summaryB.recentExpenses.some((e) => e.id === expenseBId)).toBe(true);
  });

  it("should isolate monthly summaries between tenants", async () => {
    const summaryA = await getMoneySummary(userAId, 2026, 9);
    const summaryB = await getMoneySummary(userBId, 2026, 9);

    expect(summaryA.budget?.amount).toBe(5000);
    expect(summaryA.totalSpent).toBe(1000);
    expect(summaryA.recentExpenses.length).toBe(1);
    expect(summaryA.recentExpenses[0].id).toBe(expenseAId);

    expect(summaryB.budget?.amount).toBe(10000);
    expect(summaryB.totalSpent).toBe(2500);
    expect(summaryB.recentExpenses.length).toBe(1);
    expect(summaryB.recentExpenses[0].id).toBe(expenseBId);
  });

  it("should isolate monthly history between tenants", async () => {
    const historyA = await getMonthlyHistory(userAId);
    const historyB = await getMonthlyHistory(userBId);

    expect(historyA.length).toBe(1);
    expect(historyA[0].budgetId).toBe(budgetAId);

    expect(historyB.length).toBe(1);
    expect(historyB[0].budgetId).toBe(budgetBId);
  });
});
