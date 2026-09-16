"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";
import {
  getActiveFocusSessionApi,
  startFocusSessionApi,
  pauseFocusSessionApi,
  resumeFocusSessionApi,
  completeFocusSessionApi,
  cancelFocusSessionApi,
} from "@/lib/api/focus";
import type { FocusSessionWithTask, ActionResult } from "@/types";

export async function getActiveFocusSessionAction(): Promise<ActionResult<FocusSessionWithTask | null>> {
  const token = await getSessionToken();
  const res = await getActiveFocusSessionApi(token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch active session" },
    };
  }
  return { success: true, data: res.data };
}

export async function startFocusSessionAction(rawInput: { taskId: string }): Promise<ActionResult<FocusSessionWithTask>> {
  const token = await getSessionToken();
  const res = await startFocusSessionApi(rawInput.taskId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "START_FAILED", message: res.error?.message || "Failed to start session" },
    };
  }
  revalidatePath("/focus");
  revalidatePath("/planner");
  return { success: true, data: res.data };
}

export async function pauseFocusSessionAction(rawInput: { sessionId: string }): Promise<ActionResult<FocusSessionWithTask>> {
  const token = await getSessionToken();
  const res = await pauseFocusSessionApi(rawInput.sessionId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "PAUSE_FAILED", message: res.error?.message || "Failed to pause session" },
    };
  }
  revalidatePath("/focus");
  return { success: true, data: res.data };
}

export async function resumeFocusSessionAction(rawInput: { sessionId: string }): Promise<ActionResult<FocusSessionWithTask>> {
  const token = await getSessionToken();
  const res = await resumeFocusSessionApi(rawInput.sessionId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "RESUME_FAILED", message: res.error?.message || "Failed to resume session" },
    };
  }
  revalidatePath("/focus");
  return { success: true, data: res.data };
}

export async function completeFocusSessionAction(rawInput: { sessionId: string; actualDuration: number }): Promise<ActionResult<FocusSessionWithTask>> {
  const token = await getSessionToken();
  const res = await completeFocusSessionApi(rawInput.sessionId, rawInput.actualDuration, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "COMPLETE_FAILED", message: res.error?.message || "Failed to complete session" },
    };
  }
  revalidatePath("/focus");
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { success: true, data: res.data };
}

export async function cancelFocusSessionAction(rawInput: { sessionId: string }): Promise<ActionResult<FocusSessionWithTask>> {
  const token = await getSessionToken();
  const res = await cancelFocusSessionApi(rawInput.sessionId, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "CANCEL_FAILED", message: res.error?.message || "Failed to cancel session" },
    };
  }
  revalidatePath("/focus");
  revalidatePath("/planner");
  return { success: true, data: res.data };
}

export const startFocusAction = startFocusSessionAction;
export const pauseFocusAction = pauseFocusSessionAction;
export const resumeFocusAction = resumeFocusSessionAction;
export const completeFocusAction = completeFocusSessionAction;
export const cancelFocusAction = cancelFocusSessionAction;
