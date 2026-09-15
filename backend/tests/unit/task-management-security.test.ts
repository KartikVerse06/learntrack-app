import { describe, it, expect, beforeEach } from "vitest";
import {
  createLearningTask,
  getTaskById,
  getTaskDetailsById,
  updateLearningTask,
  updateTaskStatus,
  deleteLearningTask,
  getTaskByIdForUser,
  getTaskDetailsByIdForUser,
  updateTaskForUser,
  deleteTaskForUser,
  updateTaskStatusForUser,
} from "@/repositories/learning-task-repository";
import { createCategory } from "@/repositories/category-repository";
import { createUser, hashPassword } from "@/repositories/user-repository";
import { prisma } from "@/lib/db";

describe("Phase 5: Task Management & Zero-Trust Security", () => {
  let userAId: string;
  let userBId: string;
  let categoryAId: string;
  let categoryBId: string;
  let taskAId: string;
  let taskBId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("SecurePass123!");

    // Create User A and User B
    const userA = await createUser({
      name: "Tenant Alpha",
      email: `alpha_mgmt_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Tenant Beta",
      email: `beta_mgmt_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    // Create categories for each user
    const catA = await createCategory(userAId, `ComputerScience_${timestamp}`, "#2563EB");
    categoryAId = catA.id;

    const catB = await createCategory(userBId, `Literature_${timestamp}`, "#10B981");
    categoryBId = catB.id;

    // Create tasks for each user
    const taskA = await createLearningTask(userAId, {
      title: "Distributed Consensus Raft",
      description: "Understand leader election, log replication, and commit index safety.",
      categoryId: categoryAId,
      plannedDate: "2026-09-18",
      priority: "HIGH",
      estimatedSessions: 3,
    });
    taskAId = taskA.id;

    const taskB = await createLearningTask(userBId, {
      title: "Shakespeare Sonnets Analysis",
      description: "Iambic pentameter and thematic volta analysis.",
      categoryId: categoryBId,
      plannedDate: "2026-09-18",
      priority: "LOW",
      estimatedSessions: 2,
    });
    taskBId = taskB.id;
  });

  describe("Task Detail Retrieval & Tenant Isolation", () => {
    it("should retrieve full task details for the owner including relationships", async () => {
      const details = await getTaskDetailsById(userAId, taskAId);

      expect(details).not.toBeNull();
      expect(details?.id).toBe(taskAId);
      expect(details?.userId).toBe(userAId);
      expect(details?.title).toBe("Distributed Consensus Raft");
      expect(details?.category?.id).toBe(categoryAId);
      expect(details?.category?.name).toContain("ComputerScience");
      expect(Array.isArray(details?.focusSessions)).toBe(true);
      expect(Array.isArray(details?.learningLogs)).toBe(true);
      expect(Array.isArray(details?.revisions)).toBe(true);
    });

    it("should prevent User A from reading User B's task details", async () => {
      const crossRead = await getTaskDetailsById(userAId, taskBId);
      expect(crossRead).toBeNull();
    });

    it("should handle non-existent task IDs safely", async () => {
      const notFound = await getTaskDetailsById(userAId, "cm00000000000000000000000");
      expect(notFound).toBeNull();
    });

    it("should verify getTaskDetailsByIdForUser alias works identically", async () => {
      const details = await getTaskDetailsByIdForUser(userAId, taskAId);
      expect(details?.id).toBe(taskAId);
    });
  });

  describe("Task Editing & Tenant Authorization", () => {
    it("should allow owner to update title, description, priority, and date", async () => {
      const updated = await updateLearningTask(userAId, taskAId, {
        title: "Raft Consensus & Log Invariants",
        description: "Updated notes on leader leases and term checks.",
        priority: "MEDIUM",
        estimatedSessions: 4,
      });

      expect(updated.title).toBe("Raft Consensus & Log Invariants");
      expect(updated.priority).toBe("MEDIUM");
      expect(updated.estimatedSessions).toBe(4);
    });

    it("should prevent User A from updating User B's task", async () => {
      await expect(
        updateLearningTask(userAId, taskBId, {
          title: "Malicious Cross-Tenant Overwrite",
        })
      ).rejects.toThrow("Learning task not found or access denied.");

      // Verify User B's task was unaffected
      const taskB = await getTaskById(userBId, taskBId);
      expect(taskB?.title).toBe("Shakespeare Sonnets Analysis");
    });

    it("should allow owner to clear task category with null", async () => {
      const updated = await updateLearningTask(userAId, taskAId, {
        categoryId: null,
      });

      expect(updated.categoryId).toBeNull();
      expect(updated.category).toBeNull();
    });

    it("should reject User A attempting to assign User B's category", async () => {
      await expect(
        updateLearningTask(userAId, taskAId, {
          categoryId: categoryBId,
        })
      ).rejects.toThrow("Specified category not found or access denied.");
    });
  });

  describe("Task Status Management & Invariants", () => {
    it("should allow owner to toggle status between PLANNED and IN_PROGRESS", async () => {
      // PLANNED -> IN_PROGRESS
      const inProgress = await updateTaskStatus(userAId, taskAId, "IN_PROGRESS");
      expect(inProgress.status).toBe("IN_PROGRESS");

      // IN_PROGRESS -> PLANNED
      const planned = await updateTaskStatus(userAId, taskAId, "PLANNED");
      expect(planned.status).toBe("PLANNED");
    });

    it("should prevent User A from changing User B's task status", async () => {
      await expect(
        updateTaskStatus(userAId, taskBId, "IN_PROGRESS")
      ).rejects.toThrow("Learning task not found or access denied.");

      // Ensure User B's status remains PLANNED
      const taskB = await getTaskById(userBId, taskBId);
      expect(taskB?.status).toBe("PLANNED");
    });

    it("should reject manually setting status to FULLY_COMPLETED", async () => {
      await expect(
        updateLearningTask(userAId, taskAId, {
          status: "FULLY_COMPLETED" as any,
        })
      ).rejects.toThrow("Cannot directly mark topic as fully completed.");
    });

    it("should reject rolling back a task that is in REVISION_PENDING or FULLY_COMPLETED", async () => {
      // Simulate task advancing to REVISION_PENDING via database workflow
      await prisma.learningTask.update({
        where: { id: taskAId },
        data: {
          status: "REVISION_PENDING",
          learningCompletedAt: new Date(),
        },
      });

      // Attempting to manually reset status back to PLANNED or IN_PROGRESS must fail
      await expect(
        updateTaskStatus(userAId, taskAId, "PLANNED")
      ).rejects.toThrow("Cannot manually change the status of a topic that is in revision progression");
    });
  });

  describe("Task Deletion & Tenant Authorization", () => {
    it("should allow owner to delete their task", async () => {
      const result = await deleteLearningTask(userAId, taskAId);
      expect(result.id).toBe(taskAId);

      const verifyDeleted = await getTaskById(userAId, taskAId);
      expect(verifyDeleted).toBeNull();
    });

    it("should prevent User A from deleting User B's task", async () => {
      await expect(
        deleteLearningTask(userAId, taskBId)
      ).rejects.toThrow("Learning task not found or access denied.");

      // Verify User B's task remains intact
      const taskB = await getTaskById(userBId, taskBId);
      expect(taskB).not.toBeNull();
      expect(taskB?.id).toBe(taskBId);
    });

    it("should verify deleteTaskForUser alias works as expected", async () => {
      const result = await deleteTaskForUser(userBId, taskBId);
      expect(result.id).toBe(taskBId);
    });
  });
});
