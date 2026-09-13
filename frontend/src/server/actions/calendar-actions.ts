"use server";

import { getSessionToken } from "@/lib/session";
import { getCalendarEventsApi } from "@/lib/api/calendar";
import type { ActionResult } from "@/types";

export async function getCalendarEventsAction(
  startOrInput: string | { start: string; end: string },
  maybeEnd?: string
): Promise<ActionResult<any[]>> {
  const start = typeof startOrInput === "string" ? startOrInput : startOrInput.start;
  const end = typeof startOrInput === "string" ? (maybeEnd || "") : startOrInput.end;
  const token = await getSessionToken();
  const res = await getCalendarEventsApi(start, end, token);
  if (!res.success) {
    return {
      success: false,
      error: { code: res.error?.code || "FAILED", message: res.error?.message || "Failed to fetch calendar events" },
    };
  }
  return { success: true, data: res.data || [] };
}
