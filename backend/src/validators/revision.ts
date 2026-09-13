import { z } from "zod";

export const MarkTopicAsLearnedSchema = z.object({
  taskId: z.string().cuid("Invalid task ID format"),
});

export type MarkTopicAsLearnedInput = z.infer<typeof MarkTopicAsLearnedSchema>;

export const CompleteRevisionSchema = z.object({
  revisionId: z.string().cuid("Invalid revision ID format"),
  notes: z.string().max(3000, "Revision notes cannot exceed 3000 characters").optional().nullable(),
  confidence: z
    .coerce
    .number()
    .int("Confidence must be an integer")
    .min(1, "Confidence must be between 1 and 5")
    .max(5, "Confidence must be between 1 and 5"),
});

export type CompleteRevisionInput = z.infer<typeof CompleteRevisionSchema>;

export const GetRevisionsSchema = z.object({
  filter: z.enum(["due", "upcoming", "completed", "all"]).optional().default("due"),
  categoryId: z.string().cuid().optional(),
});

export type GetRevisionsInput = z.infer<typeof GetRevisionsSchema>;
