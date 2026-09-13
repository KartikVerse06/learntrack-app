"use server";

import { getSessionToken } from "@/lib/session";
import { getReportOverviewStatsApi } from "@/lib/api/reports";
import type { ActionResult } from "@/types";

export interface ReportOverviewStats {
  learningTasks: number;
  focusMinutes: number;
  learningLogs: number;
  revisionsDue: number;
  masteredTopics: number;
  currentStreak: number;
  monthlyIncome: number;
  totalTasks?: number;
}

export async function getReportOverviewStatsAction(
  range: string = "30d",
  from?: string,
  to?: string
): Promise<ActionResult<ReportOverviewStats>> {
  const token = await getSessionToken();
  const res = await getReportOverviewStatsApi(range, from, to, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch report stats" },
    };
  }
  return { success: true, data: res.data };
}

export async function previewReportAction(
  params: any
): Promise<ActionResult<any>> {
  // In frontend, preview can be handled by client fetching or calling the stats API
  return {
    success: true,
    data: {},
  };
}
