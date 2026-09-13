import { apiClient, setClientAuthToken, removeClientAuthToken, ApiResponse } from "./client";

export interface UserDTO {
  id: string;
  name: string | null;
  email: string;
}

export interface AuthResponseData {
  user: UserDTO;
  token: string;
}

export async function loginApi(credentials: {
  email: string;
  password: string;
}): Promise<ApiResponse<AuthResponseData>> {
  const res = await apiClient<AuthResponseData>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (res.success && res.data?.token) {
    setClientAuthToken(res.data.token);
  }
  return res;
}

export async function registerApi(data: {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}): Promise<ApiResponse<AuthResponseData>> {
  const res = await apiClient<AuthResponseData>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (res.success && res.data?.token) {
    setClientAuthToken(res.data.token);
  }
  return res;
}

export async function getMeApi(token?: string): Promise<ApiResponse<{ user: UserDTO }>> {
  return apiClient<{ user: UserDTO }>("/api/v1/auth/me", { token });
}

export async function logoutApi(): Promise<ApiResponse<{ message: string }>> {
  const res = await apiClient<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
  });
  removeClientAuthToken();
  return res;
}
