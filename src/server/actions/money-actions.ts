"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import {
  SetMonthlyBudgetSchema,
  CreateExpenseSchema,
  DeleteExpenseSchema,
  GetBudgetByMonthSchema,
  type SetMonthlyBudgetInput,
  type CreateExpenseInput,
} from "@/server/validators/money";
import {
  upsertMonthlyBudget,
  createExpense,
  deleteExpense,
  getMoneySummary,
  getMonthlyHistory,
  getFinancialHistory,
} from "@/server/repositories/money-repository";
import type {
  FinancialHistoryDTO,
  MoneyBudgetDTO,
  MoneyExpenseDTO,
  MoneySummaryDTO,
  MonthlyHistoryItemDTO,
} from "@/lib/money/money-types";
import type { ActionResult } from "@/types";

export async function setMonthlyBudgetAction(
  rawInput: SetMonthlyBudgetInput
): Promise<ActionResult<MoneyBudgetDTO>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = SetMonthlyBudgetSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please check your budget amount and selected month.",
          details: fieldErrors,
        },
      };
    }

    const { amount, month, year } = parseResult.data;
    const budget = await upsertMonthlyBudget(userId, { amount, month, year });

    revalidatePath("/money");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: budget,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set monthly budget.";
    return {
      success: false,
      error: {
        code: "SET_BUDGET_FAILED",
        message,
      },
    };
  }
}

export async function createExpenseAction(
  rawInput: CreateExpenseInput
): Promise<ActionResult<MoneyExpenseDTO>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CreateExpenseSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the expense form errors.",
          details: fieldErrors,
        },
      };
    }

    const { budgetId, category, amount, date, note } = parseResult.data;
    const expense = await createExpense(userId, {
      budgetId,
      category,
      amount,
      date,
      note,
    });

    revalidatePath("/money");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create expense.";
    return {
      success: false,
      error: {
        code: "CREATE_EXPENSE_FAILED",
        message,
      },
    };
  }
}

export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = DeleteExpenseSchema.safeParse({ expenseId });
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense ID.",
        },
      };
    }

    const result = await deleteExpense(userId, expenseId);

    revalidatePath("/money");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete expense.";
    return {
      success: false,
      error: {
        code: "DELETE_EXPENSE_FAILED",
        message,
      },
    };
  }
}

export async function getMoneySummaryAction(
  year?: number,
  month?: number
): Promise<ActionResult<MoneySummaryDTO>> {
  try {
    const { userId } = await requireAuth();

    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    const parseResult = GetBudgetByMonthSchema.safeParse({
      year: targetYear,
      month: targetMonth,
    });
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid year or month requested.",
        },
      };
    }

    const summary = await getMoneySummary(userId, targetYear, targetMonth);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve money summary.";
    return {
      success: false,
      error: {
        code: "GET_SUMMARY_FAILED",
        message,
      },
    };
  }
}

export async function getMonthlyHistoryAction(): Promise<
  ActionResult<MonthlyHistoryItemDTO[]>
> {
  try {
    const { userId } = await requireAuth();

    const history = await getMonthlyHistory(userId);

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve monthly history.";
    return {
      success: false,
      error: {
        code: "GET_HISTORY_FAILED",
        message,
      },
    };
  }
}

export async function getFinancialHistoryAction(): Promise<
  ActionResult<FinancialHistoryDTO>
> {
  try {
    const { userId } = await requireAuth();

    const history = await getFinancialHistory(userId);

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve financial history.";
    return {
      success: false,
      error: {
        code: "GET_FINANCIAL_HISTORY_FAILED",
        message,
      },
    };
  }
}

// Aliases matching standard naming
export const setMonthlyBudget = setMonthlyBudgetAction;
export const createMoneyExpense = createExpenseAction;
export const deleteMoneyExpense = deleteExpenseAction;
export const getMoneySummaryQuery = getMoneySummaryAction;
export const getMonthlyHistoryQuery = getMonthlyHistoryAction;
export const getFinancialHistoryQuery = getFinancialHistoryAction;
