"use server";

import { requireAuth, UnauthorizedError } from "@/lib/session";
import { CalendarEventsQuerySchema } from "@/server/validators/calendar";
import { getCalendarEvents } from "@/server/repositories/calendar-repository";
import type { CalendarEventDTO } from "@/lib/calendar/calendar-event-mapper";
import type { ActionResult } from "@/types";

/**
 * Server Action: Fetches user calendar events within the specified date range.
 */
export async function getCalendarEventsAction(
  startISO: string,
  endISO: string
): Promise<ActionResult<CalendarEventDTO[]>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CalendarEventsQuerySchema.safeParse({
      start: startISO,
      end: endISO,
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date range parameters for calendar events.",
        },
      };
    }

    const events = await getCalendarEvents(
      userId,
      parseResult.data.start,
      parseResult.data.end
    );

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to load calendar events.",
      },
    };
  }
}
