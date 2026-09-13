import { apiClient, ApiResponse } from "./client";

export async function getRevisionsApi(
  filter: string = "due",
  categoryId?: string,
  token?: string
): Promise<ApiResponse<any[]>> {
  let query = `?filter=${encodeURIComponent(filter)}`;
  if (categoryId) query += `&categoryId=${encodeURIComponent(categoryId)}`;
  return apiClient<any[]>(`/api/v1/revisions${query}`, { token });
}

export async function getRevisionMetricsApi(token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/revisions/metrics", { token });
}

export async function getRevisionByIdApi(id: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/revisions/${id}`, { token });
}

export async function completeRevisionApi(id: string, data: { confidence: number; notes?: string }): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/revisions/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markTopicAsLearnedApi(taskId: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/revisions/mark-learned", {
    method: "POST",
    body: JSON.stringify({ taskId }),
  });
}
