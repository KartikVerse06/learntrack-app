"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";
import {
  getMoneySummaryApi,
  getFinancialHistoryApi,
  setMonthlyBudgetApi,
  createExpenseApi,
  deleteExpenseApi,
} from "@/lib/api/money";
import type { ActionResult } from "@/types";

export async function getMoneySummaryAction(
  month?: number,
  year?: number
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await getMoneySummaryApi(month, year, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch money summary" },
    };
  }
  return { success: true, data: res.data };
}

export async function getFinancialHistoryAction(): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await getFinancialHistoryApi(token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch financial history" },
    };
  }
  return { success: true, data: res.data };
}

export async function setMonthlyBudgetAction(
  rawInput: { amount: number; month: number; year: number }
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await setMonthlyBudgetApi(rawInput, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "BUDGET_FAILED", message: res.error?.message || "Failed to set budget" },
    };
  }
  revalidatePath("/money");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function createExpenseAction(
  rawInput: any
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await createExpenseApi(rawInput, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "EXPENSE_FAILED", message: res.error?.message || "Failed to add expense", details: res.error?.details },
    };
  }
  revalidatePath("/money");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function deleteExpenseAction(
  rawInput: string | { expenseId: string }
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const expenseId = typeof rawInput === "string" ? rawInput : rawInput.expenseId;
  const res = await deleteExpenseApi(expenseId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "DELETE_EXPENSE_FAILED", message: res.error?.message || "Failed to delete expense" },
    };
  }
  revalidatePath("/money");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export const getMonthlyHistoryAction = getFinancialHistoryAction;
