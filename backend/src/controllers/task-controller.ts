import { Request, Response } from "express";
import {
  getTasksForDate,
  getDailyTaskSummary,
  getTaskDetailsById,
  createLearningTask,
  updateLearningTask,
  deleteLearningTask,
} from "../repositories/learning-task-repository.js";
import { CreateTaskSchema, UpdateTaskSchema } from "../validators/task.js";
import { getTodayISO } from "../lib/date-utils.js";

export async function getTasks(req: Request, res: Response) {
  const userId = req.user!.userId;
  const date = (req.query.date as string) || getTodayISO();

  const tasks = await getTasksForDate(userId, date);
  return res.status(200).json({
    success: true,
    data: tasks,
  });
}

export async function getSummary(req: Request, res: Response) {
  const userId = req.user!.userId;
  const date = (req.query.date as string) || getTodayISO();

  const summary = await getDailyTaskSummary(userId, date);
  return res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function getTaskById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const taskId = req.params.id;

  const task = await getTaskDetailsById(userId, taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TASK_NOT_FOUND",
        message: "Task not found or you do not have permission to view it.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: task,
  });
}

export async function createTask(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = CreateTaskSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid task data",
      },
    });
  }

  const task = await createLearningTask(userId, parseResult.data);
  return res.status(201).json({
    success: true,
    data: task,
  });
}

export async function updateTask(req: Request, res: Response) {
  const userId = req.user!.userId;
  const taskId = req.params.id;
  const parseResult = UpdateTaskSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid update data",
      },
    });
  }

  const task = await updateLearningTask(userId, taskId, parseResult.data);
  return res.status(200).json({
    success: true,
    data: task,
  });
}

export async function deleteTask(req: Request, res: Response) {
  const userId = req.user!.userId;
  const taskId = req.params.id;

  const result = await deleteLearningTask(userId, taskId);
  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function toggleStatus(req: Request, res: Response) {
  const userId = req.user!.userId;
  const taskId = req.params.id;

  const current = await getTaskDetailsById(userId, taskId);
  if (!current) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TASK_NOT_FOUND",
        message: "Task not found.",
      },
    });
  }

  const nextStatus = current.status === "PLANNED" ? "IN_PROGRESS" : "PLANNED";
  const task = await updateLearningTask(userId, taskId, { status: nextStatus });
  return res.status(200).json({
    success: true,
    data: task,
  });
}
