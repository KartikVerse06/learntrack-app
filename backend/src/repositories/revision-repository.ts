import { prisma } from "@/lib/db";
import { parseISODate, formatDateToISO, getTodayISO } from "@/lib/date-utils";
import {
  calculateRevisionDates,
  computeRevisionState,
  getRelativeRevisionDueLabel,
} from "@/lib/revision-date-utils";
import type {
  Revision,
  LearningTask,
  Category,
  LearningLog,
  RevisionStatus,
} from "@/types";

export type RevisionWithTask = Revision & {
  task: LearningTask & {
    category: Category | null;
  };
  dynamicStatus?: "DUE" | "OVERDUE" | "PENDING" | "COMPLETED" | "SKIPPED";
  dueLabel?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
};

export type RevisionWithDetails = Revision & {
  task: LearningTask & {
    category: Category | null;
    learningLogs: LearningLog[];
  };
  dynamicStatus?: "DUE" | "OVERDUE" | "PENDING" | "COMPLETED" | "SKIPPED";
  dueLabel?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
};

export interface RevisionMetrics {
  dueToday: number;
  overdue: number;
  totalDue: number;
  upcoming: number;
  completed: number;
  masteredTopicsCount: number;
}

/**
 * Marks a topic as learned and atomically generates the 4 revision milestones:
 * Revision 1: Day 0 (Same day, status: DUE)
 * Revision 2: Day +3 (status: PENDING)
 * Revision 3: Day +15 (status: PENDING)
 * Revision 4: Day +30 (status: PENDING)
 *
 * Idempotency: If 4 revisions already exist, returns existing records.
 */
export async function markTopicAsLearned(
  userId: string,
  taskId: string,
  userTimezone = "UTC"
): Promise<{ task: LearningTask; revisions: Revision[] }> {
  // 1. Verify task ownership
  const task = await prisma.learningTask.findUnique({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Task not found or access denied.");
  }

  // 2. Check if revisions already exist for this task (Idempotency Guard)
  const existingRevisions = await prisma.revision.findMany({
    where: { learningTaskId: taskId },
    orderBy: { revisionNumber: "asc" },
  });

  if (existingRevisions.length === 4) {
    return {
      task,
      revisions: existingRevisions as Revision[],
    };
  }

  // 3. Determine base completion calendar date in user's timezone
  const baseDateISO = getTodayISO(userTimezone);
  const milestones = calculateRevisionDates(baseDateISO);

  // 4. Atomic Transaction: Update task status to REVISION_PENDING and create 4 revisions
  const result = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.learningTask.update({
      where: { id: taskId },
      data: {
        status: "REVISION_PENDING",
        learningCompletedAt: task.learningCompletedAt ?? new Date(),
      },
    });

    // Create 4 revision records using skipDuplicates for absolute safety with composite unique index
    await tx.revision.createMany({
      data: milestones.map((m) => ({
        userId,
        learningTaskId: taskId,
        revisionNumber: m.revisionNumber,
        scheduledDate: parseISODate(m.scheduledDate),
        status: m.revisionNumber === 1 ? ("DUE" as RevisionStatus) : ("PENDING" as RevisionStatus),
      })),
      skipDuplicates: true,
    });

    const revisions = await tx.revision.findMany({
      where: { learningTaskId: taskId },
      orderBy: { revisionNumber: "asc" },
    });

    return {
      task: updatedTask as LearningTask,
      revisions: revisions as Revision[],
    };
  });

  return result;
}

export interface CompleteRevisionData {
  notes?: string | null;
  confidence: number;
}

/**
 * Completes a spaced revision record and evaluates the Full Topic Mastery rule:
 * Topic transitions to FULLY_COMPLETED if and only if all 4 revisions are COMPLETED.
 */
export async function completeRevision(
  userId: string,
  revisionId: string,
  data: CompleteRevisionData
): Promise<{ revision: Revision; isTopicMastered: boolean }> {
  // 1. Find revision and verify ownership
  const targetRevision = await prisma.revision.findUnique({
    where: { id: revisionId, userId },
    include: { task: true },
  });

  if (!targetRevision) {
    throw new Error("Revision not found or access denied.");
  }

  // Idempotency: If already completed, return existing status
  if (targetRevision.status === "COMPLETED") {
    const allRevisions = await prisma.revision.findMany({
      where: { learningTaskId: targetRevision.learningTaskId },
    });
    const isMastered =
      allRevisions.length === 4 &&
      allRevisions.every((r) => r.status === "COMPLETED");
    return {
      revision: targetRevision as Revision,
      isTopicMastered: isMastered,
    };
  }

  // 2. Execute Atomic Transaction: Update revision and evaluate mastery
  const result = await prisma.$transaction(async (tx) => {
    const updatedRevision = await tx.revision.update({
      where: { id: revisionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes: data.notes ?? null,
        confidence: data.confidence,
      },
    });

    // 3. Evaluate Full Topic Mastery Rule:
    // Exactly 4 revisions exist for the task and all 4 revisions (1, 2, 3, 4) are COMPLETED
    const taskRevisions = await tx.revision.findMany({
      where: { learningTaskId: targetRevision.learningTaskId },
      select: { revisionNumber: true, status: true },
    });

    const isTopicMastered =
      taskRevisions.length === 4 &&
      [1, 2, 3, 4].every(
        (num) =>
          taskRevisions.find((r) => r.revisionNumber === num)?.status === "COMPLETED"
      );

    if (isTopicMastered) {
      await tx.learningTask.update({
        where: { id: targetRevision.learningTaskId },
        data: {
          status: "FULLY_COMPLETED",
          fullyCompletedAt: new Date(),
        },
      });
    }

    return {
      revision: updatedRevision as Revision,
      isTopicMastered,
    };
  });

  return result;
}

