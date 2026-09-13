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

import {
  startFocusAction,
  pauseFocusAction,
  resumeFocusAction,
  completeFocusAction,
  cancelFocusAction,
  getActiveFocusSessionAction,
} from "@/server/actions/focus-actions";
import { createLearningTask } from "@/server/repositories/learning-task-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Focus Session Server Actions", () => {
  let userAId: string;
  let userBId: string;
  let taskAId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Focus Action A",
      email: `focus_action_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Focus Action B",
      email: `focus_action_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const taskA = await createLearningTask(userAId, {
      title: "Task for Focus Action",
      plannedDate: "2026-09-21",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    taskAId = taskA.id;

    mockCurrentUserId = userAId;
  });

  it("should start a focus session successfully for authenticated user", async () => {
    const res = await startFocusAction({ taskId: taskAId });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.status).toBe("ACTIVE");
    expect(res.data.learningTaskId).toBe(taskAId);
  });

  it("should return UNAUTHORIZED if user is not authenticated", async () => {
    mockCurrentUserId = null;

    const res = await startFocusAction({ taskId: taskAId });

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("UNAUTHORIZED");
  });

  it("should return VALIDATION_ERROR for malformed task ID", async () => {
    const res = await startFocusAction({ taskId: "not-a-cuid" });

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return CONFLICT_ERROR if an active session is already running", async () => {
    const firstRes = await startFocusAction({ taskId: taskAId });
    expect(firstRes.success).toBe(true);

    const secondRes = await startFocusAction({ taskId: taskAId });
    expect(secondRes.success).toBe(false);
    if (secondRes.success) return;

    expect(secondRes.error.code).toBe("CONFLICT_ERROR");
    expect(secondRes.error.message).toContain("already running");
  });

  it("should pause and resume a session through server actions", async () => {
    const startRes = await startFocusAction({ taskId: taskAId });
    expect(startRes.success).toBe(true);
    if (!startRes.success) return;

    const sessionId = startRes.data.id;

    const pauseRes = await pauseFocusAction({ sessionId });
    expect(pauseRes.success).toBe(true);
    if (!pauseRes.success) return;
    expect(pauseRes.data.status).toBe("PAUSED");

    const resumeRes = await resumeFocusAction({ sessionId });
    expect(resumeRes.success).toBe(true);
    if (!resumeRes.success) return;
    expect(resumeRes.data.status).toBe("ACTIVE");
  });

  it("should complete a session and update stats through server action", async () => {
    const startRes = await startFocusAction({ taskId: taskAId });
    expect(startRes.success).toBe(true);
    if (!startRes.success) return;

    const sessionId = startRes.data.id;

    const completeRes = await completeFocusAction({
      sessionId,
      actualDuration: 2700,
    });

    expect(completeRes.success).toBe(true);
    if (!completeRes.success) return;

    expect(completeRes.data.status).toBe("COMPLETED");
    expect(completeRes.data.actualDuration).toBe(2700);
  });

  it("should cancel a session through server action", async () => {
    const startRes = await startFocusAction({ taskId: taskAId });
    expect(startRes.success).toBe(true);
    if (!startRes.success) return;

    const sessionId = startRes.data.id;

    const cancelRes = await cancelFocusAction({ sessionId });

    expect(cancelRes.success).toBe(true);
    if (!cancelRes.success) return;

    expect(cancelRes.data.status).toBe("CANCELLED");
  });

  it("should fetch active focus session for current user", async () => {
    const noneRes = await getActiveFocusSessionAction();
    expect(noneRes.success).toBe(true);
    if (!noneRes.success) return;
    expect(noneRes.data).toBeNull();

    await startFocusAction({ taskId: taskAId });

    const activeRes = await getActiveFocusSessionAction();
    expect(activeRes.success).toBe(true);
    if (!activeRes.success) return;
    expect(activeRes.data?.learningTaskId).toBe(taskAId);
  });
});
