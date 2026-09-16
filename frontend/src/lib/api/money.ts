import { apiClient, ApiResponse } from "./client";

export async function getMoneySummaryApi(
  month?: number,
  year?: number,
  token?: string
): Promise<ApiResponse<any>> {
  let query = "";
  const params = [];
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  if (params.length) query = `?${params.join("&")}`;

  return apiClient<any>(`/api/v1/money/summary${query}`, { token });
}

export async function getFinancialHistoryApi(token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/money/history", { token });
}

export async function setMonthlyBudgetApi(
  data: {
    amount: number;
    month: number;
    year: number;
  },
  token?: string
): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/money/budget", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function createExpenseApi(
  data: {
    budgetId: string;
    category: "NEEDS" | "SAVINGS" | "GROWTH" | "WANTS";
    amount: number;
    date: string;
    note?: string | null;
  },
  token?: string
): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/money/expenses", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteExpenseApi(id: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/money/expenses/${id}`, {
    method: "DELETE",
    token,
  });
}
