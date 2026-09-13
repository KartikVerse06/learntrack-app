import { Request, Response } from "express";
import {
  getMoneySummary,
  getFinancialHistory,
  upsertMonthlyBudget,
  createExpense,
  deleteExpense,
} from "../repositories/money-repository.js";
import {
  SetMonthlyBudgetSchema,
  CreateExpenseSchema,
} from "../validators/money.js";

export async function getSummary(req: Request, res: Response) {
  const userId = req.user!.userId;
  const now = new Date();
  const monthNum = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
  const yearNum = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

  const summary = await getMoneySummary(userId, yearNum, monthNum);
  return res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function getHistory(req: Request, res: Response) {
  const userId = req.user!.userId;
  const history = await getFinancialHistory(userId);

  return res.status(200).json({
    success: true,
    data: history,
  });
}

export async function setBudget(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = SetMonthlyBudgetSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid budget input",
      },
    });
  }

  const budget = await upsertMonthlyBudget(userId, parseResult.data);
  return res.status(200).json({
    success: true,
    data: budget,
  });
}

export async function createExpenseEntry(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = CreateExpenseSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid expense data",
      },
    });
  }

  try {
    const expense = await createExpense(userId, parseResult.data);
    return res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "EXPENSE_CREATION_ERROR",
        message: err.message || "Failed to add expense",
      },
    });
  }
}

export async function removeExpense(req: Request, res: Response) {
  const userId = req.user!.userId;
  const expenseId = req.params.id;

  try {
    await deleteExpense(userId, expenseId);
    return res.status(200).json({
      success: true,
      data: { message: "Expense deleted successfully" },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "EXPENSE_DELETION_ERROR",
        message: err.message || "Failed to delete expense",
      },
    });
  }
}
