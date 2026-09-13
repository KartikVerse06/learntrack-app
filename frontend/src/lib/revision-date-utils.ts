import { getRelativeDateISO, parseISODate, formatDateToISO } from "./date-utils";

/**
 * Fixed spaced repetition intervals (days offset from completion date)
 * R1: Day 0 (Same day)
 * R2: Day +3
 * R3: Day +15
 * R4: Day +30
 */
export const REVISION_INTERVALS = [
  { revisionNumber: 1, offsetDays: 0, label: "Day 0 (Same Day)", description: "Immediate consolidation before first sleep cycle" },
  { revisionNumber: 2, offsetDays: 3, label: "Day +3", description: "Halt initial steep forgetting curve decay" },
  { revisionNumber: 3, offsetDays: 15, label: "Day +15", description: "Intermediate retrieval to strengthen long-term memory" },
  { revisionNumber: 4, offsetDays: 30, label: "Day +30", description: "Permanent retention & mastery verification" },
] as const;

export interface ScheduledRevisionMilestone {
  revisionNumber: number;
  offsetDays: number;
  scheduledDate: string; // YYYY-MM-DD
  label: string;
  description: string;
}

/**
 * Pure calculation: Given a base completion date in YYYY-MM-DD,
 * returns the 4 milestone dates without timezone drift.
 */
export function calculateRevisionDates(baseDateStr: string): ScheduledRevisionMilestone[] {
  // Validate format
  parseISODate(baseDateStr);

  return REVISION_INTERVALS.map((interval) => ({
    revisionNumber: interval.revisionNumber,
    offsetDays: interval.offsetDays,
    scheduledDate: getRelativeDateISO(baseDateStr, interval.offsetDays),
    label: interval.label,
    description: interval.description,
  }));
}

export type ComputedRevisionState = "DUE" | "OVERDUE" | "PENDING" | "COMPLETED" | "SKIPPED";

/**
 * Deterministically computes whether a revision is DUE, OVERDUE, or PENDING
 * given its scheduled date and today's calendar date (YYYY-MM-DD).
 */
export function computeRevisionState(
  scheduledDateISO: string,
  todayISO: string,
  currentStatus: string
): ComputedRevisionState {
  if (currentStatus === "COMPLETED") return "COMPLETED";
  if (currentStatus === "SKIPPED") return "SKIPPED";

  if (scheduledDateISO < todayISO) {
    return "OVERDUE";
  }
  if (scheduledDateISO === todayISO) {
    return "DUE";
  }
  return "PENDING";
}

/**
 * Formats a relative label like "Due Today", "Overdue by 2 days", or "In 5 days"
 */
export function getRelativeRevisionDueLabel(scheduledDateISO: string, todayISO: string): {
  label: string;
  isOverdue: boolean;
  isDueToday: boolean;
  diffDays: number;
} {
  const sched = parseISODate(scheduledDateISO);
  const today = parseISODate(todayISO);
  const diffTime = sched.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: "Due Today", isOverdue: false, isDueToday: true, diffDays: 0 };
  }
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? "Overdue by 1 day" : `Overdue by ${overdueDays} days`,
      isOverdue: true,
      isDueToday: false,
      diffDays,
    };
  }
  return {
    label: diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays} days`,
    isOverdue: false,
    isDueToday: false,
    diffDays,
  };
}
