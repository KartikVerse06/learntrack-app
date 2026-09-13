import { z } from "zod";

export const StartFocusSessionSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
});

export type StartFocusSessionInput = z.infer<typeof StartFocusSessionSchema>;

export const PauseResumeSessionSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
});

export type PauseResumeSessionInput = z.infer<typeof PauseResumeSessionSchema>;

export const CompleteSessionSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
  actualDuration: z.coerce
    .number()
    .int("Actual duration must be an integer in seconds")
    .min(1, "Actual duration must be at least 1 second")
    .max(7200, "Actual duration cannot exceed 7200 seconds (2 hours)"),
});

export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>;

export const CancelSessionSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
});

export type CancelSessionInput = z.infer<typeof CancelSessionSchema>;
