import { apiClient, API_BASE_URL, getClientAuthToken, ApiResponse } from "./client";

export async function getReportOverviewStatsApi(
  range: string = "30d",
  from?: string,
  to?: string,
  token?: string
): Promise<ApiResponse<any>> {
  const params = new URLSearchParams({ range });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return apiClient<any>(`/api/v1/reports/stats?${params.toString()}`, { token });
}

export async function downloadReportFile(params: {
  type: string;
  format: "pdf" | "csv" | "json";
  range: string;
  from?: string;
  to?: string;
  categoryId?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Browser only" };

  try {
    const urlParams = new URLSearchParams({
      type: params.type,
      format: params.format,
      range: params.range,
    });
    if (params.from) urlParams.set("from", params.from);
    if (params.to) urlParams.set("to", params.to);
    if (params.categoryId) urlParams.set("categoryId", params.categoryId);

    const downloadUrl = `${API_BASE_URL}/api/v1/reports/download?${urlParams.toString()}`;
    const token = getClientAuthToken();

    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      return {
        success: false,
        error: errorJson?.error?.message || `Download failed with status ${response.status}`,
      };
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `learntrack-${params.type}-${new Date().toISOString().slice(0, 10)}.${params.format}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Network error during download",
    };
  }
}
