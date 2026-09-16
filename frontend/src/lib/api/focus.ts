import { apiClient, ApiResponse } from "./client";

export async function getActiveFocusSessionApi(token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/focus/active", { token });
}

export async function getFocusSessionByIdApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}`, { token });
}

export async function startFocusSessionApi(taskId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>("/api/v1/focus/start", {
    method: "POST",
    body: JSON.stringify({ taskId }),
    token,
  });
}

export async function pauseFocusSessionApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/pause`, {
    method: "POST",
    token,
  });
}

export async function resumeFocusSessionApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/resume`, {
    method: "POST",
    token,
  });
}

export async function completeFocusSessionApi(
  sessionId: string,
  actualDuration: number,
  token?: string
): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ actualDuration }),
    token,
  });
}

export async function cancelFocusSessionApi(sessionId: string, token?: string): Promise<ApiResponse<any>> {
  return apiClient<any>(`/api/v1/focus/${sessionId}/cancel`, {
    method: "POST",
    token,
  });
}
