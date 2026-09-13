import { z } from "zod";

export const SetMonthlyBudgetSchema = z.object({
  amount: z
    .number()
    .positive("Monthly amount must be greater than 0")
    .max(100_000_000, "Monthly amount exceeds maximum limit of ₹100,000,000"),
  month: z
    .number()
    .int("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
});

export const CreateExpenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  category: z.enum(["NEEDS", "SAVINGS", "GROWTH", "WANTS"]),
  amount: z
    .number()
    .positive("Expense amount must be greater than 0")
    .max(100_000_000, "Expense amount exceeds maximum limit"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  note: z
    .string()
    .max(255, "Note cannot exceed 255 characters")
    .optional()
    .nullable(),
});

export const DeleteExpenseSchema = z.object({
  expenseId: z.string().min(1, "Expense ID is required"),
});

export const GetBudgetByMonthSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export type SetMonthlyBudgetInput = z.infer<typeof SetMonthlyBudgetSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type DeleteExpenseInput = z.infer<typeof DeleteExpenseSchema>;
export type GetBudgetByMonthInput = z.infer<typeof GetBudgetByMonthSchema>;
