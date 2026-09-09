import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/date-utils";
import type {
  LearningTask,
  Category,
  Priority,
  TaskStatus,
  TaskWithCategory,
} from "@/types";

export type { TaskWithCategory };

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
 * Updates a learning task, strictly verifying ownership and category authorization.
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
