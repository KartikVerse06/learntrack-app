import { describe, it, expect, beforeEach } from "vitest";
import {
  createLearningLog,
  getLearningLogByIdForUser,
  getLearningLogForFocusSession,
  updateLearningLogForUser,
  getCompletedSessionsWithoutLogs,
} from "@/repositories/learning-log-repository";
import {
  createFocusSession,
  completeFocusSession,
} from "@/repositories/focus-session-repository";
import {
  createLearningTask,
  getTaskById,
} from "@/repositories/learning-task-repository";
import { createCategory } from "@/repositories/category-repository";
import { createUser, hashPassword } from "@/repositories/user-repository";
import { prisma } from "@/lib/db";

describe("Learning Log Repository & Multi-Tenant Boundaries", () => {
  let userAId: string;
  let userBId: string;
  let taskAId: string;
  let taskBId: string;
  let sessionAId: string;
  let sessionBId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Log User A",
      email: `log_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Log User B",
      email: `log_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const categoryA = await createCategory(userAId, `Category_${timestamp}`, "#2563EB");

    const taskA = await createLearningTask(userAId, {
      title: "Task for Log A",
      description: "Deliberate study task A",
      categoryId: categoryA.id,
      plannedDate: "2026-09-25",
      priority: "HIGH",
      estimatedSessions: 3,
    });
    taskAId = taskA.id;

    const taskB = await createLearningTask(userBId, {
      title: "Task for Log B",
      description: "Deliberate study task B",
      plannedDate: "2026-09-25",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    taskBId = taskB.id;

    // Create and complete focus sessions
    const sessionA = await createFocusSession(userAId, taskAId);
    await completeFocusSession(userAId, sessionA.id, 2700);
    sessionAId = sessionA.id;

    const sessionB = await createFocusSession(userBId, taskBId);
    await completeFocusSession(userBId, sessionB.id, 2700);
    sessionBId = sessionB.id;
  });

  it("should create a learning log successfully for completed focus session", async () => {
    const log = await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Mastered the Raft consensus leader election and log replication invariants.",
      whatCompleted: "Implemented state machine transitions and vote tallying.",
      doubts: "Need to review behavior during network partitions.",
      notes: "Paper page 7, Figure 4.",
      confidence: 4,
    });

    expect(log.id).toBeDefined();
    expect(log.userId).toBe(userAId);
    expect(log.learningTaskId).toBe(taskAId);
    expect(log.focusSessionId).toBe(sessionAId);
    expect(log.whatLearned).toContain("Mastered the Raft consensus");
    expect(log.whatCompleted).toBe("Implemented state machine transitions and vote tallying.");
    expect(log.doubts).toBe("Need to review behavior during network partitions.");
    expect(log.notes).toBe("Paper page 7, Figure 4.");
    expect(log.confidence).toBe(4);
    expect(log.task.title).toBe("Task for Log A");
    expect(log.focusSession.id).toBe(sessionAId);
  });

  it("should CRITICALLY NOT create any revisions when creating a learning log (Phase 7 Boundary)", async () => {
    // 1. Verify 0 revisions exist before
    const revisionsBefore = await prisma.revision.count({
      where: { learningTaskId: taskAId },
    });
    expect(revisionsBefore).toBe(0);

    // 2. Create learning log
    await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Consensus algorithms and election timeout randomization.",
      confidence: 5,
    });

    // 3. Verify 0 revisions exist after (MUST NOT create Revision records)
    const revisionsAfter = await prisma.revision.count({
      where: { learningTaskId: taskAId },
    });
    expect(revisionsAfter).toBe(0);
  });

  it("should NOT prematurely mark the task as FULLY_COMPLETED upon log creation", async () => {
    await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Consensus algorithm fundamentals and state safety.",
      confidence: 5,
    });

    const task = await getTaskById(userAId, taskAId);
    expect(task?.status).not.toBe("FULLY_COMPLETED");
    expect(task?.status).not.toBe("REVISION_PENDING");
    expect(task?.status).toBe("IN_PROGRESS");
  });

  it("should enforce 1:1 session-to-log constraint and reject duplicate logs for the same session", async () => {
    await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Initial reflection on Raft consensus protocol.",
      confidence: 4,
    });

    // Attempting a second log for sessionA must fail
    await expect(
      createLearningLog(userAId, {
        taskId: taskAId,
        sessionId: sessionAId,
        whatLearned: "Duplicate reflection attempt.",
        confidence: 3,
      })
    ).rejects.toThrow("A learning log already exists for this focus session.");
  });

  it("should reject creating a learning log for an incomplete (ACTIVE) focus session", async () => {
    // Start an active (uncompleted) session
    const activeSession = await createFocusSession(userBId, taskBId);

    await expect(
      createLearningLog(userBId, {
        taskId: taskBId,
        sessionId: activeSession.id,
        whatLearned: "Premature reflection attempt before timer ended.",
        confidence: 3,
      })
    ).rejects.toThrow("Focus session must be completed before recording a learning log.");
  });

  it("should enforce tenant boundary: User A cannot create a learning log for User B's session", async () => {
    await expect(
      createLearningLog(userAId, {
        taskId: taskBId,
        sessionId: sessionBId,
        whatLearned: "Unauthorized log creation attempt.",
        confidence: 3,
      })
    ).rejects.toThrow("Learning task not found or access denied.");
  });

  it("should enforce tenant boundary: User A cannot read or update User B's learning log", async () => {
    const logB = await createLearningLog(userBId, {
      taskId: taskBId,
      sessionId: sessionBId,
      whatLearned: "User B reflection on distributed systems.",
      confidence: 4,
    });

    // User A cannot read User B's log
    const readAttempt = await getLearningLogByIdForUser(userAId, logB.id);
    expect(readAttempt).toBeNull();

    // User A cannot update User B's log
    await expect(
      updateLearningLogForUser(userAId, logB.id, {
        whatLearned: "Malicious update attempt by User A.",
      })
    ).rejects.toThrow("Learning log not found or access denied.");
  });

  it("should update an existing learning log successfully for authorized owner", async () => {
    const log = await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Original reflection text on Raft log replication.",
      confidence: 3,
    });

    const updated = await updateLearningLogForUser(userAId, log.id, {
      whatLearned: "Updated reflection text with refined mental model.",
      confidence: 5,
      doubts: "Clarified doubts after reading section 5.2.",
    });

    expect(updated.whatLearned).toBe("Updated reflection text with refined mental model.");
    expect(updated.confidence).toBe(5);
    expect(updated.doubts).toBe("Clarified doubts after reading section 5.2.");
  });

  it("should retrieve completed sessions without logs", async () => {
    // Before creating log, sessionA is unlogged
    const unloggedBefore = await getCompletedSessionsWithoutLogs(userAId, taskAId);
    expect(unloggedBefore.some((s) => s.id === sessionAId)).toBe(true);

    // After creating log, sessionA is no longer in unlogged list
    await createLearningLog(userAId, {
      taskId: taskAId,
      sessionId: sessionAId,
      whatLearned: "Reflection complete for session A.",
      confidence: 4,
    });

    const unloggedAfter = await getCompletedSessionsWithoutLogs(userAId, taskAId);
    expect(unloggedAfter.some((s) => s.id === sessionAId)).toBe(false);
  });
});
