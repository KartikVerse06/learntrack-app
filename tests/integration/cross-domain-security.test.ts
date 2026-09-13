import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/date-utils";
import {
  createLearningTask,
  getTaskByIdForUser,
  updateTaskForUser,
  deleteTaskForUser,
  updateTaskStatusForUser,
} from "@/server/repositories/learning-task-repository";
import {
  createFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  cancelFocusSession,
  getFocusSessionByIdForUser,
} from "@/server/repositories/focus-session-repository";
import {
  createLearningLog,
  getLearningLogByIdForUser,
  updateLearningLogForUser,
} from "@/server/repositories/learning-log-repository";
import {
  markTopicAsLearned,
  completeRevision,
  getRevisionByIdForUser,
} from "@/server/repositories/revision-repository";
import { getCalendarEvents } from "@/server/repositories/calendar-repository";
import { getFullAnalyticsPayload } from "@/server/repositories/analytics-repository";

describe("Cross-Domain Multi-Tenant Security & Penetration Suite", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 1000000);
    userA = await prisma.user.create({
      data: {
        email: `sec-user-a-${timestamp}@learntrack.test`,
        name: "Security User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `sec-user-b-${timestamp}@learntrack.test`,
        name: "Security User B",
      },
    });
  });

  afterAll(async () => {
    await prisma.learningLog.deleteMany({
      where: { user: { email: { contains: "sec-user-" } } },
    });
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "sec-user-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "sec-user-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "sec-user-" } } },
    });
    await prisma.category.deleteMany({
      where: { user: { email: { contains: "sec-user-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "sec-user-" } },
    });
  });

  describe("1. Task Management Penetration Guard", () => {
    it("should prevent User B from reading, updating, altering status, or deleting User A's task", async () => {
      const taskA = await createLearningTask(userA.id, {
        title: "Confidential Algorithms",
        plannedDate: "2026-09-11",
        priority: "HIGH",
        estimatedSessions: 2,
      });

      // User B attempts to read User A's task
      const readAttempt = await getTaskByIdForUser(userB.id, taskA.id);
      expect(readAttempt).toBeNull();

      // User B attempts to update User A's task
      await expect(
        updateTaskForUser(userB.id, taskA.id, { title: "Hacked Title" })
      ).rejects.toThrow(/access denied/i);

      // User B attempts to change status of User A's task
      await expect(
        updateTaskStatusForUser(userB.id, taskA.id, "IN_PROGRESS")
      ).rejects.toThrow(/access denied/i);

      // User B attempts to delete User A's task
      await expect(
        deleteTaskForUser(userB.id, taskA.id)
      ).rejects.toThrow(/access denied/i);

      // Verify User A's task remains intact
      const intact = await getTaskByIdForUser(userA.id, taskA.id);
      expect(intact).not.toBeNull();
      expect(intact?.title).toBe("Confidential Algorithms");
    });

    it("should reject attaching User A's category to User B's task", async () => {
      const catA = await prisma.category.create({
        data: {
          userId: userA.id,
          name: "User A Category",
        },
      });

      // User B attempts to create a task referencing User A's category
      await expect(
        createLearningTask(userB.id, {
          title: "User B Task",
          plannedDate: "2026-09-11",
          categoryId: catA.id,
        })
      ).rejects.toThrow(/Specified category not found or access denied/i);
    });
  });

  describe("2. Focus Session Penetration Guard", () => {
    it("should prevent User B from launching focus on User A's task, or mutating User A's session", async () => {
      const taskA = await createLearningTask(userA.id, {
        title: "Microservices Architecture",
        plannedDate: "2026-09-11",
      });

      // User B attempts to start focus on User A's task
      await expect(
        createFocusSession(userB.id, taskA.id)
      ).rejects.toThrow(/Learning task not found or access denied/i);

      // User A starts legitimate session
      const sessionA = await createFocusSession(userA.id, taskA.id);

      // User B attempts to pause User A's session
      await expect(
        pauseFocusSession(userB.id, sessionA.id)
      ).rejects.toThrow(/Focus session not found or access denied/i);

      // User B attempts to resume User A's session
      await expect(
        resumeFocusSession(userB.id, sessionA.id)
      ).rejects.toThrow(/Focus session not found or access denied/i);

      // User B attempts to complete User A's session
      await expect(
        completeFocusSession(userB.id, sessionA.id)
      ).rejects.toThrow(/Focus session not found or access denied/i);

      // User B attempts to cancel User A's session
      await expect(
        cancelFocusSession(userB.id, sessionA.id)
      ).rejects.toThrow(/Focus session not found or access denied/i);

      // User B attempts to read User A's session details
      const readSession = await getFocusSessionByIdForUser(userB.id, sessionA.id);
      expect(readSession).toBeNull();
    });
  });

  describe("3. Learning Log Penetration Guard", () => {
    it("should prevent User B from submitting or reading learning logs on User A's session", async () => {
      const taskA = await createLearningTask(userA.id, {
        title: "Zero Knowledge Proofs",
        plannedDate: "2026-09-11",
      });

      const sessionA = await createFocusSession(userA.id, taskA.id);
      await completeFocusSession(userA.id, sessionA.id);

      // User B attempts to create a log for User A's completed session
      await expect(
        createLearningLog(userB.id, {
          taskId: taskA.id,
          sessionId: sessionA.id,
          whatLearned: "Unauthorized log submission attempt.",
          confidence: 4,
        })
      ).rejects.toThrow(/Learning task not found or access denied|Focus session not found or access denied/i);

      // User A creates legitimate log
      const logA = await createLearningLog(userA.id, {
        taskId: taskA.id,
        sessionId: sessionA.id,
        whatLearned: "Legitimate user reflections on zk-SNARKs.",
        confidence: 4,
      });

      // User B attempts to read User A's log
      const readAttempt = await getLearningLogByIdForUser(userB.id, logA.id);
      expect(readAttempt).toBeNull();

      // User B attempts to update User A's log
      await expect(
        updateLearningLogForUser(userB.id, logA.id, { whatLearned: "Compromised." })
      ).rejects.toThrow(/Learning log not found or access denied/i);
    });
  });

  describe("4. Spaced Revision Engine Penetration Guard", () => {
    it("should prevent User B from triggering revisions or completing User A's revisions", async () => {
      const taskA = await createLearningTask(userA.id, {
        title: "Memory Safety in Rust",
        plannedDate: "2026-09-11",
      });

      // User B attempts to mark User A's topic as learned
      await expect(
        markTopicAsLearned(userB.id, taskA.id)
      ).rejects.toThrow(/Task not found or access denied/i);

      // User A marks topic as learned, creating 4 revisions
      const { revisions } = await markTopicAsLearned(userA.id, taskA.id);
      const rev1 = revisions[0];

      // User B attempts to read User A's revision
      const readRev = await getRevisionByIdForUser(userB.id, rev1.id);
      expect(readRev).toBeNull();

      // User B attempts to complete User A's revision
      await expect(
        completeRevision(userB.id, rev1.id, { confidence: 5 })
      ).rejects.toThrow(/Revision not found or access denied/i);
    });
  });

  describe("5. Calendar & Analytics Zero-Trust Isolation", () => {
    it("should ensure Calendar queries and Analytics aggregations strictly isolate tenant data", async () => {
      // Create complete activity for User A
      const taskA = await createLearningTask(userA.id, {
        title: "Kernel Synchronization",
        plannedDate: "2026-09-11",
      });

      const sessionA = await createFocusSession(userA.id, taskA.id);
      await completeFocusSession(userA.id, sessionA.id);
      await markTopicAsLearned(userA.id, taskA.id);

      // 1. Calendar Query: User B queries events in September 2026
      const calB = await getCalendarEvents(userB.id, "2026-09-01", "2026-09-30");
      expect(calB.length).toBe(0);

      // User A queries same range
      const calA = await getCalendarEvents(userA.id, "2026-09-01", "2026-09-30");
      expect(calA.length).toBeGreaterThan(0);

      // 2. Analytics Query: User B queries 30d analytics
      const analyticsB = await getFullAnalyticsPayload(userB.id, "30d", "UTC");
      expect(analyticsB.hasActivity).toBe(false);
      expect(analyticsB.summary.totalFocusMinutes).toBe(0);
      expect(analyticsB.summary.topicsLearned).toBe(0);
      expect(analyticsB.dailyFocus.every((d) => d.focusMinutes === 0)).toBe(true);

      // User A queries analytics
      const analyticsA = await getFullAnalyticsPayload(userA.id, "30d", "UTC");
      expect(analyticsA.hasActivity).toBe(true);
      expect(analyticsA.summary.totalFocusMinutes).toBe(45);
      expect(analyticsA.summary.topicsLearned).toBe(1);
    });
  });
});
