import { describe, it, expect, beforeEach } from "vitest";
import { createUser, hashPassword } from "@/server/repositories/user-repository";
import {
  upsertMonthlyBudget,
  createExpense,
  getFinancialHistory,
} from "@/server/repositories/money-repository";

describe("Money Financial History (Monthly, Yearly & Grand Totals)", () => {
  let testUserId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("TestPass123!");
    const user = await createUser({
      name: "Financial History Tester",
      email: `fin_history_${timestamp}@example.com`,
      passwordHash: hash,
    });
    testUserId = user.id;
  });

  it("should return empty financial history when user has no budgets", async () => {
    const history = await getFinancialHistory(testUserId);
    expect(history.monthlyHistory).toEqual([]);
    expect(history.yearlyHistory).toEqual([]);
    expect(history.grandTotal.totalIncome).toBe(0);
    expect(history.grandTotal.totalSpent).toBe(0);
    expect(history.grandTotal.netBalance).toBe(0);
  });

  it("should correctly aggregate multi-year and multi-month financial records", async () => {
    // 2025 records
    const b2025_11 = await upsertMonthlyBudget(testUserId, {
      year: 2025,
      month: 11,
      amount: 4000,
    });
    await createExpense(testUserId, {
      budgetId: b2025_11.id,
      category: "NEEDS",
      amount: 1500,
      date: "2025-11-10",
      note: "Nov 2025 rent",
    });

    const b2025_12 = await upsertMonthlyBudget(testUserId, {
      year: 2025,
      month: 12,
      amount: 6000,
    });
    await createExpense(testUserId, {
      budgetId: b2025_12.id,
      category: "WANTS",
      amount: 2000,
      date: "2025-12-25",
      note: "Holiday gifts",
    });

    // 2026 records
    const b2026_01 = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 1,
      amount: 5000,
    });
    await createExpense(testUserId, {
      budgetId: b2026_01.id,
      category: "GROWTH",
      amount: 1000,
      date: "2026-01-15",
      note: "Annual subscription",
    });

    const b2026_02 = await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 2,
      amount: 8000,
    });
    await createExpense(testUserId, {
      budgetId: b2026_02.id,
      category: "SAVINGS",
      amount: 2500,
      date: "2026-02-01",
      note: "Emergency fund",
    });

    const history = await getFinancialHistory(testUserId);

    // 1. Monthly History Checks
    expect(history.monthlyHistory).toHaveLength(4);
    // Order: 2026-02, 2026-01, 2025-12, 2025-11
    expect(history.monthlyHistory[0].year).toBe(2026);
    expect(history.monthlyHistory[0].month).toBe(2);
    expect(history.monthlyHistory[0].amount).toBe(8000);
    expect(history.monthlyHistory[0].totalSpent).toBe(2500);
    expect(history.monthlyHistory[0].totalRemaining).toBe(5500);

    // 2. Yearly History Checks
    expect(history.yearlyHistory).toHaveLength(2);

    // 2026 Year Summary
    const y2026 = history.yearlyHistory.find((y) => y.year === 2026);
    expect(y2026).toBeDefined();
    expect(y2026?.monthsCount).toBe(2);
    // Income: 5000 + 8000 = 13000
    expect(y2026?.totalIncome).toBe(13000);
    // Spent: 1000 + 2500 = 3500
    expect(y2026?.totalSpent).toBe(3500);
    // Net Balance: 13000 - 3500 = 9500
    expect(y2026?.netBalance).toBe(9500);
    expect(y2026?.isOverBudget).toBe(false);

    // 2025 Year Summary
    const y2025 = history.yearlyHistory.find((y) => y.year === 2025);
    expect(y2025).toBeDefined();
    expect(y2025?.monthsCount).toBe(2);
    // Income: 4000 + 6000 = 10000
    expect(y2025?.totalIncome).toBe(10000);
    // Spent: 1500 + 2000 = 3500
    expect(y2025?.totalSpent).toBe(3500);
    // Net Balance: 10000 - 3500 = 6500
    expect(y2025?.netBalance).toBe(6500);

    // 3. Grand Total Checks
    // All-time Income: 13000 + 10000 = 23000
    expect(history.grandTotal.totalIncome).toBe(23000);
    // All-time Spent: 3500 + 3500 = 7000
    expect(history.grandTotal.totalSpent).toBe(7000);
    // All-time Net Balance: 23000 - 7000 = 16000
    expect(history.grandTotal.netBalance).toBe(16000);
  });

  it("should preserve zero-trust tenant boundaries in financial history", async () => {
    // User A record
    await upsertMonthlyBudget(testUserId, {
      year: 2026,
      month: 9,
      amount: 5000,
    });

    // Create User B
    const userB = await createUser({
      name: "User B",
      email: `user_b_${Date.now()}@example.com`,
      passwordHash: "hash123",
    });

    await upsertMonthlyBudget(userB.id, {
      year: 2026,
      month: 9,
      amount: 99999,
    });

    const historyA = await getFinancialHistory(testUserId);
    expect(historyA.grandTotal.totalIncome).toBe(5000);
    expect(historyA.monthlyHistory).toHaveLength(1);
    expect(historyA.monthlyHistory[0].amount).toBe(5000);
  });
});
