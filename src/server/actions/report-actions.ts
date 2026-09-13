"use server";

import { requireAuth } from "@/lib/session";
import {
  reportQuerySchema,
  ReportQueryParams,
  ReportType,
  ReportDateRangePreset,
} from "@/lib/reports/report-types";
import { fetchReportData } from "@/server/repositories/report-repository";
import type { ActionResult } from "@/types";

export interface ReportOverviewStats {
  learningTasks: number;
  focusMinutes: number;
  learningLogs: number;
  revisionsDue: number;
  masteredTopics: number;
  currentStreak: number;
  monthlyIncome: number;
}

/**
 * Fetch executive overview stats for the Reports page header
 */
export async function getReportOverviewStatsAction(
  rangePreset: ReportDateRangePreset = "30d",
  from?: string,
  to?: string
): Promise<ActionResult<ReportOverviewStats>> {
  try {
    const { userId } = await requireAuth();

    // Fetch learning progress, focus time, and revisions in parallel
    const [progress, focus, revisions, analytics, money] = await Promise.all([
      fetchReportData(userId, "learning-progress", rangePreset, from, to),
      fetchReportData(userId, "focus-time", rangePreset, from, to),
      fetchReportData(userId, "revisions", rangePreset, from, to),
      fetchReportData(userId, "analytics", rangePreset, from, to),
      fetchReportData(userId, "money", rangePreset, from, to),
    ]);

    const stats: ReportOverviewStats = {
      learningTasks: progress.summary.totalTasks,
      focusMinutes: focus.summary.totalFocusMinutes,
      learningLogs: progress.summary.completedTasks,
      revisionsDue: revisions.summary.dueToday + revisions.summary.overdue,
      masteredTopics: progress.summary.topicsFullyCompleted,
      currentStreak: analytics.summary.currentStreak,
      monthlyIncome: money.currentBudget?.amount || 0,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("[getReportOverviewStatsAction error]:", error);
    return {
      success: false,
      error: {
        code: "REPORT_STATS_ERROR",
        message: "Failed to load report overview statistics.",
      },
    };
  }
}

/**
 * Preview report data before downloading
 */
export async function previewReportAction(
  params: Omit<ReportQueryParams, "format">
): Promise<ActionResult<unknown>> {
  try {
    const { userId } = await requireAuth();

    const parsed = reportQuerySchema.safeParse({ ...params, format: "json" });
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid report query parameters.",
        },
      };
    }

    const { type, range, from, to, categoryId } = parsed.data;
    const data = await fetchReportData(userId, type, range, from, to, categoryId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[previewReportAction error]:", error);
    return {
      success: false,
      error: {
        code: "PREVIEW_ERROR",
        message: "Failed to generate report preview.",
      },
    };
  }
}
