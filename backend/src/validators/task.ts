import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .cuid("Invalid category ID")
    .optional()
    .nullable()
    .or(z.literal("")),
  plannedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedSessions: z.coerce
    .number()
    .int("Estimated sessions must be an integer")
    .min(1, "At least 1 session required")
    .max(12, "Maximum 12 sessions allowed")
    .default(2),
});

export const UpdateTaskSchema = z.object({
  id: z.string().cuid("Invalid task ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .cuid("Invalid category ID")
    .optional()
    .nullable()
    .or(z.literal("")),
  plannedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedSessions: z.coerce
    .number()
    .int("Estimated sessions must be an integer")
    .min(1, "At least 1 session required")
    .max(12, "Maximum 12 sessions allowed")
    .optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS"]).optional(),
});

export const ToggleTaskStatusSchema = z.object({
  id: z.string().cuid("Invalid task ID"),
  status: z.enum(["PLANNED", "IN_PROGRESS"]),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ToggleTaskStatusInput = z.infer<typeof ToggleTaskStatusSchema>;
