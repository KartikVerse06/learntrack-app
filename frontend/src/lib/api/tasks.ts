import { apiClient, ApiResponse } from "./client";

export async function getTasksApi(date?: string, token?: string): Promise<ApiResponse<any[]>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiClient<any[]>(`/api/v1/tasks${query}`, { token });
}

export async function getTaskSummaryApi(date?: string, token?: string): Promise<ApiResponse<any>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiClient<any>(`/api/v1/tasks/summary${query}`, { token });
}

export async function getTaskByIdApi(id: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/tasks/${id}`, { token });
}

export async function createTaskApi(data: any): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTaskApi(id: string, data: any): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTaskApi(id: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function toggleTaskStatusApi(id: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/tasks/${id}/toggle`, {
    method: "POST",
  });
}
