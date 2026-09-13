import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/date-utils";
import {
  mapTaskToCalendarEvent,
  mapRevisionToCalendarEvent,
  mapFocusSessionToCalendarEvent,
  type CalendarEventDTO,
} from "@/lib/calendar/calendar-event-mapper";

/**
 * Parses an ISO date string (YYYY-MM-DD or full ISO) or Date into a valid Date object.
 */
function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  if (input.includes("T")) {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return parseISODate(input.slice(0, 10));
}

/**
 * Retrieves calendar events for a specific user within the visible range [startDate, endDate].
 * Aggregates:
 * 1. Planned LearningTasks (Blue)
 * 2. Spaced Revision Milestones (Purple)
 * 3. Completed Focus Sessions (Emerald)
 *
 * Strictly enforces zero-trust multi-tenant isolation via authenticated userId.
 */
export async function getCalendarEvents(
  userId: string,
  start: string | Date,
  end: string | Date
): Promise<CalendarEventDTO[]> {
  const startDate = toDate(start);
  const endDate = toDate(end);

  const [tasks, revisions, sessions] = await Promise.all([
    // 1. Learning Tasks within range
    prisma.learningTask.findMany({
      where: {
        userId,
        plannedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: { plannedDate: "asc" },
    }),

    // 2. Revisions within range
    prisma.revision.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        task: {
          include: { category: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    }),

    // 3. Completed Focus Sessions within range
    prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
      include: {
        task: {
          include: { category: true },
        },
      },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const taskEvents = tasks.map(mapTaskToCalendarEvent);
  const revisionEvents = revisions.map(mapRevisionToCalendarEvent);
  const sessionEvents = sessions.map(mapFocusSessionToCalendarEvent);

  return [...taskEvents, ...revisionEvents, ...sessionEvents];
}
