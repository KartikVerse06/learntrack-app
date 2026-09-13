import { prisma } from "@/lib/db";
import type { LearningLog, LearningTask, Category, FocusSession } from "@/types";

export type LearningLogWithRelations = LearningLog & {
  task: LearningTask & {
    category: Category | null;
  };
  focusSession: FocusSession;
};

export interface CreateLearningLogData {
  taskId: string;
  sessionId: string;
  whatLearned: string;
  whatCompleted?: string | null;
  doubts?: string | null;
  notes?: string | null;
  confidence: number;
}

export interface UpdateLearningLogData {
  whatLearned?: string;
  whatCompleted?: string | null;
  doubts?: string | null;
  notes?: string | null;
  confidence?: number;
}

/**
 * Creates a reflective LearningLog for a completed focus session.
 * Strictly enforces:
 * 1. User must own the task.
 * 2. User must own the focus session.
 * 3. Session must belong to the specified task.
 * 4. Session status must be COMPLETED.
 * 5. 1:1 constraint: No duplicate log can exist for the session.
 * 6. Phase 7 boundary: Must NOT create revisions or mark task as FULLY_COMPLETED.
 */
export async function createLearningLog(
  userId: string,
  data: CreateLearningLogData
): Promise<LearningLogWithRelations> {
  // 1. Verify task ownership
  const task = await prisma.learningTask.findFirst({
    where: {
      id: data.taskId,
      userId,
    },
  });

  if (!task) {
    throw new Error("Learning task not found or access denied.");
  }

  // 2. Verify focus session ownership & relationship
  const session = await prisma.focusSession.findFirst({
    where: {
      id: data.sessionId,
      userId,
    },
  });

  if (!session) {
    throw new Error("Focus session not found or access denied.");
  }

  if (session.learningTaskId !== data.taskId) {
    throw new Error("Focus session does not belong to the specified learning task.");
  }

  if (session.status !== "COMPLETED") {
    throw new Error("Focus session must be completed before recording a learning log.");
  }

  // 3. Prevent duplicate log for the same focus session
  const existingLog = await prisma.learningLog.findUnique({
    where: {
      focusSessionId: data.sessionId,
    },
  });

  if (existingLog) {
    throw new Error("A learning log already exists for this focus session.");
  }

  // 4. Create LearningLog record
  const log = await prisma.learningLog.create({
    data: {
      userId,
      learningTaskId: data.taskId,
      focusSessionId: data.sessionId,
      whatLearned: data.whatLearned,
      whatCompleted: data.whatCompleted || null,
      doubts: data.doubts || null,
      notes: data.notes || null,
      confidence: data.confidence,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
      focusSession: true,
    },
  });

  return log as unknown as LearningLogWithRelations;
}

/**
 * Retrieves a LearningLog by ID, verifying tenant isolation.
 */
export async function getLearningLogByIdForUser(
  userId: string,
  logId: string
): Promise<LearningLogWithRelations | null> {
  const log = await prisma.learningLog.findFirst({
    where: {
      id: logId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
      focusSession: true,
    },
  });

  return (log as unknown as LearningLogWithRelations) ?? null;
}

/**
 * Retrieves the LearningLog for a specific focus session.
 */
export async function getLearningLogForFocusSession(
  userId: string,
  sessionId: string
): Promise<LearningLogWithRelations | null> {
  const log = await prisma.learningLog.findFirst({
    where: {
      focusSessionId: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
      focusSession: true,
    },
  });

  return (log as unknown as LearningLogWithRelations) ?? null;
}

/**
 * Updates an existing LearningLog, verifying tenant ownership.
 */
export async function updateLearningLogForUser(
  userId: string,
  logId: string,
  data: UpdateLearningLogData
): Promise<LearningLogWithRelations> {
  const existing = await prisma.learningLog.findFirst({
    where: {
      id: logId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Learning log not found or access denied.");
  }

  const updated = await prisma.learningLog.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.whatLearned !== undefined && { whatLearned: data.whatLearned }),
      ...(data.whatCompleted !== undefined && { whatCompleted: data.whatCompleted || null }),
      ...(data.doubts !== undefined && { doubts: data.doubts || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.confidence !== undefined && { confidence: data.confidence }),
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
      focusSession: true,
    },
  });

  return updated as unknown as LearningLogWithRelations;
}

/**
 * Retrieves recent learning logs for the user.
 */
export async function getRecentLearningLogsForUser(
  userId: string,
  limit = 10
): Promise<LearningLogWithRelations[]> {
  const logs = await prisma.learningLog.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          category: true,
        },
      },
      focusSession: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs as unknown as LearningLogWithRelations[];
}

/**
 * Retrieves completed focus sessions for the user that do not yet have a learning log.
 */
export async function getCompletedSessionsWithoutLogs(
  userId: string,
  taskId?: string
): Promise<(FocusSession & { task: LearningTask & { category: Category | null } })[]> {
  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      learningLog: null,
      ...(taskId && { learningTaskId: taskId }),
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { endedAt: "desc" },
  });

  return sessions as unknown as (FocusSession & { task: LearningTask & { category: Category | null } })[];
}
