import { describe, it, expect } from "vitest";
import {
  createLearningTask,
  getTasksForDate,
  getTaskById,
  updateLearningTask,
  deleteLearningTask,
  getDailyTaskSummary,
} from "@/server/repositories/learning-task-repository";
import { createCategory } from "@/server/repositories/category-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Learning Task Repository & Multi-Tenant Isolation", () => {
  it("should create and retrieve tasks for a specific calendar date", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("ValidPass123!");
    const user = await createUser({
      name: "Planner Tester",
      email: `planner_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const category = await createCategory(user.id, `Algorithms_${timestamp}`, "#3B82F6");

    const dateTarget = "2026-09-15";

    const task = await createLearningTask(user.id, {
      title: "Dynamic Programming Knapsack",
      description: "0/1 Knapsack state transition and bottom-up DP table.",
      categoryId: category.id,
      plannedDate: dateTarget,
      priority: "HIGH",
      estimatedSessions: 3,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Dynamic Programming Knapsack");
    expect(task.priority).toBe("HIGH");
    expect(task.estimatedSessions).toBe(3);
    expect(task.category?.name).toBe(`Algorithms_${timestamp}`);

    // Retrieve for dateTarget
    const tasksForDate = await getTasksForDate(user.id, dateTarget);
    expect(tasksForDate.some((t) => t.id === task.id)).toBe(true);

    // Verify task does NOT appear on a different date
    const tasksDifferentDate = await getTasksForDate(user.id, "2026-09-16");
    expect(tasksDifferentDate.some((t) => t.id === task.id)).toBe(false);
  });

  it("should enforce tenant isolation: User A cannot read, update, or delete User B's task", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "User Alpha",
      email: `alpha_tasks_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const userB = await createUser({
      name: "User Beta",
      email: `beta_tasks_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const taskA = await createLearningTask(userA.id, {
      title: "Alpha Private Topic",
      plannedDate: "2026-09-20",
      priority: "MEDIUM",
      estimatedSessions: 2,
    });

    // User B cannot read User A's task
    const readAttempt = await getTaskById(userB.id, taskA.id);
    expect(readAttempt).toBeNull();

    // User B cannot update User A's task
    await expect(
      updateLearningTask(userB.id, taskA.id, {
        title: "Malicious Edit Attempt",
      })
    ).rejects.toThrow("not found or access denied");

    // User B cannot delete User A's task
    await expect(
      deleteLearningTask(userB.id, taskA.id)
    ).rejects.toThrow("not found or access denied");
  });

  it("should reject attaching another user's category", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Category Owner",
      email: `cat_owner_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const userB = await createUser({
      name: "Category Attacker",
      email: `cat_attacker_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const categoryA = await createCategory(userA.id, `Private Cat ${timestamp}`);

    // User B attempts to create task referencing User A's category
    await expect(
      createLearningTask(userB.id, {
        title: "Cross-Tenant Category Task",
        plannedDate: "2026-09-22",
        categoryId: categoryA.id,
        priority: "LOW",
        estimatedSessions: 1,
      })
    ).rejects.toThrow("category not found or access denied");
  });

  it("should prevent rescheduling topics whose initial learning is completed", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("ValidPass123!");

    const user = await createUser({
      name: "Completed Task Learner",
      email: `completed_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const task = await createLearningTask(user.id, {
      title: "Completed Topic",
      plannedDate: "2026-09-25",
      priority: "HIGH",
      estimatedSessions: 2,
    });

    // Mark task as LEARNING_COMPLETED
    await updateLearningTask(user.id, task.id, {
      status: "LEARNING_COMPLETED",
    });

    // Attempting to change plannedDate must be rejected
    await expect(
      updateLearningTask(user.id, task.id, {
        plannedDate: "2026-09-26",
      })
    ).rejects.toThrow("Cannot change planned date");
  });

  it("should correctly calculate daily task summary for dashboard", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("ValidPass123!");

    const user = await createUser({
      name: "Summary User",
      email: `summary_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const today = "2026-09-30";

    await createLearningTask(user.id, {
      title: "Topic One",
      plannedDate: today,
      priority: "HIGH",
      estimatedSessions: 2,
    });

    await createLearningTask(user.id, {
      title: "Topic Two",
      plannedDate: today,
      priority: "MEDIUM",
      estimatedSessions: 3,
    });

    const summary = await getDailyTaskSummary(user.id, today);
    expect(summary.totalTasks).toBe(2);
    expect(summary.plannedSessions).toBe(5);
    expect(summary.completedSessions).toBe(0);
    expect(summary.totalFocusMinutes).toBe(0);
  });
});
