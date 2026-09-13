"use server";

import { getSessionToken } from "@/lib/session";
import { getAnalyticsApi } from "@/lib/api/analytics";
import type { ActionResult } from "@/types";

export async function getAnalyticsDataAction(
  range: string = "30d",
  timezone?: string
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await getAnalyticsApi(range, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch analytics" },
    };
  }
  return { success: true, data: res.data };
}
