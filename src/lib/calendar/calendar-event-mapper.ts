import { formatDateToISO } from "@/lib/date-utils";
import type {
  LearningTask,
  Revision,
  FocusSession,
  Category,
  Priority,
  TaskStatus,
  RevisionStatus,
  SessionStatus,
} from "@/types";

export type CalendarEventType = "TASK" | "REVISION" | "FOCUS_SESSION";

export interface CalendarEventDTO {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: CalendarEventType;
    entityId: string;
    taskId: string;
    taskTitle: string;
    status: TaskStatus | RevisionStatus | SessionStatus;
    categoryName?: string;
    categoryColor?: string;
    priority?: Priority;
    revisionNumber?: number;
    durationMinutes?: number;
    notes?: string | null;
    confidence?: number | null;
  };
}

export const CALENDAR_COLORS = {
  TASK: "#2563EB", // Blue
  REVISION: "#9333EA", // Purple
  FOCUS: "#10B981", // Emerald
  TEXT: "#FFFFFF",
} as const;

/**
 * Maps a LearningTask to a FullCalendar event (Blue, all-day).
 */
export function mapTaskToCalendarEvent(
  task: LearningTask & { category?: Category | null }
): CalendarEventDTO {
  const dateStr = formatDateToISO(new Date(task.plannedDate));
  const color = task.category?.color || CALENDAR_COLORS.TASK;

  return {
    id: `task_${task.id}`,
    title: task.title,
    start: dateStr,
    allDay: true,
    backgroundColor: color,
    borderColor: color,
    textColor: CALENDAR_COLORS.TEXT,
    extendedProps: {
      type: "TASK",
      entityId: task.id,
      taskId: task.id,
      taskTitle: task.title,
      status: task.status,
      categoryName: task.category?.name,
      categoryColor: task.category?.color,
      priority: task.priority,
    },
  };
}

/**
 * Maps a Revision milestone to a FullCalendar event (Purple, all-day).
 */
export function mapRevisionToCalendarEvent(
  revision: Revision & { task: LearningTask & { category?: Category | null } }
): CalendarEventDTO {
  const dateStr = formatDateToISO(new Date(revision.scheduledDate));

  return {
    id: `rev_${revision.id}`,
    title: `[Rev ${revision.revisionNumber}] ${revision.task.title}`,
    start: dateStr,
    allDay: true,
    backgroundColor: CALENDAR_COLORS.REVISION,
    borderColor: CALENDAR_COLORS.REVISION,
    textColor: CALENDAR_COLORS.TEXT,
    extendedProps: {
      type: "REVISION",
      entityId: revision.id,
      taskId: revision.task.id,
      taskTitle: revision.task.title,
      status: revision.status,
      categoryName: revision.task.category?.name,
      categoryColor: revision.task.category?.color,
      revisionNumber: revision.revisionNumber,
      notes: revision.notes,
      confidence: revision.confidence,
    },
  };
}

/**
 * Maps a completed FocusSession to a FullCalendar event (Emerald, timestamped).
 */
export function mapFocusSessionToCalendarEvent(
  session: FocusSession & { task: LearningTask & { category?: Category | null } }
): CalendarEventDTO {
  const startISO = new Date(session.startedAt).toISOString();
  const endISO = session.endedAt
    ? new Date(session.endedAt).toISOString()
    : new Date(new Date(session.startedAt).getTime() + session.actualDuration * 1000).toISOString();

  const durationMin = Math.round(session.actualDuration / 60) || 45;

  return {
    id: `session_${session.id}`,
    title: `[Focus ${durationMin}m] ${session.task.title}`,
    start: startISO,
    end: endISO,
    allDay: false,
    backgroundColor: CALENDAR_COLORS.FOCUS,
    borderColor: CALENDAR_COLORS.FOCUS,
    textColor: CALENDAR_COLORS.TEXT,
    extendedProps: {
      type: "FOCUS_SESSION",
      entityId: session.id,
      taskId: session.task.id,
      taskTitle: session.task.title,
      status: session.status,
      categoryName: session.task.category?.name,
      categoryColor: session.task.category?.color,
      durationMinutes: durationMin,
    },
  };
}
