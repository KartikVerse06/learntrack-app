import Cookies from "js-cookie";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://learntrack-app.onrender.com"
    : "http://localhost:4001");

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
  const cookieToken = Cookies.get("learntrack_token") || Cookies.get("token");
  if (cookieToken && cookieToken !== "undefined" && cookieToken !== "null") {
    try {
      if (!localStorage.getItem("learntrack_token")) {
        localStorage.setItem("learntrack_token", cookieToken);
      }
    } catch {
      // Ignore localStorage failure
    }
    return cookieToken;
  }
  try {
    const localToken = localStorage.getItem("learntrack_token");
    if (localToken && localToken !== "undefined" && localToken !== "null") {
      const cookieOptions = {
        expires: 7,
        path: "/",
        sameSite: "lax" as const,
        secure: window.location.protocol === "https:",
      };
      Cookies.set("learntrack_token", localToken, cookieOptions);
      Cookies.set("token", localToken, cookieOptions);
      return localToken;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Asynchronously guarantees that the client has an auth token.
 * If localStorage/cookies are unhydrated in the browser, fetches the verified
 * session token from the server cookie bridge (/api/auth/session).
 */
export async function ensureClientAuthToken(): Promise<string | undefined> {
  const existing = getClientAuthToken();
  if (existing) return existing;
  if (typeof window === "undefined") return undefined;

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.authenticated && data.token) {
        setClientAuthToken(data.token);
        return data.token;
      }
    }
  } catch {
    // Network or internal route error
  }
  return undefined;
}

export function setClientAuthToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  const cookieOptions = {
    expires: 7,
    path: "/",
    sameSite: "lax" as const,
    secure: window.location.protocol === "https:",
  };
  Cookies.set("learntrack_token", token, cookieOptions);
  Cookies.set("token", token, cookieOptions);
  try {
    localStorage.setItem("learntrack_token", token);
  } catch {
    // Ignore localStorage failures (e.g. private browsing quota)
  }
}

export function removeClientAuthToken(): void {
  if (typeof window === "undefined") return;
  Cookies.remove("learntrack_token", { path: "/" });
  Cookies.remove("token", { path: "/" });
  try {
    localStorage.removeItem("learntrack_token");
  } catch {
    // Ignore localStorage failures
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
  const { token, headers: customHeaders, ...restOptions } = options;
  let authToken = token;

  if (!authToken) {
    if (typeof window !== "undefined") {
      authToken = getClientAuthToken() || (await ensureClientAuthToken());
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
    headers["x-auth-token"] = authToken;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      credentials: "include",
    });

    // If 401 Unauthorized on explicit auth validation endpoint, clear client token
    if (response.status === 401 && typeof window !== "undefined" && endpoint.includes("/auth/")) {
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
