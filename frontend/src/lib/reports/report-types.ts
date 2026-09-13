import { z } from "zod";

export type ReportType =
  | "learning-progress"
  | "focus-time"
  | "learning-logs"
  | "revisions"
  | "mastery"
  | "calendar"
  | "analytics"
  | "money"
  | "complete";

export type ReportFormat = "pdf" | "csv" | "json";

export type ReportDateRangePreset =
  | "today"
  | "this-week"
  | "this-month"
  | "30d"
  | "90d"
  | "this-year"
  | "all"
  | "custom";

export interface ReportDateInterval {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  rangePreset: ReportDateRangePreset;
}

export const reportQuerySchema = z.object({
  type: z.enum([
    "learning-progress",
    "focus-time",
    "learning-logs",
    "revisions",
    "mastery",
    "calendar",
    "analytics",
    "money",
    "complete",
  ]),
  format: z.enum(["pdf", "csv", "json"]),
  range: z
    .enum([
      "today",
      "this-week",
      "this-month",
      "30d",
      "90d",
      "this-year",
      "all",
      "custom",
    ])
    .default("30d"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoryId: z.string().optional(),
});

export type ReportQueryParams = z.infer<typeof reportQuerySchema>;

export interface ReportMetadata {
  reportType: ReportType;
  title: string;
  generatedAt: string; // ISO string
  periodLabel: string;
  from?: string;
  to?: string;
  user: {
    name: string;
    email: string;
  };
}

export interface LearningProgressReportData {
  metadata: ReportMetadata;
  summary: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    archivedTasks: number;
    topicsLearned: number;
    topicsFullyCompleted: number;
    completionPercentage: number;
    totalFocusMinutes: number;
  };
  categories: Array<{
    name: string;
    color: string;
    taskCount: number;
    completedCount: number;
    focusMinutes: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    categoryName: string;
    priority: string;
    status: string;
    completedSessions: number;
    estimatedSessions: number;
    totalFocusMinutes: number;
    plannedDate: string;
    learningCompletedAt: string | null;
  }>;
}

export interface FocusTimeReportData {
  metadata: ReportMetadata;
  summary: {
    totalSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    totalFocusMinutes: number;
    totalFocusHours: string;
    averageSessionMinutes: number;
    completionRate: number;
  };
  dailyFocus: Array<{
    date: string;
    dayLabel: string;
    focusMinutes: number;
    sessionCount: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    focusMinutes: number;
    percentage: number;
  }>;
  topicBreakdown: Array<{
    title: string;
    categoryName: string;
    focusMinutes: number;
    sessionCount: number;
  }>;
}

export interface LearningLogReportData {
  metadata: ReportMetadata;
  summary: {
    totalLogs: number;
    averageConfidence: number;
    highConfidenceCount: number;
    openDoubtsCount: number;
  };
  logs: Array<{
    id: string;
    topicTitle: string;
    categoryName: string;
    date: string;
    confidence: number;
    confidenceLabel: string;
    whatLearned: string;
    whatCompleted: string | null;
    doubts: string | null;
    notes: string | null;
  }>;
}

export interface RevisionReportData {
  metadata: ReportMetadata;
  summary: {
    totalRevisions: number;
    completedRevisions: number;
    dueToday: number;
    overdue: number;
    upcoming: number;
    adherenceRate: number;
    masteredTopicsCount: number;
  };
  milestoneProgression: {
    r1: { total: number; completed: number; description: string };
    r2: { total: number; completed: number; description: string };
    r3: { total: number; completed: number; description: string };
    r4: { total: number; completed: number; description: string };
  };
  revisions: Array<{
    id: string;
    topicTitle: string;
    categoryName: string;
    revisionNumber: number;
    milestoneName: string;
    intervalOffset: string;
    scheduledDate: string;
    completedAt: string | null;
    status: string;
    isOverdue: boolean;
    confidence: number | null;
    notes: string | null;
  }>;
}

export interface MasteryReportData {
  metadata: ReportMetadata;
  summary: {
    totalTopics: number;
    learnedTopics: number;
    fullyCompletedTopics: number;
    inRevisionTopics: number;
    masteryPercentage: number;
    averageConfidence: number;
  };
  categoryMastery: Array<{
    name: string;
    color: string;
    totalTopics: number;
    masteredTopics: number;
    masteryPercentage: number;
  }>;
  masteryList: Array<{
    id: string;
    title: string;
    categoryName: string;
    status: string;
    revisionsCompleted: number;
    isMastered: boolean;
    learningCompletedDate: string | null;
    masteryDate: string | null;
  }>;
}

export interface CalendarActivityReportData {
  metadata: ReportMetadata;
  summary: {
    totalEvents: number;
    tasksPlanned: number;
    focusSessionsRecorded: number;
    revisionsScheduled: number;
  };
  events: Array<{
    id: string;
    title: string;
    type: "TASK" | "REVISION" | "FOCUS_SESSION";
    typeLabel: string;
    date: string;
    status: string;
    durationMinutes?: number;
    categoryName?: string;
  }>;
}

export interface AnalyticsReportData {
  metadata: ReportMetadata;
  summary: {
    totalFocusMinutes: number;
    completedFocusSessions: number;
    focusCompletionRate: number;
    topicsLearned: number;
    topicsFullyCompleted: number;
    revisionAdherenceRate: number;
    currentStreak: number;
    longestStreak: number;
  };
  insights: string[];
  dailyTrajectory: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
  }>;
  revisionDistribution: Array<{
    revisionNumber: number;
    completed: number;
    scheduled: number;
  }>;
}

export interface MoneyReportData {
  metadata: ReportMetadata;
  formula: {
    needsPct: number;
    savingsPct: number;
    growthPct: number;
    wantsPct: number;
  };
  currentBudget: {
    year: number;
    month: number;
    amount: number;
    needs: number;
    savings: number;
    growth: number;
    wants: number;
    totalSpent: number;
    netBalance: number;
    formulaVerified: boolean;
  } | null;
  monthlyHistory: Array<{
    year: number;
    month: number;
    monthLabel: string;
    amount: number;
    needs: number;
    savings: number;
    growth: number;
    wants: number;
    totalSpent: number;
    netBalance: number;
  }>;
  recentExpenses: Array<{
    date: string;
    amount: number;
    description: string;
    category: string;
  }>;
}

export interface CompleteReportData {
  metadata: ReportMetadata;
  learningProgress: LearningProgressReportData;
  focusTime: FocusTimeReportData;
  learningLogs: LearningLogReportData;
  revisions: RevisionReportData;
  mastery: MasteryReportData;
  calendarActivity: CalendarActivityReportData;
  analytics: AnalyticsReportData;
  money: MoneyReportData;
}
