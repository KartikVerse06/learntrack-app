/**
 * Analytics Data Transfer Objects & Domain Models for LearnTrack
 * Strict type boundaries separating Prisma models from client-safe representations.
 */

export type AnalyticsDateRange = "7d" | "30d" | "90d" | "all";

export interface AnalyticsSummaryDTO {
  totalFocusMinutes: number;
  completedFocusSessions: number;
  interruptedFocusSessions: number;
  focusCompletionRate: number; // percentage (0 - 100)
  averageSessionMinutes: number;
  topicsLearned: number;
  topicsFullyCompleted: number;
  totalRevisions: number;
  completedRevisions: number;
  revisionAdherenceRate: number; // percentage (0 - 100)
  currentStreak: number;
  longestStreak: number;
}

export interface DailyFocusDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon 09/11"
  focusMinutes: number;
  sessionCount: number;
}

export interface RevisionAdherenceDTO {
  onTime: number;
  late: number;
  pending: number;
  overdue: number;
  adherenceRate: number;
}

export interface ConfidenceTrajectoryPoint {
  stage: number; // 0 = Initial Log, 1 = Rev 1, 2 = Rev 2, 3 = Rev 3, 4 = Rev 4
  stageLabel: string;
  averageConfidence: number | null; // 1.0 - 5.0 or null
  sampleCount: number;
}

export interface CategoryDistributionItem {
  categoryId: string | null;
  categoryName: string;
  color: string;
  totalMinutes: number;
  taskCount: number;
  percentage: number;
}

export interface TopicStatusDistribution {
  planned: number;
  inProgress: number;
  revisionPending: number;
  fullyCompleted: number;
  total: number;
}

export interface DeterministicInsight {
  id: string;
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
}

export interface AnalyticsPayloadDTO {
  dateRange: AnalyticsDateRange;
  startDate: string | null; // YYYY-MM-DD or null for all-time
  endDate: string; // YYYY-MM-DD
  userTimezone: string;
  summary: AnalyticsSummaryDTO;
  dailyFocus: DailyFocusDataPoint[];
  revisionAdherence: RevisionAdherenceDTO;
  confidenceTrajectory: ConfidenceTrajectoryPoint[];
  categoryDistribution: CategoryDistributionItem[];
  topicStatusDistribution: TopicStatusDistribution;
  insights: DeterministicInsight[];
  hasActivity: boolean;
}
