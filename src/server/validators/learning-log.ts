import { z } from "zod";

export const CreateLearningLogSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
  sessionId: z.string().cuid("Invalid session ID"),
  whatLearned: z
    .string()
    .min(10, "Reflection must be at least 10 characters")
    .max(5000, "Reflection cannot exceed 5000 characters")
    .trim(),
  whatCompleted: z
    .string()
    .max(255, "Outputs completed cannot exceed 255 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  doubts: z
    .string()
    .max(3000, "Doubts cannot exceed 3000 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  confidence: z.coerce
    .number()
    .int("Confidence must be an integer")
    .min(1, "Confidence must be between 1 (Very Low) and 5 (Very High)")
    .max(5, "Confidence must be between 1 (Very Low) and 5 (Very High)"),
});

export type CreateLearningLogInput = z.infer<typeof CreateLearningLogSchema>;

export const UpdateLearningLogSchema = z.object({
  id: z.string().cuid("Invalid log ID"),
  whatLearned: z
    .string()
    .min(10, "Reflection must be at least 10 characters")
    .max(5000, "Reflection cannot exceed 5000 characters")
    .trim()
    .optional(),
  whatCompleted: z
    .string()
    .max(255, "Outputs completed cannot exceed 255 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  doubts: z
    .string()
    .max(3000, "Doubts cannot exceed 3000 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  confidence: z.coerce
    .number()
    .int("Confidence must be an integer")
    .min(1, "Confidence must be between 1 and 5")
    .max(5, "Confidence must be between 1 and 5")
    .optional(),
});

export type UpdateLearningLogInput = z.infer<typeof UpdateLearningLogSchema>;
