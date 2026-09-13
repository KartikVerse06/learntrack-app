import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  ReportType,
  ReportDateRangePreset,
  ReportMetadata,
  LearningProgressReportData,
  FocusTimeReportData,
  LearningLogReportData,
  RevisionReportData,
  MasteryReportData,
  CalendarActivityReportData,
  AnalyticsReportData,
  MoneyReportData,
  CompleteReportData,
} from "@/lib/reports/report-types";
import { formatDisplayDate, getTodayISO } from "@/lib/date-utils";
import { getFullAnalyticsPayload } from "./analytics-repository";
import { getMoneySummary, getFinancialHistory } from "./money-repository";
import type { MoneyExpenseDTO } from "@/lib/money/money-types";
import type { AnalyticsDateRange } from "@/lib/analytics/analytics-types";

export interface ReportFilterOptions {
  rangePreset?: ReportDateRangePreset;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  categoryId?: string;
}

/**
 * Resolves a date preset to concrete [startDate, endDate] Date boundaries
 */
export function resolveDateInterval(options: ReportFilterOptions): {
  startDate: Date | undefined;
  endDate: Date | undefined;
  fromStr: string | undefined;
  toStr: string | undefined;
  periodLabel: string;
} {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const preset = options.rangePreset || "30d";

  if (preset === "custom" && options.from && options.to) {
    const start = new Date(options.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(options.to);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      fromStr: options.from,
      toStr: options.to,
      periodLabel: `Custom (${options.from} to ${options.to})`,
    };
  }

  if (preset === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dateStr = start.toISOString().slice(0, 10);
    return {
      startDate: start,
      endDate: today,
      fromStr: dateStr,
      toStr: dateStr,
      periodLabel: "Today",
    };
  }

  if (preset === "this-week") {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const fromStr = start.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    return {
      startDate: start,
      endDate: today,
      fromStr,
      toStr,
      periodLabel: "This Week",
    };
  }

  if (preset === "this-month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
    const fromStr = start.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    return {
      startDate: start,
      endDate: today,
      fromStr,
      toStr,
      periodLabel: "This Month",
    };
  }

  if (preset === "90d") {
    const start = new Date();
    start.setDate(today.getDate() - 90);
    start.setHours(0, 0, 0, 0);
    const fromStr = start.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    return {
      startDate: start,
      endDate: today,
      fromStr,
      toStr,
      periodLabel: "Last 90 Days",
    };
  }

  if (preset === "this-year") {
    const start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
    const fromStr = start.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    return {
      startDate: start,
      endDate: today,
      fromStr,
      toStr,
      periodLabel: "This Year",
    };
  }

  if (preset === "all") {
    return {
      startDate: undefined,
      endDate: undefined,
      fromStr: undefined,
      toStr: undefined,
      periodLabel: "All Time",
    };
  }

  // Default: "30d"
  const start = new Date();
  start.setDate(today.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  const fromStr = start.toISOString().slice(0, 10);
  const toStr = today.toISOString().slice(0, 10);
  return {
    startDate: start,
    endDate: today,
    fromStr,
    toStr,
    periodLabel: "Last 30 Days",
  };
}

/**
 * Retrieve verified user display metadata
 */
async function getUserMetadata(userId: string): Promise<{ name: string; email: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return {
    name: user?.name || "Learner",
    email: user?.email || "learner@learntrack.local",
  };
}

// -------------------------------------------------------------
// 1. LEARNING PROGRESS REPORT DATA
// -------------------------------------------------------------
export async function getLearningProgressReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<LearningProgressReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const whereTask: Prisma.LearningTaskWhereInput = { userId };
  if (options.categoryId) {
    whereTask.categoryId = options.categoryId;
  }
  if (interval.startDate && interval.endDate) {
    whereTask.plannedDate = {
      gte: interval.startDate,
      lte: interval.endDate,
    };
  }

  const [tasks, categories] = await Promise.all([
    prisma.learningTask.findMany({
      where: whereTask,
      include: {
        category: true,
        focusSessions: {
          where: { status: "COMPLETED" },
          select: { actualDuration: true },
        },
      },
      orderBy: { plannedDate: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      include: {
        tasks: {
          where: whereTask.plannedDate ? { plannedDate: whereTask.plannedDate } : undefined,
          include: {
            focusSessions: {
              where: { status: "COMPLETED" },
              select: { actualDuration: true },
            },
          },
        },
      },
    }),
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "LEARNING_COMPLETED" || t.status === "REVISION_PENDING" || t.status === "FULLY_COMPLETED"
  ).length;
  const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "PLANNED").length;
  const archivedTasks = 0;
  const topicsLearned = tasks.filter((t) => t.learningCompletedAt !== null).length;
  const topicsFullyCompleted = tasks.filter((t) => t.status === "FULLY_COMPLETED").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = Math.round(
    tasks.reduce((sum: number, t) => {
      const taskSecs = t.focusSessions.reduce((s: number, f: { actualDuration: number }) => s + f.actualDuration, 0);
      return sum + taskSecs / 60;
    }, 0)
  );

  const categoryStats = categories.map((c) => {
    const cTasks = c.tasks;
    const cCompleted = cTasks.filter((t) => t.status === "LEARNING_COMPLETED" || t.status === "FULLY_COMPLETED").length;
    const cMinutes = Math.round(
      cTasks.reduce(
        (s: number, t) =>
          s + t.focusSessions.reduce((fs: number, f: { actualDuration: number }) => fs + f.actualDuration, 0) / 60,
        0
      )
    );
    return {
      name: c.name,
      color: c.color,
      taskCount: cTasks.length,
      completedCount: cCompleted,
      focusMinutes: cMinutes,
    };
  });

  const metadata: ReportMetadata = {
    reportType: "learning-progress",
    title: "Learning Progress Report",
    generatedAt: new Date().toISOString(),
    periodLabel: interval.periodLabel,
    from: interval.fromStr,
    to: interval.toStr,
    user,
  };

  return {
    metadata,
    summary: {
      totalTasks,
      completedTasks,
      activeTasks,
      archivedTasks,
      topicsLearned,
      topicsFullyCompleted,
      completionPercentage,
      totalFocusMinutes,
    },
    categories: categoryStats,
    tasks: tasks.map((t) => {
      const mins = Math.round(
        t.focusSessions.reduce((s: number, f: { actualDuration: number }) => s + f.actualDuration, 0) / 60
      );
      return {
        id: t.id,
        title: t.title,
        categoryName: t.category?.name || "General",
        priority: t.priority,
        status: t.status,
        completedSessions: t.completedSessions,
        estimatedSessions: t.estimatedSessions,
        totalFocusMinutes: mins,
        plannedDate: t.plannedDate.toISOString().slice(0, 10),
        learningCompletedAt: t.learningCompletedAt ? t.learningCompletedAt.toISOString().slice(0, 10) : null,
      };
    }),
  };
}

// -------------------------------------------------------------
// 2. FOCUS TIME REPORT DATA
// -------------------------------------------------------------
export async function getFocusTimeReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<FocusTimeReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const whereSession: Prisma.FocusSessionWhereInput = { userId };
  if (interval.startDate && interval.endDate) {
    whereSession.startedAt = {
      gte: interval.startDate,
      lte: interval.endDate,
    };
  }

  const sessions = await prisma.focusSession.findMany({
    where: whereSession,
    include: {
      task: {
        include: { category: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED").length;
  const interruptedSessions = sessions.filter((s) => s.status === "CANCELLED" || s.status === "PAUSED").length;
  const totalActualSeconds = sessions.reduce((sum: number, s) => sum + s.actualDuration, 0);
  const totalFocusMinutes = Math.round(totalActualSeconds / 60);
  const totalHours = (totalFocusMinutes / 60).toFixed(1);
  const averageSessionMinutes = completedSessions > 0 ? Math.round(totalFocusMinutes / completedSessions) : 0;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Daily map
  const dailyMap = new Map<string, { minutes: number; count: number }>();
  sessions.forEach((s) => {
    const dateKey = s.startedAt.toISOString().slice(0, 10);
    const curr = dailyMap.get(dateKey) || { minutes: 0, count: 0 };
    curr.minutes += Math.round(s.actualDuration / 60);
    curr.count += 1;
    dailyMap.set(dateKey, curr);
  });

  const dailyFocus = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      dayLabel: formatDisplayDate(date),
      focusMinutes: data.minutes,
      sessionCount: data.count,
    }));

  // Category breakdown
  const categoryMap = new Map<string, number>();
  sessions.forEach((s) => {
    const cName = s.task?.category?.name || "General";
    const mins = Math.round(s.actualDuration / 60);
    categoryMap.set(cName, (categoryMap.get(cName) || 0) + mins);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, mins]) => ({
    name,
    focusMinutes: mins,
    percentage: totalFocusMinutes > 0 ? Math.round((mins / totalFocusMinutes) * 100) : 0,
  }));

  // Topic breakdown
  const topicMap = new Map<string, { categoryName: string; mins: number; count: number }>();
  sessions.forEach((s) => {
    const title = s.task?.title || "Untracked Task";
    const cName = s.task?.category?.name || "General";
    const curr = topicMap.get(title) || { categoryName: cName, mins: 0, count: 0 };
    curr.mins += Math.round(s.actualDuration / 60);
    curr.count += 1;
    topicMap.set(title, curr);
  });

  const topicBreakdown = Array.from(topicMap.entries())
    .sort(([, a], [, b]) => b.mins - a.mins)
    .map(([title, data]) => ({
      title,
      categoryName: data.categoryName,
      focusMinutes: data.mins,
      sessionCount: data.count,
    }));

  return {
    metadata: {
      reportType: "focus-time",
      title: "Focus Time & Deep Work Report",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalSessions,
      completedSessions,
      interruptedSessions,
      totalFocusMinutes,
      totalFocusHours: `${totalHours} hrs`,
      averageSessionMinutes,
      completionRate,
    },
    dailyFocus,
    categoryBreakdown,
    topicBreakdown,
  };
}

// -------------------------------------------------------------
// 3. LEARNING LOGS REPORT DATA
// -------------------------------------------------------------
export async function getLearningLogReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<LearningLogReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const whereLog: Prisma.LearningLogWhereInput = { userId };
  if (interval.startDate && interval.endDate) {
    whereLog.createdAt = {
      gte: interval.startDate,
      lte: interval.endDate,
    };
  }

  const logs = await prisma.learningLog.findMany({
    where: whereLog,
    include: {
      task: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalLogs = logs.length;
  const totalConfidence = logs.reduce((s: number, l) => s + l.confidence, 0);
  const averageConfidence = totalLogs > 0 ? Number((totalConfidence / totalLogs).toFixed(1)) : 0;
  const highConfidenceCount = logs.filter((l) => l.confidence >= 4).length;
  const openDoubtsCount = logs.filter((l) => l.doubts && l.doubts.trim().length > 0).length;

  const confidenceLabels: Record<number, string> = {
    1: "Very Low",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Mastered",
  };

  return {
    metadata: {
      reportType: "learning-logs",
      title: "Learning Logs & Reflection Journal Report",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalLogs,
      averageConfidence,
      highConfidenceCount,
      openDoubtsCount,
    },
    logs: logs.map((l) => ({
      id: l.id,
      topicTitle: l.task?.title || "Independent Log",
      categoryName: l.task?.category?.name || "General",
      date: l.createdAt.toISOString().slice(0, 10),
      confidence: l.confidence,
      confidenceLabel: confidenceLabels[l.confidence] || "Moderate",
      whatLearned: l.whatLearned,
      whatCompleted: l.whatCompleted,
      doubts: l.doubts,
      notes: l.notes,
    })),
  };
}

// -------------------------------------------------------------
// 4. REVISIONS REPORT DATA
// -------------------------------------------------------------
export async function getRevisionReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<RevisionReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);
  const todayStr = getTodayISO();

  const whereRevision: Prisma.RevisionWhereInput = { userId };
  if (interval.startDate && interval.endDate) {
    whereRevision.scheduledDate = {
      gte: interval.startDate,
      lte: interval.endDate,
    };
  }

  const revisions = await prisma.revision.findMany({
    where: whereRevision,
    include: {
      task: {
        include: { category: true },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const totalRevisions = revisions.length;
  const completedRevisions = revisions.filter((r) => r.status === "COMPLETED").length;
  const dueToday = revisions.filter((r) => r.scheduledDate.toISOString().slice(0, 10) === todayStr && r.status === "PENDING").length;
  const overdue = revisions.filter((r) => r.scheduledDate.toISOString().slice(0, 10) < todayStr && r.status === "PENDING").length;
  const upcoming = revisions.filter((r) => r.scheduledDate.toISOString().slice(0, 10) > todayStr && r.status === "PENDING").length;
  const adherenceRate = totalRevisions > 0 ? Math.round((completedRevisions / totalRevisions) * 100) : 0;

  // Mastered topics
  const masteredTasks = await prisma.learningTask.count({
    where: { userId, status: "FULLY_COMPLETED" },
  });

  // Milestone progression R1, R2, R3, R4
  const r1s = revisions.filter((r) => r.revisionNumber === 1);
  const r2s = revisions.filter((r) => r.revisionNumber === 2);
  const r3s = revisions.filter((r) => r.revisionNumber === 3);
  const r4s = revisions.filter((r) => r.revisionNumber === 4);

  const milestoneNames: Record<number, string> = {
    1: "R1 - Immediate",
    2: "R2 - Short Term",
    3: "R3 - Medium Term",
    4: "R4 - Long Term Retention",
  };

  const offsetLabels: Record<number, string> = {
    1: "Day 0 (Same day)",
    2: "Day +3",
    3: "Day +15",
    4: "Day +30",
  };

  return {
    metadata: {
      reportType: "revisions",
      title: "Spaced Revision & Forgetting Curve Report",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalRevisions,
      completedRevisions,
      dueToday,
      overdue,
      upcoming,
      adherenceRate,
      masteredTopicsCount: masteredTasks,
    },
    milestoneProgression: {
      r1: { total: r1s.length, completed: r1s.filter((r) => r.status === "COMPLETED").length, description: "Day 0 (Same Day)" },
      r2: { total: r2s.length, completed: r2s.filter((r) => r.status === "COMPLETED").length, description: "Day +3" },
      r3: { total: r3s.length, completed: r3s.filter((r) => r.status === "COMPLETED").length, description: "Day +15" },
      r4: { total: r4s.length, completed: r4s.filter((r) => r.status === "COMPLETED").length, description: "Day +30" },
    },
    revisions: revisions.map((r) => ({
      id: r.id,
      topicTitle: r.task?.title || "Topic",
      categoryName: r.task?.category?.name || "General",
      revisionNumber: r.revisionNumber,
      milestoneName: milestoneNames[r.revisionNumber] || `R${r.revisionNumber}`,
      intervalOffset: offsetLabels[r.revisionNumber] || "Day +X",
      scheduledDate: r.scheduledDate.toISOString().slice(0, 10),
      completedAt: r.completedAt ? r.completedAt.toISOString().slice(0, 10) : null,
      status: r.status,
      isOverdue: r.status === "PENDING" && r.scheduledDate.toISOString().slice(0, 10) < todayStr,
      confidence: r.confidence,
      notes: r.notes,
    })),
  };
}

// -------------------------------------------------------------
// 5. MASTERY REPORT DATA
// -------------------------------------------------------------
export async function getMasteryReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<MasteryReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const whereTask: Prisma.LearningTaskWhereInput = { userId };
  if (options.categoryId) {
    whereTask.categoryId = options.categoryId;
  }
  if (interval.fromStr && interval.toStr) {
    whereTask.plannedDate = {
      gte: interval.fromStr,
      lte: interval.toStr,
    };
  }

  const [tasks, categories, logs] = await Promise.all([
    prisma.learningTask.findMany({
      where: whereTask,
      include: {
        category: true,
        revisions: {
          select: { status: true, revisionNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      include: {
        tasks: {
          select: { status: true },
        },
      },
    }),
    prisma.learningLog.findMany({
      where: { userId },
      select: { confidence: true },
    }),
  ]);

  const totalTopics = tasks.length;
  const learnedTopics = tasks.filter((t) => t.learningCompletedAt !== null).length;
  const fullyCompletedTopics = tasks.filter((t) => t.status === "FULLY_COMPLETED").length;
  const inRevisionTopics = tasks.filter((t) => t.status === "REVISION_PENDING").length;
  const masteryPercentage = totalTopics > 0 ? Math.round((fullyCompletedTopics / totalTopics) * 100) : 0;

  const totalConf = logs.reduce((s: number, l) => s + l.confidence, 0);
  const avgConfidence = logs.length > 0 ? Number((totalConf / logs.length).toFixed(1)) : 0;

  const categoryMastery = categories.map((c) => {
    const cTotal = c.tasks.length;
    const cMastered = c.tasks.filter((t) => t.status === "FULLY_COMPLETED").length;
    return {
      name: c.name,
      color: c.color,
      totalTopics: cTotal,
      masteredTopics: cMastered,
      masteryPercentage: cTotal > 0 ? Math.round((cMastered / cTotal) * 100) : 0,
    };
  });

  return {
    metadata: {
      reportType: "mastery",
      title: "Topic Mastery & Long-Term Retention Audit",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalTopics,
      learnedTopics,
      fullyCompletedTopics,
      inRevisionTopics,
      masteryPercentage,
      averageConfidence: avgConfidence,
    },
    categoryMastery,
    masteryList: tasks.map((t) => {
      const completedRevCount = t.revisions.filter((r) => r.status === "COMPLETED").length;
      return {
        id: t.id,
        title: t.title,
        categoryName: t.category?.name || "General",
        status: t.status,
        revisionsCompleted: completedRevCount,
        isMastered: t.status === "FULLY_COMPLETED",
        learningCompletedDate: t.learningCompletedAt ? t.learningCompletedAt.toISOString().slice(0, 10) : null,
        masteryDate: t.status === "FULLY_COMPLETED" && t.updatedAt ? t.updatedAt.toISOString().slice(0, 10) : null,
      };
    }),
  };
}

// -------------------------------------------------------------
// 6. CALENDAR ACTIVITY REPORT DATA
// -------------------------------------------------------------
export async function getCalendarActivityReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<CalendarActivityReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const whereDateRange = interval.startDate && interval.endDate
    ? { gte: interval.startDate, lte: interval.endDate }
    : undefined;

  const [tasks, sessions, revisions] = await Promise.all([
    prisma.learningTask.findMany({
      where: {
        userId,
        plannedDate: whereDateRange,
      },
      include: { category: true },
      orderBy: { plannedDate: "desc" },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: whereDateRange,
      },
      include: { task: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.revision.findMany({
      where: {
        userId,
        scheduledDate: whereDateRange,
      },
      include: { task: true },
      orderBy: { scheduledDate: "desc" },
    }),
  ]);

  const events: CalendarActivityReportData["events"] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      type: "TASK" as const,
      typeLabel: "Planned Learning Task",
      date: t.plannedDate.toISOString().slice(0, 10),
      status: t.status,
      categoryName: t.category?.name,
    })),
    ...sessions.map((s) => ({
      id: `session-${s.id}`,
      title: s.task?.title ? `Focus: ${s.task.title}` : "Focus Session",
      type: "FOCUS_SESSION" as const,
      typeLabel: "Focus Block (45m)",
      date: s.startedAt.toISOString().slice(0, 10),
      status: s.status,
      durationMinutes: Math.round(s.actualDuration / 60),
    })),
    ...revisions.map((r) => ({
      id: `rev-${r.id}`,
      title: `Revision R${r.revisionNumber}: ${r.task?.title || "Topic"}`,
      type: "REVISION" as const,
      typeLabel: `Spaced Revision R${r.revisionNumber}`,
      date: r.scheduledDate.toISOString().slice(0, 10),
      status: r.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    metadata: {
      reportType: "calendar",
      title: "Chronological Calendar & Activity Schedule",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalEvents: events.length,
      tasksPlanned: tasks.length,
      focusSessionsRecorded: sessions.length,
      revisionsScheduled: revisions.length,
    },
    events,
  };
}

// -------------------------------------------------------------
// 7. ANALYTICS REPORT DATA
// -------------------------------------------------------------
export async function getAnalyticsReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<AnalyticsReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const rangeKey: AnalyticsDateRange =
    options.rangePreset === "90d" ? "90d" : options.rangePreset === "all" ? "all" : "30d";

  const [analytics, rawRevisions] = await Promise.all([
    getFullAnalyticsPayload(userId, rangeKey, "UTC"),
    prisma.revision.findMany({
      where: { userId },
      select: { revisionNumber: true, status: true },
    }),
  ]);

  const revisionDistMap = new Map<number, { completed: number; total: number }>([
    [1, { completed: 0, total: 0 }],
    [2, { completed: 0, total: 0 }],
    [3, { completed: 0, total: 0 }],
    [4, { completed: 0, total: 0 }],
  ]);

  rawRevisions.forEach((r) => {
    const curr = revisionDistMap.get(r.revisionNumber) || { completed: 0, total: 0 };
    curr.total += 1;
    if (r.status === "COMPLETED") curr.completed += 1;
    revisionDistMap.set(r.revisionNumber, curr);
  });

  return {
    metadata: {
      reportType: "analytics",
      title: "Learning Analytics & Retention Insights Report",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    summary: {
      totalFocusMinutes: analytics.summary.totalFocusMinutes,
      completedFocusSessions: analytics.summary.completedFocusSessions,
      focusCompletionRate: analytics.summary.focusCompletionRate,
      topicsLearned: analytics.summary.topicsLearned,
      topicsFullyCompleted: analytics.summary.topicsFullyCompleted,
      revisionAdherenceRate: analytics.summary.revisionAdherenceRate,
      currentStreak: analytics.summary.currentStreak,
      longestStreak: analytics.summary.longestStreak,
    },
    insights: analytics.insights.map((i) => `${i.title}: ${i.description}`),
    dailyTrajectory: analytics.dailyFocus.map((d) => ({
      date: d.date,
      focusMinutes: d.focusMinutes,
      sessions: d.sessionCount,
    })),
    revisionDistribution: Array.from(revisionDistMap.entries()).map(([num, data]) => ({
      revisionNumber: num,
      completed: data.completed,
      scheduled: data.total,
    })),
  };
}

// -------------------------------------------------------------
// 8. MONEY MANAGEMENT REPORT DATA
// -------------------------------------------------------------
export async function getMoneyReport(
  userId: string,
  _options: ReportFilterOptions = {}
): Promise<MoneyReportData> {
  const user = await getUserMetadata(userId);
  const now = new Date();
  const summary = await getMoneySummary(userId, now.getFullYear(), now.getMonth() + 1);
  const history = await getFinancialHistory(userId);

  const currentBudget = summary.budget
    ? {
        year: summary.budget.year,
        month: summary.budget.month,
        amount: summary.budget.amount,
        needs: summary.budget.needsAmount,
        savings: summary.budget.savingsAmount,
        growth: summary.budget.growthAmount,
        wants: summary.budget.wantsAmount,
        totalSpent: summary.totalSpent,
        netBalance: summary.totalRemaining,
        formulaVerified:
          summary.budget.needsAmount +
            summary.budget.savingsAmount +
            summary.budget.growthAmount +
            summary.budget.wantsAmount ===
          summary.budget.amount,
      }
    : null;

  return {
    metadata: {
      reportType: "money",
      title: "Money Management & Allocation Report",
      generatedAt: new Date().toISOString(),
      periodLabel: `Active Month (${now.toLocaleString("en-US", { month: "long", year: "numeric" })})`,
      user,
    },
    formula: {
      needsPct: 50,
      savingsPct: 20,
      growthPct: 20,
      wantsPct: 10,
    },
    currentBudget,
    monthlyHistory: history.monthlyHistory.map((m) => ({
      year: m.year,
      month: m.month,
      monthLabel: `${new Date(m.year, m.month - 1).toLocaleString("en-US", { month: "short" })} ${m.year}`,
      amount: m.amount,
      needs: Math.round(m.amount * 0.5 * 100) / 100,
      savings: Math.round(m.amount * 0.2 * 100) / 100,
      growth: Math.round(m.amount * 0.2 * 100) / 100,
      wants: Math.round(m.amount * 0.1 * 100) / 100,
      totalSpent: m.totalSpent,
      netBalance: m.netBalance ?? m.totalRemaining,
    })),
    recentExpenses: summary.recentExpenses.slice(0, 20).map((e: MoneyExpenseDTO) => ({
      date: e.date,
      amount: e.amount,
      description: e.note || "Expense",
      category: e.category,
    })),
  };
}

// -------------------------------------------------------------
// 9. COMPLETE REPORT DATA (ALL MODULES COMBINED)
// -------------------------------------------------------------
export async function getCompleteReport(
  userId: string,
  options: ReportFilterOptions = {}
): Promise<CompleteReportData> {
  const user = await getUserMetadata(userId);
  const interval = resolveDateInterval(options);

  const [
    learningProgress,
    focusTime,
    learningLogs,
    revisions,
    mastery,
    calendarActivity,
    analytics,
    money,
  ] = await Promise.all([
    getLearningProgressReport(userId, options),
    getFocusTimeReport(userId, options),
    getLearningLogReport(userId, options),
    getRevisionReport(userId, options),
    getMasteryReport(userId, options),
    getCalendarActivityReport(userId, options),
    getAnalyticsReport(userId, options),
    getMoneyReport(userId, options),
  ]);

  return {
    metadata: {
      reportType: "complete",
      title: "Complete LearnTrack Portfolio Dossier",
      generatedAt: new Date().toISOString(),
      periodLabel: interval.periodLabel,
      from: interval.fromStr,
      to: interval.toStr,
      user,
    },
    learningProgress,
    focusTime,
    learningLogs,
    revisions,
    mastery,
    calendarActivity,
    analytics,
    money,
  };
}

/**
 * Universal Dispatcher: Fetches report data based on requested ReportType
 */
export async function fetchReportData(
  userId: string,
  type: ReportType,
  rangePreset: ReportDateRangePreset = "30d",
  from?: string,
  to?: string,
  categoryId?: string
): Promise<any> {
  const options: ReportFilterOptions = {
    rangePreset,
    from,
    to,
    categoryId,
  };

  switch (type) {
    case "learning-progress":
      return getLearningProgressReport(userId, options);
    case "focus-time":
      return getFocusTimeReport(userId, options);
    case "learning-logs":
      return getLearningLogReport(userId, options);
    case "revisions":
      return getRevisionReport(userId, options);
    case "mastery":
      return getMasteryReport(userId, options);
    case "calendar":
      return getCalendarActivityReport(userId, options);
    case "analytics":
      return getAnalyticsReport(userId, options);
    case "money":
      return getMoneyReport(userId, options);
    case "complete":
      return getCompleteReport(userId, options);
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
}
