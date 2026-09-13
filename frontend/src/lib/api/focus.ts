import { apiClient, ApiResponse } from "./client";

export async function getActiveFocusSessionApi(token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/focus/active", { token });
}

export async function getFocusSessionByIdApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}`, { token });
}

export async function startFocusSessionApi(taskId: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/focus/start", {
    method: "POST",
    body: JSON.stringify({ taskId }),
  });
}

export async function pauseFocusSessionApi(sessionId: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/pause`, {
    method: "POST",
  });
}

export async function resumeFocusSessionApi(sessionId: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/resume`, {
    method: "POST",
  });
}

export async function completeFocusSessionApi(
  sessionId: string,
  actualDuration: number
): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ actualDuration }),
  });
}

export async function cancelFocusSessionApi(sessionId: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/cancel`, {
    method: "POST",
  });
}
