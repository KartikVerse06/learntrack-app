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
  createLearningLogAction,
  updateLearningLogAction,
  getLearningLogByIdAction,
  getLearningLogForSessionAction,
} from "@/server/actions/learning-log-actions";
import { createLearningTask } from "@/server/repositories/learning-task-repository";
import {
  createFocusSession,
  completeFocusSession,
} from "@/server/repositories/focus-session-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Learning Log Server Actions & Validation", () => {
  let userAId: string;
  let userBId: string;
  let taskAId: string;
  let sessionAId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Action Log User A",
      email: `action_log_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Action Log User B",
      email: `action_log_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const taskA = await createLearningTask(userAId, {
      title: "Task for Action Log",
      plannedDate: "2026-09-26",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    taskAId = taskA.id;

    const sessionA = await createFocusSession(userAId, taskAId);
    await completeFocusSession(userAId, sessionA.id, 2700);
    sessionAId = sessionA.id;

    mockCurrentUserId = userAId;
  });

  it("should create a learning log successfully via server action", async () => {
    const res = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Analyzed lock-free queue implementations using atomic compare-and-swap.",
      whatCompleted: "Implemented Michael-Scott queue.",
      doubts: "Need to verify memory reclamation under Hazard Pointers.",
      notes: "Reference: Herlihy & Shavit, Chapter 10.",
      confidence: 4,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.id).toBeDefined();
    expect(res.data.whatLearned).toContain("lock-free queue");
    expect(res.data.confidence).toBe(4);
  });

  it("should return UNAUTHORIZED when not authenticated", async () => {
    mockCurrentUserId = null;

    const res = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Valid reflection text of at least 10 characters.",
      confidence: 3,
    });

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject creation with VALIDATION_ERROR if reflection is under 10 characters", async () => {
    const res = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Too short",
      confidence: 3,
    });

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("VALIDATION_ERROR");
    expect(res.error.details?.whatLearned).toBeDefined();
  });

  it("should reject creation with VALIDATION_ERROR if confidence is outside 1-5", async () => {
    const res = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Valid reflection text with sufficient characters.",
      confidence: 6,
    });

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.error.code).toBe("VALIDATION_ERROR");
    expect(res.error.details?.confidence).toBeDefined();
  });

  it("should return CONFLICT_ERROR on duplicate log submission", async () => {
    const firstRes = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "First valid submission of learning reflection.",
      confidence: 4,
    });
    expect(firstRes.success).toBe(true);

    const secondRes = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Second duplicate submission for the same session.",
      confidence: 4,
    });

    expect(secondRes.success).toBe(false);
    if (secondRes.success) return;

    expect(secondRes.error.code).toBe("CONFLICT_ERROR");
  });

  it("should update a learning log through server action", async () => {
    const createRes = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Initial reflection for update test.",
      confidence: 2,
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;

    const logId = createRes.data.id;

    const updateRes = await updateLearningLogAction({
      id: logId,
      whatLearned: "Updated reflection text demonstrating progression.",
      confidence: 4,
    });

    expect(updateRes.success).toBe(true);
    if (!updateRes.success) return;

    expect(updateRes.data.confidence).toBe(4);
    expect(updateRes.data.whatLearned).toBe("Updated reflection text demonstrating progression.");
  });

  it("should fetch learning log by ID and session ID", async () => {
    const createRes = await createLearningLogAction({
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Reflection for fetch testing.",
      confidence: 5,
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;

    const byIdRes = await getLearningLogByIdAction(createRes.data.id);
    expect(byIdRes.success).toBe(true);
    if (!byIdRes.success) return;
    expect(byIdRes.data?.id).toBe(createRes.data.id);

    const bySessionRes = await getLearningLogForSessionAction(sessionAId);
    expect(bySessionRes.success).toBe(true);
    if (!bySessionRes.success) return;
    expect(bySessionRes.data?.id).toBe(createRes.data.id);
  });
});