/**
 * Retrieves revisions for a user with relative status calculations and optional filters.
 */
export async function getRevisionsForUser(
  userId: string,
  filter: "due" | "upcoming" | "completed" | "all" = "due",
  todayISO = getTodayISO(),
  categoryId?: string
): Promise<RevisionWithTask[]> {
  const whereClause: {
    userId: string;
    task?: { categoryId?: string };
  } = { userId };

  if (categoryId) {
    whereClause.task = { categoryId };
  }

  const revisions = await prisma.revision.findMany({
    where: whereClause,
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: [
      { scheduledDate: "asc" },
      { revisionNumber: "asc" },
    ],
  });

  // Augment with dynamic status and relative due labels
  const augmented: RevisionWithTask[] = revisions.map((r) => {
    const schedISO = formatDateToISO(r.scheduledDate);
    const dynamicStatus = computeRevisionState(schedISO, todayISO, r.status);
    const relative = getRelativeRevisionDueLabel(schedISO, todayISO);

    return {
      ...(r as Revision),
      task: r.task as LearningTask & { category: Category | null },
      dynamicStatus,
      dueLabel: relative.label,
      isOverdue: relative.isOverdue && r.status !== "COMPLETED",
      isDueToday: relative.isDueToday && r.status !== "COMPLETED",
    };
  });

  // Apply tab filter
  if (filter === "due") {
    // Due today or overdue, and not completed
    return augmented
      .filter((r) => (r.dynamicStatus === "DUE" || r.dynamicStatus === "OVERDUE") && r.status !== "COMPLETED")
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  if (filter === "upcoming") {
    // Scheduled for future dates and not completed
    return augmented
      .filter((r) => r.dynamicStatus === "PENDING" && r.status !== "COMPLETED")
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  if (filter === "completed") {
    return augmented
      .filter((r) => r.status === "COMPLETED")
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  }

  return augmented;
}

/**
 * Retrieves the 4 revision milestones for a specific task.
 */
export async function getRevisionsForTask(
  userId: string,
  taskId: string,
  todayISO = getTodayISO()
): Promise<RevisionWithTask[]> {
  const task = await prisma.learningTask.findUnique({
    where: { id: taskId, userId },
    include: { category: true },
  });

  if (!task) {
    return [];
  }

  const revisions = await prisma.revision.findMany({
    where: { learningTaskId: taskId, userId },
    orderBy: { revisionNumber: "asc" },
  });

  return revisions.map((r) => {
    const schedISO = formatDateToISO(r.scheduledDate);
    const dynamicStatus = computeRevisionState(schedISO, todayISO, r.status);
    const relative = getRelativeRevisionDueLabel(schedISO, todayISO);

    return {
      ...(r as Revision),
      task: task as LearningTask & { category: Category | null },
      dynamicStatus,
      dueLabel: relative.label,
      isOverdue: relative.isOverdue && r.status !== "COMPLETED",
      isDueToday: relative.isDueToday && r.status !== "COMPLETED",
    };
  });
}

/**
 * Retrieves a single revision with full details for the Active Recall Drawer,
 * including previous learning logs and doubts.
 */
export async function getRevisionByIdForUser(
  userId: string,
  revisionId: string,
  todayISO = getTodayISO()
): Promise<RevisionWithDetails | null> {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId, userId },
    include: {
      task: {
        include: {
          category: true,
          learningLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!revision) {
    return null;
  }

  const schedISO = formatDateToISO(revision.scheduledDate);
  const dynamicStatus = computeRevisionState(schedISO, todayISO, revision.status);
  const relative = getRelativeRevisionDueLabel(schedISO, todayISO);

  return {
    ...(revision as Revision),
    task: revision.task as LearningTask & {
      category: Category | null;
      learningLogs: LearningLog[];
    },
    dynamicStatus,
    dueLabel: relative.label,
    isOverdue: relative.isOverdue && revision.status !== "COMPLETED",
    isDueToday: relative.isDueToday && revision.status !== "COMPLETED",
  };
}

/**
 * Retrieves aggregated metrics for dashboard & badges.
 */
export async function getRevisionMetrics(
  userId: string,
  todayISO = getTodayISO()
): Promise<RevisionMetrics> {
  const revisions = await prisma.revision.findMany({
    where: { userId },
    select: {
      scheduledDate: true,
      status: true,
    },
  });

  let dueToday = 0;
  let overdue = 0;
  let upcoming = 0;
  let completed = 0;

  for (const r of revisions) {
    if (r.status === "COMPLETED") {
      completed++;
      continue;
    }
    if (r.status === "SKIPPED") {
      continue;
    }

    const schedISO = formatDateToISO(r.scheduledDate);
    if (schedISO < todayISO) {
      overdue++;
    } else if (schedISO === todayISO) {
      dueToday++;
    } else {
      upcoming++;
    }
  }

  const masteredTopicsCount = await prisma.learningTask.count({
    where: { userId, status: "FULLY_COMPLETED" },
  });

  return {
    dueToday,
    overdue,
    totalDue: dueToday + overdue,
    upcoming,
    completed,
    masteredTopicsCount,
  };
}
