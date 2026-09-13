"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";
import {
  getLearningLogsApi,
  getUnloggedSessionsApi,
  getLearningLogByIdApi,
  createLearningLogApi,
  updateLearningLogApi,
} from "@/lib/api/logs";
import type { LearningLogWithRelations, ActionResult } from "@/types";

export async function createLearningLogAction(
  rawInput: any
): Promise<ActionResult<LearningLogWithRelations>> {
  const res = await createLearningLogApi(rawInput);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "CREATE_LOG_FAILED", message: res.error?.message || "Failed to create log", details: res.error?.details },
    };
  }
  revalidatePath("/learning-logs");
  revalidatePath("/focus");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function updateLearningLogAction(
  rawInput: any
): Promise<ActionResult<LearningLogWithRelations>> {
  const { id, ...data } = rawInput;
  const res = await updateLearningLogApi(id, data);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "UPDATE_LOG_FAILED", message: res.error?.message || "Failed to update log" },
    };
  }
  revalidatePath("/learning-logs");
  revalidatePath(`/learning-logs/${id}`);
  return { success: true, data: res.data };
}

export async function getCompletedSessionsWithoutLogsAction(): Promise<ActionResult<any[]>> {
  const token = await getSessionToken();
  const res = await getUnloggedSessionsApi(token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch sessions" },
    };
  }
  return { success: true, data: res.data || [] };
}
