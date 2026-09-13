import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache revalidation in test environment
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock requireAuth to return our test user
let mockUserId = "test-user-actions";

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => ({
    userId: mockUserId,
    userEmail: "test_actions@example.com",
    userName: "Action Tester",
  })),
}));

import {
  setMonthlyBudgetAction,
  createExpenseAction,
  deleteExpenseAction,
  getMoneySummaryAction,
} from "@/server/actions/money-actions";
import { createUser, hashPassword } from "@/server/repositories/user-repository";
import { upsertMonthlyBudget } from "@/server/repositories/money-repository";

describe("Money Server Actions", () => {
  let realUserBudget: { id: string };

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("ActionPass123!");
    const user = await createUser({
      name: "Server Action User",
      email: `action_${timestamp}@example.com`,
      passwordHash: hash,
    });
    mockUserId = user.id;

    const budget = await upsertMonthlyBudget(mockUserId, {
      year: 2026,
      month: 9,
      amount: 5000,
    });
    realUserBudget = budget;
  });

  it("should fail with VALIDATION_ERROR on non-positive budget amounts", async () => {
    const res = await setMonthlyBudgetAction({
      year: 2026,
      month: 9,
      amount: -500,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("VALIDATION_ERROR");
      expect(res.error.details?.amount).toBeDefined();
    }
  });

  it("should fail with VALIDATION_ERROR on invalid month numbers", async () => {
    const res = await setMonthlyBudgetAction({
      year: 2026,
      month: 13,
      amount: 5000,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("VALIDATION_ERROR");
      expect(res.error.details?.month).toBeDefined();
    }
  });

  it("should successfully set monthly budget and return standardized ActionResult envelope", async () => {
    const res = await setMonthlyBudgetAction({
      year: 2026,
      month: 9,
      amount: 7500,
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.amount).toBe(7500);
      expect(res.data.needsAmount).toBe(3750);
      expect(res.data.savingsAmount).toBe(1500);
      expect(res.data.growthAmount).toBe(1500);
      expect(res.data.wantsAmount).toBe(750);
    }
  });

  it("should validate and create expense via Server Action", async () => {
    const res = await createExpenseAction({
      budgetId: realUserBudget.id,
      category: "GROWTH",
      amount: 999,
      date: "2026-09-12",
      note: "Typescript Masterclass",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe("GROWTH");
      expect(res.data.amount).toBe(999);
      expect(res.data.note).toBe("Typescript Masterclass");
    }
  });

  it("should fail on invalid expense category", async () => {
    const res = await createExpenseAction({
      budgetId: realUserBudget.id,
      // @ts-expect-error invalid category
      category: "LUXURY",
      amount: 100,
      date: "2026-09-12",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should retrieve money summary for the active month", async () => {
    const res = await getMoneySummaryAction(2026, 9);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.budget).not.toBeNull();
      expect(res.data.budget?.amount).toBe(5000);
      expect(res.data.categoryBreakdown.NEEDS.allocated).toBe(2500);
    }
  });
});
