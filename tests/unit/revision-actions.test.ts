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
  markTopicAsLearnedAction,
  completeRevisionAction,
  getRevisionsAction,
  getRevisionDetailsAction,
  getRevisionMetricsAction,
} from "@/server/actions/revision-actions";
import { createLearningTask } from "@/server/repositories/learning-task-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Revision Server Actions & Validation", () => {
  let userAId: string;
  let userBId: string;
  let taskAId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Action Rev User A",
      email: `action_rev_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Action Rev User B",
      email: `action_rev_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const task = await createLearningTask(userAId, {
      title: "Rust Ownership & Lifetimes",
      plannedDate: "2026-09-11",
    });
    taskAId = task.id;

    mockCurrentUserId = userAId;
  });

  it("should mark topic as learned successfully via server action", async () => {
    const result = await markTopicAsLearnedAction(taskAId);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.task.status).toBe("REVISION_PENDING");
    expect(result.data.revisions).toHaveLength(4);
  });

  it("should return UNAUTHORIZED when no user is logged in", async () => {
    mockCurrentUserId = null;

    const result = await markTopicAsLearnedAction(taskAId);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject invalid task ID with VALIDATION_ERROR", async () => {
    const result = await markTopicAsLearnedAction("not-a-cuid");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("should complete a revision via server action with validation", async () => {
    // 1. Mark as learned to generate milestones
    const learnRes = await markTopicAsLearnedAction(taskAId);
    expect(learnRes.success).toBe(true);
    if (!learnRes.success) return;

    const r1 = learnRes.data.revisions[0];

    // 2. Complete revision with valid confidence
    const completeRes = await completeRevisionAction({
      revisionId: r1.id,
      notes: "Clear memory on borrow checking rules",
      confidence: 4,
    });

    expect(completeRes.success).toBe(true);
    if (!completeRes.success) return;

    expect(completeRes.data.revision.status).toBe("COMPLETED");
    expect(completeRes.data.isTopicMastered).toBe(false);
  });

  it("should reject revision completion if confidence is outside 1-5", async () => {
    const learnRes = await markTopicAsLearnedAction(taskAId);
    if (!learnRes.success) return;
    const r1 = learnRes.data.revisions[0];

    const invalidRes = await completeRevisionAction({
      revisionId: r1.id,
      notes: "Invalid score",
      confidence: 10,
    });

    expect(invalidRes.success).toBe(false);
    if (invalidRes.success) return;

    expect(invalidRes.error.code).toBe("VALIDATION_ERROR");
    expect(invalidRes.error.details?.confidence).toBeDefined();
  });

  it("should prevent User B from completing User A's revision via server action", async () => {
    const learnRes = await markTopicAsLearnedAction(taskAId);
    if (!learnRes.success) return;
    const r1 = learnRes.data.revisions[0];

    // Switch to User B
    mockCurrentUserId = userBId;

    const crossUserRes = await completeRevisionAction({
      revisionId: r1.id,
      notes: "Hacking revision",
      confidence: 5,
    });

    expect(crossUserRes.success).toBe(false);
    if (crossUserRes.success) return;

    expect(crossUserRes.error.code).toBe("NOT_FOUND");
  });

  it("should fetch revision details and metrics for authenticated user", async () => {
    await markTopicAsLearnedAction(taskAId);

    const metricsRes = await getRevisionMetricsAction();
    expect(metricsRes.success).toBe(true);
    if (!metricsRes.success) return;

    expect(metricsRes.data.dueToday).toBe(1);
    expect(metricsRes.data.upcoming).toBe(3);

    const listRes = await getRevisionsAction("due");
    expect(listRes.success).toBe(true);
    if (!listRes.success) return;

    expect(listRes.data).toHaveLength(1);
    expect(listRes.data[0].revisionNumber).toBe(1);

    const detailRes = await getRevisionDetailsAction(listRes.data[0].id);
    expect(detailRes.success).toBe(true);
  });
});
