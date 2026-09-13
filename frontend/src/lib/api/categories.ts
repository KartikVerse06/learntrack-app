import { apiClient, ApiResponse } from "./client";

export async function getCategoriesApi(token?: string): Promise<ApiResponse<any[]>> {
  return apiClient<any[]>("/api/v1/categories", { token });
}

export async function createCategoryApi(data: { name: string; color?: string }): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
