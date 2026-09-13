"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";
import {
  getRevisionsApi,
  getRevisionMetricsApi,
  getRevisionByIdApi,
  completeRevisionApi,
  markTopicAsLearnedApi,
} from "@/lib/api/revisions";
import type { RevisionWithTask, RevisionWithDetails, RevisionMetrics, ActionResult } from "@/types";

export async function getRevisionDetailsAction(
  rawInput: string | { revisionId: string }
): Promise<ActionResult<RevisionWithDetails>> {
  const revisionId = typeof rawInput === "string" ? rawInput : rawInput.revisionId;
  const token = await getSessionToken();
  const res = await getRevisionByIdApi(revisionId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch revision details" },
    };
  }
  return { success: true, data: res.data };
}

export async function getRevisionsAction(
  filter: "due" | "upcoming" | "completed" | "all" = "due",
  categoryId?: string
): Promise<ActionResult<RevisionWithTask[]>> {
  const token = await getSessionToken();
  const res = await getRevisionsApi(filter, categoryId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch revisions" },
    };
  }
  return { success: true, data: res.data || [] };
}

export async function getRevisionMetricsAction(): Promise<ActionResult<RevisionMetrics>> {
  const token = await getSessionToken();
  const res = await getRevisionMetricsApi(token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch metrics" },
    };
  }
  return { success: true, data: res.data };
}

export async function completeRevisionAction(
  rawInput: { revisionId: string; confidence: number; notes?: string }
): Promise<ActionResult<any>> {
  const res = await completeRevisionApi(rawInput.revisionId, {
    confidence: rawInput.confidence,
    notes: rawInput.notes,
  });
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "COMPLETE_REVISION_FAILED", message: res.error?.message || "Failed to complete revision" },
    };
  }
  revalidatePath("/revisions");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function markTopicAsLearnedAction(
  rawInput: string | { taskId: string }
): Promise<ActionResult<any>> {
  const taskId = typeof rawInput === "string" ? rawInput : rawInput.taskId;
  const res = await markTopicAsLearnedApi(taskId);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "MARK_LEARNED_FAILED", message: res.error?.message || "Failed to mark topic as learned" },
    };
  }
  revalidatePath("/revisions");
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return { success: true, data: res.data };
}
