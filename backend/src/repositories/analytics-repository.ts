import { prisma } from "@/lib/db";
import {
  parseISODate,
  formatDateToISO,
  getTodayISO,
  getRelativeDateISO,
} from "@/lib/date-utils";
import {
  calculateDateRangeBounds,
  generateDateSequence,
  formatChartDateLabel,
  calculateStreakFromDates,
  generateDeterministicInsights,
} from "@/lib/analytics/analytics-utils";
import type {
  AnalyticsDateRange,
  AnalyticsSummaryDTO,
  DailyFocusDataPoint,
  RevisionAdherenceDTO,
  ConfidenceTrajectoryPoint,
  CategoryDistributionItem,
  TopicStatusDistribution,
  AnalyticsPayloadDTO,
} from "@/lib/analytics/analytics-types";

/**
 * Aggregates all analytics metrics for an authenticated user across the specified date range.
 * Zero-Trust Multi-Tenant Boundaries: Every Prisma query filters strictly by `userId`.
 */
export async function getFullAnalyticsPayload(
  userId: string,
  range: AnalyticsDateRange = "30d",
  userTimezone = "UTC"
): Promise<AnalyticsPayloadDTO> {
  const todayISO = getTodayISO(userTimezone);
  const { startDate, endDate } = calculateDateRangeBounds(range, todayISO);

  // Date range filters for queries with timestamp / date fields
  const focusDateFilter = startDate
    ? {
        startedAt: {
          gte: parseISODate(startDate),
          lte: new Date(parseISODate(endDate).getTime() + 86400000 - 1),
        },
      }
    : {};

  // Execute analytics subqueries concurrently to eliminate serial database round-trip waterfalls
  const [
    focusSessions,
    tasks,
    revisions,
    logs,
    allCompletedFocus,
    allCompletedRevisions,
  ] = await Promise.all([
    // 1. Fetch Focus Sessions within date range
    prisma.focusSession.findMany({
      where: {
        userId,
        ...focusDateFilter,
      },
      select: {
        id: true,
        status: true,
        actualDuration: true,
        startedAt: true,
        task: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    }),

    // 2. Fetch all Learning Tasks for the user (Mastery Velocity & Status Distribution)
    prisma.learningTask.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        learningCompletedAt: true,
        fullyCompletedAt: true,
        categoryId: true,
      },
    }),

    // 3. Fetch Revisions for the user (Adherence & Stages)
    prisma.revision.findMany({
      where: { userId },
      select: {
        id: true,
        revisionNumber: true,
        scheduledDate: true,
        status: true,
        completedAt: true,
        confidence: true,
      },
    }),

    // 4. Fetch Learning Logs for Confidence Stage 0
    prisma.learningLog.findMany({
      where: { userId },
      select: {
        id: true,
        confidence: true,
        createdAt: true,
      },
    }),

    // 5. Fetch all completed sessions for the lifetime Streak Engine
    prisma.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        startedAt: true,
        actualDuration: true,
      },
    }),

    // 6. Fetch all completed revisions for the lifetime Streak Engine
    prisma.revision.findMany({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { not: null },
      },
      select: {
        completedAt: true,
      },
    }),
  ]);

  // --- Compute Focus Metrics & Daily Time Series ---
  let completedFocusCount = 0;
  let interruptedFocusCount = 0;
  let totalFocusSeconds = 0;

  // Map to store daily focus minutes { "YYYY-MM-DD": { minutes: number, count: number } }
  const dailyFocusMap = new Map<string, { minutes: number; count: number }>();

  // Map to store category minutes { categoryKey: { id, name, color, minutes, taskCount } }
  const categoryMap = new Map<
    string,
    { id: string | null; name: string; color: string; minutes: number; taskCount: Set<string> }
  >();

  for (const session of focusSessions) {
    if (session.status === "COMPLETED") {
      completedFocusCount++;
      totalFocusSeconds += session.actualDuration;

      // Group by calendar date in user's timezone
      const dateKey = formatDateToISO(session.startedAt);
      const minutes = Math.round(session.actualDuration / 60);

      const existing = dailyFocusMap.get(dateKey) ?? { minutes: 0, count: 0 };
      existing.minutes += minutes;
      existing.count += 1;
      dailyFocusMap.set(dateKey, existing);

      // Category aggregation
      const cat = session.task?.category;
      const catKey = cat?.id ?? "uncategorized";
      const catEntry = categoryMap.get(catKey) ?? {
        id: cat?.id ?? null,
        name: cat?.name ?? "General Learning",
        color: cat?.color ?? "#64748B",
        minutes: 0,
        taskCount: new Set<string>(),
      };
      catEntry.minutes += minutes;
      if (session.task?.categoryId) {
        catEntry.taskCount.add(session.task.categoryId);
      }
      categoryMap.set(catKey, catEntry);
    } else if (session.status === "CANCELLED" || session.status === "INTERRUPTED") {
      interruptedFocusCount++;
    }
  }

  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
  const totalStartedSessions = completedFocusCount + interruptedFocusCount;
  const focusCompletionRate =
    totalStartedSessions > 0
      ? Math.round((completedFocusCount / totalStartedSessions) * 100)
      : 100;
  const averageSessionMinutes =
    completedFocusCount > 0 ? Math.round(totalFocusMinutes / completedFocusCount) : 0;

  // Construct continuous daily focus series for chart
  const effectiveStartDate =
    startDate ??
    (dailyFocusMap.size > 0
      ? Array.from(dailyFocusMap.keys()).sort()[0]
      : getRelativeDateISO(todayISO, -29));

  const continuousDates = generateDateSequence(effectiveStartDate, endDate);
  const dailyFocus: DailyFocusDataPoint[] = continuousDates.map((d) => {
    const entry = dailyFocusMap.get(d) ?? { minutes: 0, count: 0 };
    return {
      date: d,
      label: formatChartDateLabel(d),
      focusMinutes: entry.minutes,
      sessionCount: entry.count,
    };
  });

  // --- Compute Revision Adherence Metrics ---
  let onTimeRevisions = 0;
  let lateRevisions = 0;
  let pendingRevisions = 0;
  let overdueRevisions = 0;
  let totalCompletedRevisions = 0;

  for (const rev of revisions) {
    const schedDateStr = formatDateToISO(rev.scheduledDate);

    if (rev.status === "COMPLETED") {
      totalCompletedRevisions++;
      const completedDateStr = rev.completedAt ? formatDateToISO(rev.completedAt) : schedDateStr;
      if (completedDateStr <= schedDateStr) {
        onTimeRevisions++;
      } else {
        lateRevisions++;
      }
    } else {
      if (schedDateStr < todayISO) {
        overdueRevisions++;
      } else {
        pendingRevisions++;
      }
    }
  }

  const revisionAdherenceRate =
    totalCompletedRevisions > 0
      ? Math.round((onTimeRevisions / totalCompletedRevisions) * 100)
      : 0;

  const revisionAdherence: RevisionAdherenceDTO = {
    onTime: onTimeRevisions,
    late: lateRevisions,
    pending: pendingRevisions,
    overdue: overdueRevisions,
    adherenceRate: revisionAdherenceRate,
  };

  // --- Compute Topic Status Distribution ---
  let plannedCount = 0;
  let inProgressCount = 0;
  let revisionPendingCount = 0;
  let fullyCompletedCount = 0;
  let topicsLearned = 0;

  for (const t of tasks) {
    if (t.status === "PLANNED") plannedCount++;
    if (t.status === "IN_PROGRESS") inProgressCount++;
    if (t.status === "REVISION_PENDING") revisionPendingCount++;
    if (t.status === "FULLY_COMPLETED") fullyCompletedCount++;

    if (t.learningCompletedAt !== null || t.status === "REVISION_PENDING" || t.status === "FULLY_COMPLETED") {
      topicsLearned++;
    }
  }

  const topicStatusDistribution: TopicStatusDistribution = {
    planned: plannedCount,
    inProgress: inProgressCount,
    revisionPending: revisionPendingCount,
    fullyCompleted: fullyCompletedCount,
    total: tasks.length,
  };

  // --- Compute Confidence Progression Curve (Stages 0..4) ---
  const confidenceByStage: { sum: number; count: number }[] = [
    { sum: 0, count: 0 }, // Stage 0: Initial Log
    { sum: 0, count: 0 }, // Stage 1: Rev 1
    { sum: 0, count: 0 }, // Stage 2: Rev 2
    { sum: 0, count: 0 }, // Stage 3: Rev 3
    { sum: 0, count: 0 }, // Stage 4: Rev 4
  ];

  for (const log of logs) {
    if (log.confidence && log.confidence >= 1 && log.confidence <= 5) {
      confidenceByStage[0].sum += log.confidence;
      confidenceByStage[0].count++;
    }
  }

  for (const rev of revisions) {
    if (rev.confidence && rev.confidence >= 1 && rev.confidence <= 5) {
      const idx = rev.revisionNumber; // 1, 2, 3, 4
      if (idx >= 1 && idx <= 4) {
        confidenceByStage[idx].sum += rev.confidence;
        confidenceByStage[idx].count++;
      }
    }
  }

  const stageLabels = [
    "Initial Log",
    "Rev 1 (Day 0)",
    "Rev 2 (+3d)",
    "Rev 3 (+15d)",
    "Rev 4 (+30d)",
  ];

  const confidenceTrajectory: ConfidenceTrajectoryPoint[] = confidenceByStage.map((s, idx) => ({
    stage: idx,
    stageLabel: stageLabels[idx],
    averageConfidence: s.count > 0 ? Number((s.sum / s.count).toFixed(1)) : null,
    sampleCount: s.count,
  }));

  // --- Compute Category Breakdown ---
  const totalCatMinutes = Array.from(categoryMap.values()).reduce(
    (sum, c) => sum + c.minutes,
    0
  );

  const categoryDistribution: CategoryDistributionItem[] = Array.from(
    categoryMap.values()
  )
    .map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      color: c.color,
      totalMinutes: c.minutes,
      taskCount: c.taskCount.size,
      percentage: totalCatMinutes > 0 ? (c.minutes / totalCatMinutes) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // --- Compute Verified Learning Streak (Lifetime) ---
  // Qualifying day: Day with >= 45m focus OR >= 1 completed revision
  const qualifyingDateSet = new Set<string>();

  // Aggregate daily minutes from all completed focus sessions
  const lifetimeDailyMinutes = new Map<string, number>();
  for (const sess of allCompletedFocus) {
    const dStr = formatDateToISO(sess.startedAt);
    const mins = Math.round(sess.actualDuration / 60);
    lifetimeDailyMinutes.set(dStr, (lifetimeDailyMinutes.get(dStr) ?? 0) + mins);
  }

  for (const [dateStr, mins] of lifetimeDailyMinutes.entries()) {
    if (mins >= 45) {
      qualifyingDateSet.add(dateStr);
    }
  }

  for (const rev of allCompletedRevisions) {
    if (rev.completedAt) {
      const dStr = formatDateToISO(rev.completedAt);
      qualifyingDateSet.add(dStr);
    }
  }

  const { currentStreak, longestStreak } = calculateStreakFromDates(
    qualifyingDateSet,
    todayISO
  );

  // --- Compose Summary DTO ---
  const summary: AnalyticsSummaryDTO = {
    totalFocusMinutes,
    completedFocusSessions: completedFocusCount,
    interruptedFocusSessions: interruptedFocusCount,
    focusCompletionRate,
    averageSessionMinutes,
    topicsLearned,
    topicsFullyCompleted: fullyCompletedCount,
    totalRevisions: revisions.length,
    completedRevisions: totalCompletedRevisions,
    revisionAdherenceRate,
    currentStreak,
    longestStreak,
  };

  const hasActivity =
    completedFocusCount > 0 ||
    tasks.length > 0 ||
    revisions.length > 0 ||
    logs.length > 0;

  const insights = generateDeterministicInsights(
    summary,
    revisionAdherence,
    categoryDistribution,
    hasActivity
  );

  return {
    dateRange: range,
    startDate,
    endDate,
    userTimezone,
    summary,
    dailyFocus,
    revisionAdherence,
    confidenceTrajectory,
    categoryDistribution,
    topicStatusDistribution,
    insights,
    hasActivity,
  };
}
