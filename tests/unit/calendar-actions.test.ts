import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache revalidation in test environment
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let mockCurrentUserId: string | null = null;

// Mock requireAuth to point to mockCurrentUserId
vi.mock("@/lib/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Authentication required.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
  requireAuth: vi.fn(async () => {
    if (!mockCurrentUserId) {
      const { UnauthorizedError } = await import("@/lib/session");
      throw new UnauthorizedError();
    }
    return { userId: mockCurrentUserId };
  }),
}));

import { getCalendarEventsAction } from "@/server/actions/calendar-actions";
import { createLearningTask } from "@/server/repositories/learning-task-repository";
import { markTopicAsLearned } from "@/server/repositories/revision-repository";
import {
  createFocusSession,
  completeFocusSession,
} from "@/server/repositories/focus-session-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Calendar Server Actions & Multi-Tenant Boundaries", () => {
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Calendar Act User A",
      email: `cal_act_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Calendar Act User B",
      email: `cal_act_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    mockCurrentUserId = userAId;
  });

  it("should fetch user calendar events within date range successfully", async () => {
    // Create task for User A
    const task = await createLearningTask(userAId, {
      title: "Distributed Systems Protocols",
      plannedDate: "2026-09-12",
    });

    // Create completed focus session
    const session = await createFocusSession(userAId, task.id);
    await completeFocusSession(userAId, session.id, 2700);

    // Mark as learned to generate revisions
    await markTopicAsLearned(userAId, task.id);

    // Call calendar action for September 2026
    const res = await getCalendarEventsAction("2026-09-01", "2026-09-30");

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.length).toBeGreaterThanOrEqual(3);

    const taskEvent = res.data.find((e) => e.extendedProps.type === "TASK");
    expect(taskEvent).toBeDefined();
    expect(taskEvent?.title).toBe("Distributed Systems Protocols");
    expect(taskEvent?.allDay).toBe(true);

    const revEvents = res.data.filter((e) => e.extendedProps.type === "REVISION");
    expect(revEvents.length).toBeGreaterThanOrEqual(1);

    const focusEvent = res.data.find((e) => e.extendedProps.type === "FOCUS_SESSION");
    expect(focusEvent).toBeDefined();
    expect(focusEvent?.allDay).toBe(false);
  });

  it("should return UNAUTHORIZED when no user session is present", async () => {
    mockCurrentUserId = null;

    const res = await getCalendarEventsAction("2026-09-01", "2026-09-30");

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject invalid date range with VALIDATION_ERROR", async () => {
    const res = await getCalendarEventsAction("", "");

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("VALIDATION_ERROR");
  });

  it("should isolate calendar events between distinct users", async () => {
    // User A creates a task
    await createLearningTask(userAId, {
      title: "User A Confidential Study",
      plannedDate: "2026-09-12",
    });

    // Switch to User B
    mockCurrentUserId = userBId;

    const res = await getCalendarEventsAction("2026-09-01", "2026-09-30");

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.find((e) => e.title.includes("User A Confidential"))).toBeUndefined();
  });
});
