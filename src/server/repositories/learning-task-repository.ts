import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/date-utils";
import type {
  LearningTask,
  Category,
  Priority,
  TaskStatus,
  TaskWithCategory,
  TaskWithDetails,
} from "@/types";

export type { TaskWithCategory, TaskWithDetails };

export interface DailyTaskSummary {
  totalTasks: number;
  plannedSessions: number;
  completedSessions: number;
  totalFocusMinutes: number;
  tasks: TaskWithCategory[];
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  plannedDate: string;
  priority?: Priority;
  estimatedSessions?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  plannedDate?: string;
  priority?: Priority;
  estimatedSessions?: number;
  status?: TaskStatus;
}

/**
 * Retrieves all learning tasks planned for a specific calendar date, scoped strictly to the user.
 */
export async function getTasksForDate(
  userId: string,
  dateStr: string
): Promise<TaskWithCategory[]> {
  const date = parseISODate(dateStr);

  return prisma.learningTask.findMany({
    where: {
      userId,
      plannedDate: date,
    },
    include: {
      category: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Retrieves a single learning task by ID, strictly verifying ownership.
 */
export async function getTaskById(
  userId: string,
  taskId: string
): Promise<TaskWithCategory | null> {
  return prisma.learningTask.findFirst({
    where: {
      id: taskId,
      userId,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Retrieves full task details including focus sessions, learning logs, and revisions,
 * strictly verifying ownership.
 */
export async function getTaskDetailsById(
  userId: string,
  taskId: string
): Promise<TaskWithDetails | null> {
  return prisma.learningTask.findFirst({
    where: {
      id: taskId,
      userId,
    },
    include: {
      category: true,
      focusSessions: {
        orderBy: { startedAt: "desc" },
      },
      learningLogs: {
        orderBy: { createdAt: "desc" },
      },
      revisions: {
        orderBy: { revisionNumber: "asc" },
      },
    },
  }) as Promise<TaskWithDetails | null>;
}

/**
 * Creates a new learning task for the user, verifying category ownership if provided.
 */
export async function createLearningTask(
  userId: string,
  input: CreateTaskData
): Promise<TaskWithCategory> {
  let verifiedCategoryId: string | null = null;

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Specified category not found or access denied.");
    }
    verifiedCategoryId = category.id;
  }

  const plannedDate = parseISODate(input.plannedDate);

  return prisma.learningTask.create({
    data: {
      userId,
      categoryId: verifiedCategoryId,
      title: input.title,
      description: input.description?.trim() ? input.description.trim() : null,
      plannedDate,
      priority: input.priority ?? "MEDIUM",
      estimatedSessions: input.estimatedSessions ?? 2,
      status: "PLANNED",
    },
    include: {
      category: true,
    },
  });
}

/**
 * Updates a learning task, strictly verifying ownership, category authorization,
 * and valid status transitions.
 */
export async function updateLearningTask(
  userId: string,
  taskId: string,
  input: UpdateTaskData
): Promise<TaskWithCategory> {
  const existing = await prisma.learningTask.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Learning task not found or access denied.");
  }

  // Business invariant: Prevent rescheduling if learning is completed
  if (
    input.plannedDate &&
    (existing.status === "LEARNING_COMPLETED" ||
      existing.status === "REVISION_PENDING" ||
      existing.status === "FULLY_COMPLETED")
  ) {
    throw new Error(
      "Cannot change planned date for a topic that has already completed initial learning."
    );
  }

  // Status transition validation
  if (input.status !== undefined && input.status !== existing.status) {
    if (
      existing.status === "REVISION_PENDING" ||
      existing.status === "FULLY_COMPLETED"
    ) {
      throw new Error(
        "Cannot manually change the status of a topic that is in revision progression or fully mastered."
      );
    }

    if (input.status === "FULLY_COMPLETED") {
      throw new Error(
        "Cannot directly mark topic as fully completed. Requires completing all 4 revisions."
      );
    }
  }

  let verifiedCategoryId = existing.categoryId;
  if (input.categoryId !== undefined) {
    if (input.categoryId === null) {
      verifiedCategoryId = null;
    } else {
      const category = await prisma.category.findFirst({
        where: {
          id: input.categoryId,
          userId,
        },
      });
      if (!category) {
        throw new Error("Specified category not found or access denied.");
      }
      verifiedCategoryId = category.id;
    }
  }

  return prisma.learningTask.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description:
        input.description !== undefined
          ? input.description && input.description.trim()
            ? input.description.trim()
            : null
          : undefined,
      categoryId: verifiedCategoryId,
      plannedDate: input.plannedDate ? parseISODate(input.plannedDate) : undefined,
      priority: input.priority,
      estimatedSessions: input.estimatedSessions,
      status: input.status,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Updates a learning task status between PLANNED and IN_PROGRESS, strictly verifying ownership.
 */
export async function updateTaskStatus(
  userId: string,
  taskId: string,
  nextStatus: "PLANNED" | "IN_PROGRESS"
): Promise<TaskWithCategory> {
  return updateLearningTask(userId, taskId, { status: nextStatus });
}

/**
 * Deletes a learning task, strictly verifying ownership.
 */
export async function deleteLearningTask(
  userId: string,
  taskId: string
): Promise<{ id: string }> {
  const existing = await prisma.learningTask.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Learning task not found or access denied.");
  }

  await prisma.learningTask.delete({
    where: { id: taskId },
  });

  return { id: taskId };
}

// Aliases matching domain specification conventions
export const getTaskByIdForUser = getTaskById;
export const getTaskDetailsByIdForUser = getTaskDetailsById;
export const updateTaskForUser = updateLearningTask;
export const deleteTaskForUser = deleteLearningTask;
export const updateTaskStatusForUser = updateTaskStatus;

/**
 * Aggregates task metrics for a specific date (typically today) for dashboard summary.
 */
export async function getDailyTaskSummary(
  userId: string,
  dateStr: string
): Promise<DailyTaskSummary> {
  const tasks = await getTasksForDate(userId, dateStr);

  const plannedSessions = tasks.reduce((sum, t) => sum + t.estimatedSessions, 0);
  const completedSessions = tasks.reduce((sum, t) => sum + t.completedSessions, 0);
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + t.totalFocusMinutes, 0);

  return {
    totalTasks: tasks.length,
    plannedSessions,
    completedSessions,
    totalFocusMinutes,
    tasks,
  };
}
