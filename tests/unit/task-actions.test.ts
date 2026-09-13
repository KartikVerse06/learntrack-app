import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache revalidation in test environment
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let mockCurrentUserId: string | null = null;

// Mock requireAuth to point to mockCurrentUserId
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => {
    if (!mockCurrentUserId) {
      throw new Error("Authentication required.");
    }
    return { userId: mockCurrentUserId };
  }),
}));

import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  moveTaskToTomorrowAction,
  toggleTaskStatusAction,
  getTaskDetailsAction,
} from "@/server/actions/task-actions";
import { createUser, hashPassword } from "@/server/repositories/user-repository";
import { createCategory } from "@/server/repositories/category-repository";

describe("Learning Task Server Actions & Multi-Tenant Boundaries", () => {
  let userAId: string;
  let userBId: string;
  let categoryAId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Action User A",
      email: `action_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    const userB = await createUser({
      name: "Action User B",
      email: `action_b_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userBId = userB.id;

    const catA = await createCategory(userAId, `Architecture_${timestamp}`, "#2563EB");
    categoryAId = catA.id;

    mockCurrentUserId = userAId;
  });

  it("should create a learning task successfully for authenticated user", async () => {
    const result = await createTaskAction({
      title: "Clean Architecture Principles",
      description: "Separation of concerns, entity boundaries, and use-case interactors.",
      categoryId: categoryAId,
      plannedDate: "2026-09-10",
      priority: "HIGH",
      estimatedSessions: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBeDefined();
      expect(result.data.title).toBe("Clean Architecture Principles");
      expect(result.data.userId).toBe(userAId);
      expect(result.data.priority).toBe("HIGH");
      expect(result.data.estimatedSessions).toBe(3);
      expect(result.data.status).toBe("PLANNED");
      expect(result.data.category?.id).toBe(categoryAId);
    }
  });

  it("should reject creation with validation errors for invalid input", async () => {
    // Title too short
    const shortTitle = await createTaskAction({
      title: "AB",
      plannedDate: "2026-09-10",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    expect(shortTitle.success).toBe(false);
    if (!shortTitle.success) {
      expect(shortTitle.error.code).toBe("VALIDATION_ERROR");
      expect(shortTitle.error.details?.title).toBeDefined();
    }

    // Invalid date format
    const badDate = await createTaskAction({
      title: "Valid Title Here",
      plannedDate: "10/09/2026",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    expect(badDate.success).toBe(false);

    // Invalid session count (e.g. 0)
    const zeroSessions = await createTaskAction({
      title: "Valid Title Here",
      plannedDate: "2026-09-10",
      priority: "MEDIUM",
      estimatedSessions: 0,
    });
    expect(zeroSessions.success).toBe(false);
  });

  it("should reject attaching another user's category via server action", async () => {
    // Switch to User B
    mockCurrentUserId = userBId;

    const crossCatAttempt = await createTaskAction({
      title: "Cross-Tenant Category Attack",
      plannedDate: "2026-09-10",
      categoryId: categoryAId, // belongs to User A
      priority: "LOW",
      estimatedSessions: 1,
    });

    expect(crossCatAttempt.success).toBe(false);
    if (!crossCatAttempt.success) {
      expect(crossCatAttempt.error.message).toContain("access denied");
    }
  });

  it("should update a learning task when owned by current user", async () => {
    const created = await createTaskAction({
      title: "Initial Topic Title",
      plannedDate: "2026-09-10",
      priority: "LOW",
      estimatedSessions: 2,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const updated = await updateTaskAction({
      id: created.data.id,
      title: "Updated Refined Title",
      description: "Now with added architectural detail.",
      priority: "HIGH",
      estimatedSessions: 4,
      status: "IN_PROGRESS",
    });

    expect(updated.success).toBe(true);
    if (updated.success) {
      expect(updated.data.title).toBe("Updated Refined Title");
      expect(updated.data.description).toBe("Now with added architectural detail.");
      expect(updated.data.priority).toBe("HIGH");
      expect(updated.data.estimatedSessions).toBe(4);
      expect(updated.data.status).toBe("IN_PROGRESS");
    }
  });

  it("should prevent User B from modifying User A's task (multi-tenant barrier)", async () => {
    // Created as User A
    const created = await createTaskAction({
      title: "User A Sensitive Roadmap",
      plannedDate: "2026-09-10",
      priority: "HIGH",
      estimatedSessions: 3,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Switch to User B
    mockCurrentUserId = userBId;

    const maliciousUpdate = await updateTaskAction({
      id: created.data.id,
      title: "Tampered by User B",
    });

    expect(maliciousUpdate.success).toBe(false);
    if (!maliciousUpdate.success) {
      expect(maliciousUpdate.error.message).toContain("access denied");
    }
  });

  it("should toggle task status between PLANNED and IN_PROGRESS", async () => {
    const created = await createTaskAction({
      title: "Status Toggle Testing",
      plannedDate: "2026-09-10",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Toggle to IN_PROGRESS
    const toInProgress = await toggleTaskStatusAction({
      id: created.data.id,
      status: "IN_PROGRESS",
    });
    expect(toInProgress.success).toBe(true);
    if (toInProgress.success) {
      expect(toInProgress.data.status).toBe("IN_PROGRESS");
    }

    // Toggle back to PLANNED
    const backToPlanned = await toggleTaskStatusAction({
      id: created.data.id,
      status: "PLANNED",
    });
    expect(backToPlanned.success).toBe(true);
    if (backToPlanned.success) {
      expect(backToPlanned.data.status).toBe("PLANNED");
    }
  });

  it("should reschedule task to tomorrow cleanly", async () => {
    const created = await createTaskAction({
      title: "Reschedule Test Topic",
      plannedDate: "2026-09-10",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const rescheduled = await moveTaskToTomorrowAction(created.data.id, "2026-09-10");
    expect(rescheduled.success).toBe(true);
    if (rescheduled.success) {
      const newDateStr = new Date(rescheduled.data.plannedDate).toISOString().split("T")[0];
      expect(newDateStr).toBe("2026-09-11");
    }
  });

  it("should delete task only when requested by owner", async () => {
    const created = await createTaskAction({
      title: "Topic to be Deleted",
      plannedDate: "2026-09-10",
      priority: "LOW",
      estimatedSessions: 1,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // User B attempts to delete
    mockCurrentUserId = userBId;
    const maliciousDelete = await deleteTaskAction(created.data.id);
    expect(maliciousDelete.success).toBe(false);

    // User A deletes their own task
    mockCurrentUserId = userAId;
    const ownerDelete = await deleteTaskAction(created.data.id);
    expect(ownerDelete.success).toBe(true);
  });

  it("should retrieve full task details for owner and reject cross-tenant access via action", async () => {
    const created = await createTaskAction({
      title: "Task Details Action Test",
      plannedDate: "2026-09-10",
      priority: "HIGH",
      estimatedSessions: 2,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Owner retrieves details
    const ownerDetails = await getTaskDetailsAction(created.data.id);
    expect(ownerDetails.success).toBe(true);
    if (ownerDetails.success) {
      expect(ownerDetails.data.id).toBe(created.data.id);
      expect(ownerDetails.data.title).toBe("Task Details Action Test");
      expect(Array.isArray(ownerDetails.data.focusSessions)).toBe(true);
      expect(Array.isArray(ownerDetails.data.learningLogs)).toBe(true);
      expect(Array.isArray(ownerDetails.data.revisions)).toBe(true);
    }

    // User B attempts to retrieve User A's task details
    mockCurrentUserId = userBId;
    const crossDetails = await getTaskDetailsAction(created.data.id);
    expect(crossDetails.success).toBe(false);
    if (!crossDetails.success) {
      expect(crossDetails.error.code).toBe("NOT_FOUND");
    }

    // Invalid task ID format
    const invalidId = await getTaskDetailsAction("");
    expect(invalidId.success).toBe(false);
  });
});
