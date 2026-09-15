import { describe, it, expect, beforeEach } from "vitest";
import {
  createFocusSession,
  getActiveFocusSession,
  getFocusSessionById,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  cancelFocusSession,
} from "@/repositories/focus-session-repository";
import {
  createLearningTask,
  getTaskById,
} from "@/repositories/learning-task-repository";
import { createCategory } from "@/repositories/category-repository";
import { createUser, hashPassword } from "@/repositories/user-repository";
import { prisma } from "@/lib/db";

describe("Focus Session Repository & State Machine", () => {
  let userAId: string;
  let userBId: string;
  let taskAId: string;
  let taskBId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Focus User A",
      email: `focus_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Focus User B",
      email: `focus_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const categoryA = await createCategory(userAId, `Category_${timestamp}`, "#10B981");

    const taskA = await createLearningTask(userAId, {
      title: "Task for Focus A",
      description: "Deliberate study task A",
      categoryId: categoryA.id,
      plannedDate: "2026-09-20",
      priority: "HIGH",
      estimatedSessions: 3,
    });
    taskAId = taskA.id;

    const taskB = await createLearningTask(userBId, {
      title: "Task for Focus B",
      description: "Deliberate study task B",
      plannedDate: "2026-09-20",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    taskBId = taskB.id;
  });

  it("should create an active focus session and advance task status to IN_PROGRESS", async () => {
    const session = await createFocusSession(userAId, taskAId);

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(userAId);
    expect(session.learningTaskId).toBe(taskAId);
    expect(session.status).toBe("ACTIVE");
    expect(session.plannedDuration).toBe(2700);
    expect(session.actualDuration).toBe(0);
    expect(session.pausedDuration).toBe(0);
    expect(session.task.title).toBe("Task for Focus A");

    // Verify task status progressed to IN_PROGRESS
    const updatedTask = await getTaskById(userAId, taskAId);
    expect(updatedTask?.status).toBe("IN_PROGRESS");

    // Verify getActiveFocusSession returns this session
    const active = await getActiveFocusSession(userAId);
    expect(active?.id).toBe(session.id);
  });

  it("should enforce single active session constraint and reject duplicate concurrent sessions", async () => {
    await createFocusSession(userAId, taskAId);

    // Attempting to start another session while one is active must be rejected
    await expect(createFocusSession(userAId, taskAId)).rejects.toThrow(
      "An active focus session is already running."
    );
  });

  it("should enforce tenant boundary: User A cannot start focus on User B's task", async () => {
    await expect(createFocusSession(userAId, taskBId)).rejects.toThrow(
      "Learning task not found or access denied."
    );
  });

  it("should pause an active session and handle idempotent pause", async () => {
    const session = await createFocusSession(userAId, taskAId);

    const paused = await pauseFocusSession(userAId, session.id);
    expect(paused.status).toBe("PAUSED");

    // Idempotent pause call
    const pausedAgain = await pauseFocusSession(userAId, session.id);
    expect(pausedAgain.status).toBe("PAUSED");

    // User B cannot pause User A's session
    await expect(pauseFocusSession(userBId, session.id)).rejects.toThrow(
      "Focus session not found or access denied."
    );
  });

  it("should resume a paused session and accumulate paused duration", async () => {
    const session = await createFocusSession(userAId, taskAId);
    await pauseFocusSession(userAId, session.id);

    const resumed = await resumeFocusSession(userAId, session.id);
    expect(resumed.status).toBe("ACTIVE");
    expect(resumed.pausedDuration).toBeGreaterThanOrEqual(0);

    // Idempotent resume call
    const resumedAgain = await resumeFocusSession(userAId, session.id);
    expect(resumedAgain.status).toBe("ACTIVE");

    // User B cannot resume User A's session
    await expect(resumeFocusSession(userBId, session.id)).rejects.toThrow(
      "Focus session not found or access denied."
    );
  });

  it("should complete a session, record actual duration, increment task stats idempotently", async () => {
    const session = await createFocusSession(userAId, taskAId);

    const completed = await completeFocusSession(userAId, session.id, 2700);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.actualDuration).toBe(2700);
    expect(completed.endedAt).toBeDefined();

    // Verify task metrics updated
    const taskAfter = await getTaskById(userAId, taskAId);
    expect(taskAfter?.completedSessions).toBe(1);
    expect(taskAfter?.totalFocusMinutes).toBe(45);

    // Idempotent completion call must NOT increment task stats a second time
    const completedAgain = await completeFocusSession(userAId, session.id, 2700);
    expect(completedAgain.status).toBe("COMPLETED");

    const taskAfterSecond = await getTaskById(userAId, taskAId);
    expect(taskAfterSecond?.completedSessions).toBe(1);
    expect(taskAfterSecond?.totalFocusMinutes).toBe(45);

    // User B cannot complete User A's session
    await expect(completeFocusSession(userBId, session.id, 2700)).rejects.toThrow(
      "Focus session not found or access denied."
    );
  });

  it("should cancel a session and not increment task statistics", async () => {
    const session = await createFocusSession(userAId, taskAId);

    const cancelled = await cancelFocusSession(userAId, session.id);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.endedAt).toBeDefined();

    // Verify task metrics were NOT incremented
    const taskAfter = await getTaskById(userAId, taskAId);
    expect(taskAfter?.completedSessions).toBe(0);
    expect(taskAfter?.totalFocusMinutes).toBe(0);

    // Idempotent cancel
    const cancelledAgain = await cancelFocusSession(userAId, session.id);
    expect(cancelledAgain.status).toBe("CANCELLED");

    // User B cannot cancel User A's session
    await expect(cancelFocusSession(userBId, session.id)).rejects.toThrow(
      "Focus session not found or access denied."
    );
  });

  it("should reject starting focus on a FULLY_COMPLETED task", async () => {
    // Mark task as FULLY_COMPLETED directly in DB
    await prisma.learningTask.update({
      where: { id: taskAId },
      data: { status: "FULLY_COMPLETED" },
    });

    await expect(createFocusSession(userAId, taskAId)).rejects.toThrow(
      "Cannot start focus on a fully completed task."
    );
  });
});
