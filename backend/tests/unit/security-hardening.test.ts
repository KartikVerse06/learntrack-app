import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { CreateTaskSchema, UpdateTaskSchema } from "@/validators/task";
import { CreateLearningLogSchema } from "@/validators/learning-log";
import { CompleteSessionSchema } from "@/validators/focus";
import { CompleteRevisionSchema } from "@/validators/revision";
import {
  createLearningTask,
  updateLearningTask,
  getTaskByIdForUser,
} from "@/repositories/learning-task-repository";

describe("Phase 12: Production Security Hardening & Penetration Tests", () => {
  let testUser: { id: string; email: string };

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 1000000);
    testUser = await prisma.user.create({
      data: {
        email: `sec-harden-${timestamp}@learntrack.test`,
        name: "Security Harden User",
      },
    });
  });

  afterAll(async () => {
    await prisma.learningLog.deleteMany({
      where: { user: { email: { contains: "sec-harden-" } } },
    });
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "sec-harden-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "sec-harden-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "sec-harden-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "sec-harden-" } },
    });
  });

  describe("1. Mass Assignment Defense & Protected Field Immutability", () => {
    it("should strip or reject unauthorized fields when validating update task inputs", () => {
      const maliciousInput = {
        id: "cju0000000000000000000000",
        title: "Valid Title",
        userId: "hacker-user-id",
        completedSessions: 999,
        totalFocusMinutes: 99999,
        fullyCompletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "FULLY_COMPLETED", // Disallowed direct jump
      };

      const result = UpdateTaskSchema.safeParse(maliciousInput);
      expect(result.success).toBe(false); // Fails because status FULLY_COMPLETED is disallowed in UpdateTaskSchema
    });

    it("should never overwrite userId, completedSessions, or totalFocusMinutes during repository update", async () => {
      const task = await createLearningTask(testUser.id, {
        title: "Immutable Fields Test",
        plannedDate: "2026-09-11",
      });

      // Attempt to pass malicious fields via update payload
      const untrustedPayload: any = {
        title: "Legitimately Updated Title",
        userId: "hacker-user-id",
        completedSessions: 999,
        totalFocusMinutes: 50000,
        fullyCompletedAt: new Date(),
      };

      await updateLearningTask(testUser.id, task.id, untrustedPayload);

      const refreshed = await getTaskByIdForUser(testUser.id, task.id);
      expect(refreshed?.title).toBe("Legitimately Updated Title");
      expect(refreshed?.userId).toBe(testUser.id); // Untouched
      expect(refreshed?.completedSessions).toBe(0); // Untouched
      expect(refreshed?.totalFocusMinutes).toBe(0); // Untouched
      expect(refreshed?.fullyCompletedAt).toBeNull(); // Untouched
    });

    it("should prevent direct leap to FULLY_COMPLETED status via repository update", async () => {
      const task = await createLearningTask(testUser.id, {
        title: "Mastery Leap Prevention",
        plannedDate: "2026-09-11",
      });

      await expect(
        updateLearningTask(testUser.id, task.id, { status: "FULLY_COMPLETED" as any })
      ).rejects.toThrow(/Cannot directly mark topic as fully completed/i);
    });
  });

  describe("2. XSS Payload Neutralization & Literal Storage", () => {
    const xssScript = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

    it("should safely store and return raw XSS payloads as literal inert text without code injection", async () => {
      const task = await createLearningTask(testUser.id, {
        title: "XSS Defense Check",
        description: xssScript,
        plannedDate: "2026-09-11",
      });

      const retrieved = await getTaskByIdForUser(testUser.id, task.id);
      expect(retrieved?.description).toBe(xssScript); // Safely stored literally without execution
    });

    it("should enforce maximum string length limits to prevent denial-of-service / memory bloat", () => {
      // Title max 120 chars
      const hugeTitle = "A".repeat(121);
      const titleRes = CreateTaskSchema.safeParse({
        title: hugeTitle,
        plannedDate: "2026-09-11",
      });
      expect(titleRes.success).toBe(false);

      // Reflection max 5000 chars
      const hugeReflection = "B".repeat(5001);
      const logRes = CreateLearningLogSchema.safeParse({
        taskId: "cju0000000000000000000000",
        sessionId: "cju0000000000000000000001",
        whatLearned: hugeReflection,
        confidence: 4,
      });
      expect(logRes.success).toBe(false);

      // Focus duration max 7200s (2h)
      const hugeDuration = CompleteSessionSchema.safeParse({
        sessionId: "cju0000000000000000000001",
        actualDuration: 100000,
      });
      expect(hugeDuration.success).toBe(false);

      // Revision confidence must be 1 to 5
      const invalidConfidence = CompleteRevisionSchema.safeParse({
        revisionId: "cju0000000000000000000001",
        confidence: 10,
      });
      expect(invalidConfidence.success).toBe(false);
    });
  });
});
