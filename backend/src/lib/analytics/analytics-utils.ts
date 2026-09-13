import {
  parseISODate,
  formatDateToISO,
  getTodayISO,
  getRelativeDateISO,
} from "@/lib/date-utils";
import type {
  AnalyticsDateRange,
  AnalyticsSummaryDTO,
  DailyFocusDataPoint,
  RevisionAdherenceDTO,
  CategoryDistributionItem,
  DeterministicInsight,
} from "./analytics-types";

/**
 * Calculates start and end ISO date strings (YYYY-MM-DD) for a given date range.
 */
export function calculateDateRangeBounds(
  range: AnalyticsDateRange,
  todayISO: string
): { startDate: string | null; endDate: string } {
  const endDate = todayISO;

  switch (range) {
    case "7d":
      return {
        startDate: getRelativeDateISO(todayISO, -6), // 7 days inclusive: today + previous 6
        endDate,
      };
    case "30d":
      return {
        startDate: getRelativeDateISO(todayISO, -29), // 30 days inclusive
        endDate,
      };
    case "90d":
      return {
        startDate: getRelativeDateISO(todayISO, -89), // 90 days inclusive
        endDate,
      };
    case "all":
      return {
        startDate: null,
        endDate,
      };
  }
}

/**
 * Generates an array of all continuous calendar dates (YYYY-MM-DD) between startDate and endDate.
 */
export function generateDateSequence(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;

  while (current <= endDate) {
    dates.push(current);
    current = getRelativeDateISO(current, 1);
  }

  return dates;
}

/**
 * Formats a short friendly label for chart axes (e.g. "Mon 09/11").
 */
export function formatChartDateLabel(dateISO: string): string {
  try {
    const d = parseISODate(dateISO);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "numeric",
      day: "numeric",
    }).format(d);
  } catch {
    return dateISO;
  }
}

/**
 * Streak Calculation Algorithm (Section 4, docs/12-analytics-specification.md)
 * Strictly evaluates qualifying calendar dates:
 * - Current streak counts backward from today (or yesterday if today has not yet qualified).
 * - Longest streak is the maximum continuous streak ever recorded.
 */
export function calculateStreakFromDates(
  qualifyingDateSet: Set<string>,
  todayISO: string
): { currentStreak: number; longestStreak: number } {
  if (qualifyingDateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const yesterdayISO = getRelativeDateISO(todayISO, -1);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = qualifyingDateSet.has(todayISO)
    ? todayISO
    : qualifyingDateSet.has(yesterdayISO)
      ? yesterdayISO
      : null;

  if (checkDate) {
    while (qualifyingDateSet.has(checkDate)) {
      currentStreak++;
      checkDate = getRelativeDateISO(checkDate, -1);
    }
  }

  // 2. Calculate Longest Streak across all qualifying dates
  const sortedDates = Array.from(qualifyingDateSet).sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const expectedNext = getRelativeDateISO(prevDate, 1);
      if (d === expectedNext) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = d;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Generates deterministic, rule-based insights from verified user metrics without AI.
 */
export function generateDeterministicInsights(
  summary: AnalyticsSummaryDTO,
  adherence: RevisionAdherenceDTO,
  categories: CategoryDistributionItem[],
  hasActivity: boolean
): DeterministicInsight[] {
  const insights: DeterministicInsight[] = [];

  if (!hasActivity) {
    insights.push({
      id: "empty-welcome",
      type: "info",
      title: "Begin Your Learning Journey",
      description:
        "Plan your first topics in the Daily Planner and complete a 45-minute focus session to start tracking your learning retention curve.",
    });
    return insights;
  }

  // 1. Consistency & Streak Insight
  if (summary.currentStreak >= 3) {
    insights.push({
      id: "streak-positive",
      type: "positive",
      title: `${summary.currentStreak}-Day Active Practice Streak`,
      description: `You've maintained regular deliberate practice for ${summary.currentStreak} consecutive qualifying days. Keep the momentum going!`,
    });
  } else if (summary.currentStreak === 0 && summary.longestStreak > 0) {
    insights.push({
      id: "streak-reset",
      type: "info",
      title: "Streak Restart Available",
      description: `Complete at least 45 minutes of focus or 1 spaced revision today to activate a new learning consistency streak.`,
    });
  }

  // 2. Revision Adherence & Overdue Alerts
  if (adherence.overdue > 0) {
    insights.push({
      id: "revision-overdue",
      type: "warning",
      title: `${adherence.overdue} Overdue Spaced ${adherence.overdue === 1 ? "Revision" : "Revisions"}`,
      description:
        "Reviewing topics on schedule strengthens long-term retention before the forgetting curve steepens. Check the Revision Center.",
    });
  } else if (summary.completedRevisions >= 4 && adherence.adherenceRate >= 85) {
    insights.push({
      id: "revision-adherence-high",
      type: "positive",
      title: "Exceptional Revision Adherence",
      description: `You have completed ${Math.round(adherence.adherenceRate)}% of your scheduled revisions on-time, cementing neural retention.`,
    });
  }

  // 3. Focus Session Efficiency
  if (summary.completedFocusSessions >= 3 && summary.focusCompletionRate >= 85) {
    insights.push({
      id: "focus-rate-high",
      type: "positive",
      title: "High Focus Discipline",
      description: `${Math.round(summary.focusCompletionRate)}% of your started focus blocks were completed without cancellation or interruption.`,
    });
  } else if (summary.interruptedFocusSessions >= 2 && summary.focusCompletionRate < 70) {
    insights.push({
      id: "focus-rate-low",
      type: "warning",
      title: "Frequent Session Interruptions",
      description:
        "Consider minimizing ambient distractions or adjusting planned session times to protect full 45-minute focus intervals.",
    });
  }

  // 4. Category Specialization
  if (categories.length > 0 && categories[0].totalMinutes >= 90) {
    const top = categories[0];
    const hours = (top.totalMinutes / 60).toFixed(1);
    insights.push({
      id: "top-category",
      type: "info",
      title: `Top Focus Subject: ${top.categoryName}`,
      description: `You have invested ${hours} hours (${Math.round(top.percentage)}% of total study time) into ${top.categoryName}.`,
    });
  }

  // 5. Mastery Milestone
  if (summary.topicsFullyCompleted > 0) {
    insights.push({
      id: "topics-mastered",
      type: "positive",
      title: `${summary.topicsFullyCompleted} Fully Mastered ${summary.topicsFullyCompleted === 1 ? "Topic" : "Topics"}`,
      description:
        "Topics that complete all 4 revision intervals achieve verified full mastery status.",
    });
  }

  return insights;
}
