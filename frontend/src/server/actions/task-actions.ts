"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";
import {
  getTasksApi,
  getTaskSummaryApi,
  getTaskByIdApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  toggleTaskStatusApi,
} from "@/lib/api/tasks";
import type { TaskWithCategory, ActionResult } from "@/types";

export async function getTasksForDateAction(
  dateStr: string
): Promise<ActionResult<TaskWithCategory[]>> {
  const token = await getSessionToken();
  const res = await getTasksApi(dateStr, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch tasks" },
    };
  }
  return { success: true, data: res.data || [] };
}

export async function getDailyTaskSummaryAction(
  dateStr: string
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await getTaskSummaryApi(dateStr, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch task summary" },
    };
  }
  return { success: true, data: res.data };
}

export async function createLearningTaskAction(
  rawInput: any
): Promise<ActionResult<TaskWithCategory>> {
  const token = await getSessionToken();
  const res = await createTaskApi(rawInput, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "CREATE_FAILED", message: res.error?.message || "Failed to create task", details: res.error?.details },
    };
  }
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

import { getRelativeDateISO } from "@/lib/date-utils";

export async function updateLearningTaskAction(
  taskIdOrInput: string | any,
  maybeInput?: any
): Promise<ActionResult<TaskWithCategory>> {
  const token = await getSessionToken();
  const taskId = typeof taskIdOrInput === "string" ? taskIdOrInput : taskIdOrInput.id;
  const rawInput = typeof taskIdOrInput === "string" ? maybeInput : taskIdOrInput;
  const res = await updateTaskApi(taskId, rawInput, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "UPDATE_FAILED", message: res.error?.message || "Failed to update task", details: res.error?.details },
    };
  }
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return { success: true, data: res.data };
}

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResult<any>> {
  const token = await getSessionToken();
  const res = await deleteTaskApi(taskId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "DELETE_FAILED", message: res.error?.message || "Failed to delete task" },
    };
  }
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function toggleTaskStatusAction(
  rawInput: { id: string; status: any }
): Promise<ActionResult<TaskWithCategory>> {
  const token = await getSessionToken();
  const res = await toggleTaskStatusApi(rawInput.id, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "TOGGLE_FAILED", message: res.error?.message || "Failed to toggle task status" },
    };
  }
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${rawInput.id}`);
  return { success: true, data: res.data };
}

export async function moveTaskToTomorrowAction(
  taskId: string,
  currentPlannedDate: string
): Promise<ActionResult<TaskWithCategory>> {
  const tomorrow = getRelativeDateISO(currentPlannedDate, 1);
  return updateLearningTaskAction(taskId, { plannedDate: tomorrow });
}

export const createTaskAction = createLearningTaskAction;
export const updateTaskAction = updateLearningTaskAction;
export const moveTaskToTomorrow = moveTaskToTomorrowAction;
