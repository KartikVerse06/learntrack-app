"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/server/validators/task";
import {
  createLearningTask,
  updateLearningTask,
  deleteLearningTask,
  getTaskById,
  type TaskWithCategory,
} from "@/server/repositories/learning-task-repository";
import { getRelativeDateISO } from "@/lib/date-utils";
import type { ActionResult } from "@/types";

export async function createTaskAction(
  rawInput: CreateTaskInput
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CreateTaskSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the form errors.",
          details: fieldErrors,
        },
      };
    }

    const { title, description, categoryId, plannedDate, priority, estimatedSessions } =
      parseResult.data;

    const task = await createLearningTask(userId, {
      title,
      description: description || null,
      categoryId: categoryId || null,
      plannedDate,
      priority,
      estimatedSessions,
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create learning task.";
    return {
      success: false,
      error: {
        code: "CREATE_TASK_FAILED",
        message,
      },
    };
  }
}

export async function updateTaskAction(
  rawInput: UpdateTaskInput
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = UpdateTaskSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the form errors.",
          details: fieldErrors,
        },
      };
    }

    const { id, title, description, categoryId, plannedDate, priority, estimatedSessions, status } =
      parseResult.data;

    const task = await updateLearningTask(userId, id, {
      title,
      description: description !== undefined ? description || null : undefined,
      categoryId: categoryId !== undefined ? categoryId || null : undefined,
      plannedDate,
      priority,
      estimatedSessions,
      status,
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update learning task.";
    return {
      success: false,
      error: {
        code: "UPDATE_TASK_FAILED",
        message,
      },
    };
  }
}

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await requireAuth();

    if (!taskId || typeof taskId !== "string") {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task ID.",
        },
      };
    }

    const result = await deleteLearningTask(userId, taskId);

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete learning task.";
    return {
      success: false,
      error: {
        code: "DELETE_TASK_FAILED",
        message,
      },
    };
  }
}

export async function moveTaskToTomorrowAction(
  taskId: string,
  currentPlannedDate: string
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { userId } = await requireAuth();

    const task = await getTaskById(userId, taskId);
    if (!task) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Learning task not found or access denied.",
        },
      };
    }

    const tomorrowDate = getRelativeDateISO(currentPlannedDate, 1);

    const updatedTask = await updateLearningTask(userId, taskId, {
      plannedDate: tomorrowDate,
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedTask,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reschedule task to tomorrow.";
    return {
      success: false,
      error: {
        code: "MOVE_TASK_FAILED",
        message,
      },
    };
  }
}
