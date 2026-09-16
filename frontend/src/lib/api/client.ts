import Cookies from "js-cookie";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function getClientAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get("learntrack_token") || Cookies.get("token");
}

export function setClientAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  const cookieOptions = {
    expires: 7,
    path: "/",
    sameSite: "lax" as const,
    secure: window.location.protocol === "https:",
  };
  Cookies.set("learntrack_token", token, cookieOptions);
  Cookies.set("token", token, cookieOptions);
}

export function removeClientAuthToken(): void {
  if (typeof window === "undefined") return;
  Cookies.remove("learntrack_token", { path: "/" });
  Cookies.remove("token", { path: "/" });
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
  const { token, headers: customHeaders, ...restOptions } = options;
  let authToken = token;

  if (!authToken) {
    if (typeof window !== "undefined") {
      authToken = getClientAuthToken();
    } else {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        authToken =
          cookieStore.get("learntrack_token")?.value ||
          cookieStore.get("token")?.value;
      } catch {
        // Can fail if called outside of request context on server
      }
    }
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      credentials: "include",
    });

    // If 401 Unauthorized, notify/clear client token if running in browser
    if (response.status === 401 && typeof window !== "undefined") {
      removeClientAuthToken();
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: json?.error?.code || `HTTP_${response.status}`,
          message: json?.error?.message || response.statusText || "Server request failed",
          details: json?.error?.details,
        },
      };
    }

    return json as ApiResponse<T>;
  } catch (error: any) {
    console.error(`[API Client Error]: ${endpoint}`, error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          error.message === "Failed to fetch"
            ? "Unable to connect to the server. Please check your internet or try again."
            : error.message || "Network error occurred",
      },
    };
  }
}
