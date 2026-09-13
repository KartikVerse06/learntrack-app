import { z } from "zod";

export const CalendarEventsQuerySchema = z.object({
  start: z
    .string()
    .min(1, "Start date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
  end: z
    .string()
    .min(1, "End date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),
});

export type CalendarEventsQueryInput = z.infer<typeof CalendarEventsQuerySchema>;
