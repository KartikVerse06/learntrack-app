import { apiClient, ApiResponse } from "./client";

export async function getLearningLogsApi(limit = 20, token?: string): Promise<ApiResponse<any[]>> {
  return apiClient<any[]>(`/api/v1/learning-logs?limit=${limit}`, { token });
}

export async function getLearningLogForSessionApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/learning-logs?sessionId=${encodeURIComponent(sessionId)}`, { token });
}

export async function getUnloggedSessionsApi(token?: string): Promise<ApiResponse<any[]>> {
  return apiClient<any[]>("/api/v1/learning-logs/unlogged-sessions", { token });
}

export async function getLearningLogByIdApi(id: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/learning-logs/${id}`, { token });
}

export async function createLearningLogApi(data: any): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/learning-logs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLearningLogApi(id: string, data: any): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/learning-logs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
