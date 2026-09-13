import { apiClient, ApiResponse } from "./client";

export async function getAnalyticsApi(range = "30d", token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/analytics?range=${encodeURIComponent(range)}`, { token });
}
