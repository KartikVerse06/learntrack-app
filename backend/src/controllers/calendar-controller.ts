import { Request, Response } from "express";
import { getCalendarEvents } from "../repositories/calendar-repository.js";
import { CalendarEventsQuerySchema } from "../validators/calendar.js";

export async function getEvents(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = CalendarEventsQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid start/end date range",
      },
    });
  }

  const { start, end } = parseResult.data;
  const events = await getCalendarEvents(userId, start, end);

  return res.status(200).json({
    success: true,
    data: events,
  });
}
