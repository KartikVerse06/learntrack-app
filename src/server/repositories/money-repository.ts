import { prisma } from "@/lib/db";
import {
  calculateMoneyAllocation,
  getMonthName,
  MONEY_CATEGORIES,
} from "@/lib/money/money-utils";
import type {
  CategorySpending,
  FinancialHistoryDTO,
  MoneyAllocation,
  MoneyBudgetDTO,
  MoneyCategory,
  MoneyExpenseDTO,
  MoneySummaryDTO,
  MonthlyHistoryItemDTO,
  YearlyHistoryItemDTO,
} from "@/lib/money/money-types";
import type { MoneyBudget, MoneyExpense } from "@prisma/client";

function toDecimalNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

export function mapBudgetToDTO(budget: MoneyBudget): MoneyBudgetDTO {
  return {
    id: budget.id,
    userId: budget.userId,
    month: budget.month,
    year: budget.year,
    amount: toDecimalNumber(budget.amount),
    needsAmount: toDecimalNumber(budget.needsAmount),
    savingsAmount: toDecimalNumber(budget.savingsAmount),
    growthAmount: toDecimalNumber(budget.growthAmount),
    wantsAmount: toDecimalNumber(budget.wantsAmount),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export function mapExpenseToDTO(expense: MoneyExpense): MoneyExpenseDTO {
  const dateStr =
    expense.date instanceof Date
      ? expense.date.toISOString().split("T")[0]
      : String(expense.date).split("T")[0];

  return {
    id: expense.id,
    userId: expense.userId,
    budgetId: expense.budgetId,
    category: expense.category as MoneyCategory,
    amount: toDecimalNumber(expense.amount),
    date: dateStr,
    note: expense.note,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

/**
 * Upserts a monthly budget for a specific user, year, and month.
 * Calculates the 50/20/20/10 allocation server-side to guarantee integrity.
 */
export async function upsertMonthlyBudget(
  userId: string,
  input: { month: number; year: number; amount: number }
): Promise<MoneyBudgetDTO> {
  const allocation = calculateMoneyAllocation(input.amount);

  const budget = await prisma.moneyBudget.upsert({
    where: {
      unique_user_budget_month: {
        userId,
        year: input.year,
        month: input.month,
      },
    },
    create: {
      userId,
      year: input.year,
      month: input.month,
      amount: input.amount,
      needsAmount: allocation.needs,
      savingsAmount: allocation.savings,
      growthAmount: allocation.growth,
      wantsAmount: allocation.wants,
    },
    update: {
      amount: input.amount,
      needsAmount: allocation.needs,
      savingsAmount: allocation.savings,
      growthAmount: allocation.growth,
      wantsAmount: allocation.wants,
    },
  });

  return mapBudgetToDTO(budget);
}

/**
 * Retrieves a monthly budget for a user by year and month.
 */
export async function getBudgetByMonth(
  userId: string,
  year: number,
  month: number
): Promise<MoneyBudgetDTO | null> {
  const budget = await prisma.moneyBudget.findUnique({
    where: {
      unique_user_budget_month: {
        userId,
        year,
        month,
      },
    },
  });

  return budget ? mapBudgetToDTO(budget) : null;
}

/**
 * Creates an expense against a user's budget with strict zero-trust tenant verification.
 */
export async function createExpense(
  userId: string,
  input: {
    budgetId: string;
    category: MoneyCategory;
    amount: number;
    date: string;
    note?: string | null;
  }
): Promise<MoneyExpenseDTO> {
  // Verify budget belongs to authenticated user
  const budget = await prisma.moneyBudget.findFirst({
    where: {
      id: input.budgetId,
      userId,
    },
  });

  if (!budget) {
    throw new Error("Budget not found or access denied.");
  }

  const expense = await prisma.moneyExpense.create({
    data: {
      userId,
      budgetId: input.budgetId,
      category: input.category,
      amount: input.amount,
      date: new Date(`${input.date}T00:00:00.000Z`),
      note: input.note ? input.note.trim() : null,
    },
  });

  return mapExpenseToDTO(expense);
}

/**
 * Deletes an expense ensuring user ownership.
 */
export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<{ id: string }> {
  const expense = await prisma.moneyExpense.findFirst({
    where: {
      id: expenseId,
      userId,
    },
  });

  if (!expense) {
    throw new Error("Expense not found or access denied.");
  }

  await prisma.moneyExpense.delete({
    where: {
      id: expenseId,
    },
  });

  return { id: expenseId };
}

/**
 * Retrieves comprehensive summary for a given month and year.
 */
export async function getMoneySummary(
  userId: string,
  year: number,
  month: number
): Promise<MoneySummaryDTO> {
  const budget = await prisma.moneyBudget.findUnique({
    where: {
      unique_user_budget_month: {
        userId,
        year,
        month,
      },
    },
    include: {
      expenses: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  const categories: MoneyCategory[] = ["NEEDS", "SAVINGS", "GROWTH", "WANTS"];

  if (!budget) {
    const emptyBreakdown = {} as Record<MoneyCategory, CategorySpending>;
    for (const cat of categories) {
      emptyBreakdown[cat] = {
        category: cat,
        label: MONEY_CATEGORIES[cat].label,
        percentage: 0,
        allocated: 0,
        spent: 0,
        remaining: 0,
        isOverBudget: false,
        description: MONEY_CATEGORIES[cat].description,
      };
    }

    return {
      budget: null,
      allocation: null,
      totalSpent: 0,
      totalRemaining: 0,
      isOverBudget: false,
      categoryBreakdown: emptyBreakdown,
      recentExpenses: [],
    };
  }

  const budgetDTO = mapBudgetToDTO(budget);
  const allocation: MoneyAllocation = {
    needs: budgetDTO.needsAmount,
    savings: budgetDTO.savingsAmount,
    growth: budgetDTO.growthAmount,
    wants: budgetDTO.wantsAmount,
    total: budgetDTO.amount,
  };

  // Group expenses by category using integer cents/paise
  const categorySpentCents: Record<MoneyCategory, number> = {
    NEEDS: 0,
    SAVINGS: 0,
    GROWTH: 0,
    WANTS: 0,
  };

  for (const exp of budget.expenses) {
    const cat = exp.category as MoneyCategory;
    if (categorySpentCents[cat] !== undefined) {
      categorySpentCents[cat] += Math.round(Number(exp.amount) * 100);
    }
  }

  const categoryAllocated: Record<MoneyCategory, number> = {
    NEEDS: budgetDTO.needsAmount,
    SAVINGS: budgetDTO.savingsAmount,
    GROWTH: budgetDTO.growthAmount,
    WANTS: budgetDTO.wantsAmount,
  };

  const categoryBreakdown = {} as Record<MoneyCategory, CategorySpending>;
  let totalSpentCents = 0;

  for (const cat of categories) {
    const spent = categorySpentCents[cat] / 100;
    totalSpentCents += categorySpentCents[cat];
    const allocated = categoryAllocated[cat];
    const remaining = Number((allocated - spent).toFixed(2));
    const isOver = remaining < 0;
    const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

    categoryBreakdown[cat] = {
      category: cat,
      label: MONEY_CATEGORIES[cat].label,
      percentage: pct,
      allocated,
      spent,
      remaining,
      isOverBudget: isOver,
      description: MONEY_CATEGORIES[cat].description,
    };
  }

  const totalSpent = totalSpentCents / 100;
  const totalRemaining = Number((budgetDTO.amount - totalSpent).toFixed(2));
  const isOverBudget = totalRemaining < 0;

  return {
    budget: budgetDTO,
    allocation,
    totalSpent,
    totalRemaining,
    isOverBudget,
    categoryBreakdown,
    recentExpenses: budget.expenses.map(mapExpenseToDTO),
  };
}

/**
 * Returns all historical monthly budgets for the user with aggregated spending.
 */
export async function getMonthlyHistory(
  userId: string
): Promise<MonthlyHistoryItemDTO[]> {
  const budgets = await prisma.moneyBudget.findMany({
    where: {
      userId,
    },
    include: {
      expenses: {
        select: {
          amount: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return budgets.map((b) => {
    const amount = toDecimalNumber(b.amount);
    const totalSpentCents = b.expenses.reduce(
      (sum: number, exp: { amount: unknown }) =>
        sum + Math.round(Number(exp.amount) * 100),
      0
    );
    const totalSpent = totalSpentCents / 100;
    const totalRemaining = Number((amount - totalSpent).toFixed(2));

    return {
      budgetId: b.id,
      month: b.month,
      year: b.year,
      monthName: `${getMonthName(b.month)} ${b.year}`,
      amount,
      totalIncome: amount,
      totalSpent,
      totalRemaining,
      netBalance: totalRemaining,
      isOverBudget: totalRemaining < 0,
    };
  });
}

/**
 * Returns complete financial history including monthly history, yearly aggregation,
 * and grand totals across all recorded budgets and expenses.
 */
export async function getFinancialHistory(
  userId: string
): Promise<FinancialHistoryDTO> {
  const monthlyHistory = await getMonthlyHistory(userId);

  // Group by year
  const yearMap = new Map<number, MonthlyHistoryItemDTO[]>();
  for (const m of monthlyHistory) {
    const list = yearMap.get(m.year) || [];
    list.push(m);
    yearMap.set(m.year, list);
  }

  const yearlyHistory: YearlyHistoryItemDTO[] = [];
  let grandTotalIncomeCents = 0;
  let grandTotalSpentCents = 0;

  // Process years in descending order
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  for (const year of sortedYears) {
    const months = yearMap.get(year) || [];
    let yearIncomeCents = 0;
    let yearSpentCents = 0;

    for (const m of months) {
      yearIncomeCents += Math.round(m.amount * 100);
      yearSpentCents += Math.round(m.totalSpent * 100);
    }

    const totalIncome = yearIncomeCents / 100;
    const totalSpent = yearSpentCents / 100;
    const netBalance = Number((totalIncome - totalSpent).toFixed(2));

    yearlyHistory.push({
      year,
      totalIncome,
      totalSpent,
      netBalance,
      isOverBudget: netBalance < 0,
      monthsCount: months.length,
      months,
    });

    grandTotalIncomeCents += yearIncomeCents;
    grandTotalSpentCents += yearSpentCents;
  }

  const grandTotalIncome = grandTotalIncomeCents / 100;
  const grandTotalSpent = grandTotalSpentCents / 100;
  const grandNetBalance = Number((grandTotalIncome - grandTotalSpent).toFixed(2));

  return {
    monthlyHistory,
    yearlyHistory,
    grandTotal: {
      totalIncome: grandTotalIncome,
      totalSpent: grandTotalSpent,
      netBalance: grandNetBalance,
    },
  };
}
