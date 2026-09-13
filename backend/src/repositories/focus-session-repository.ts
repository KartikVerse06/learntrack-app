import { prisma } from "@/lib/db";
import type { FocusSession, LearningTask, Category } from "@/types";

export const DEFAULT_FOCUS_DURATION_SECONDS = 2700;

export function getPlannedDuration(): number {
  if (process.env.FOCUS_TEST_MODE === "true") {
    const parsed = parseInt(process.env.FOCUS_TEST_DURATION || "10", 10);
    return isNaN(parsed) ? 10 : parsed;
  }
  return DEFAULT_FOCUS_DURATION_SECONDS;
}

export type FocusSessionWithTask = FocusSession & {
  task: LearningTask & {
    category: Category | null;
  };
};

/**
 * Retrieves any currently running or paused focus session for the user.
 * Strictly guarantees that a user can only have one active session.
 */
export async function getActiveFocusSession(
  userId: string
): Promise<FocusSessionWithTask | null> {
  const session = await prisma.focusSession.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  return (session as unknown as FocusSessionWithTask) ?? null;
}

/**
 * Retrieves a focus session by ID, strictly enforcing user tenant isolation.
 */
export async function getFocusSessionById(
  userId: string,
  sessionId: string
): Promise<FocusSessionWithTask | null> {
  const session = await prisma.focusSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  return (session as unknown as FocusSessionWithTask) ?? null;
}

/**
 * Initiates a new 45-minute focus session for a given learning task.
 * Enforces:
 * 1. User must own the task.
 * 2. Task must not be FULLY_COMPLETED.
 * 3. User cannot have another ACTIVE or PAUSED session running.
 * 4. Advances task status to IN_PROGRESS if currently PLANNED.
 */
export async function createFocusSession(
  userId: string,
  taskId: string
): Promise<FocusSessionWithTask> {
  // 1. Verify task ownership
  const task = await prisma.learningTask.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!task) {
    throw new Error("Learning task not found or access denied.");
  }

  if (task.status === "FULLY_COMPLETED") {
    throw new Error("Cannot start focus on a fully completed task.");
  }

  // 2. Check for active/paused session conflict
  const existingActive = await prisma.focusSession.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });

  if (existingActive) {
    throw new Error("An active focus session is already running.");
  }

  const plannedDuration = getPlannedDuration();

  // 3. Create session & transition task if PLANNED in a transaction
  return await prisma.$transaction(async (tx) => {
    if (task.status === "PLANNED") {
      await tx.learningTask.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });
    }

    const session = await tx.focusSession.create({
      data: {
        userId,
        learningTaskId: taskId,
        status: "ACTIVE",
        startedAt: new Date(),
        plannedDuration,
        actualDuration: 0,
        pausedDuration: 0,
      },
      include: {
        task: {
          include: {
            category: true,
          },
        },
      },
    });

    return session as unknown as FocusSessionWithTask;
  });
}

/**
 * Pauses an active focus session.
 * Idempotent: returns session directly if already PAUSED.
 */
export async function pauseFocusSession(
  userId: string,
  sessionId: string
): Promise<FocusSessionWithTask> {
  const session = await prisma.focusSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Focus session not found or access denied.");
  }

  if (session.status === "PAUSED") {
    return session as unknown as FocusSessionWithTask;
  }

  if (session.status !== "ACTIVE") {
    throw new Error(`Cannot pause session with status ${session.status}.`);
  }

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      status: "PAUSED",
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  return updated as unknown as FocusSessionWithTask;
}

/**
 * Resumes a paused focus session and accumulates paused duration.
 * Idempotent: returns session directly if already ACTIVE.
 */
export async function resumeFocusSession(
  userId: string,
  sessionId: string
): Promise<FocusSessionWithTask> {
  const session = await prisma.focusSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Focus session not found or access denied.");
  }

  if (session.status === "ACTIVE") {
    return session as unknown as FocusSessionWithTask;
  }

  if (session.status !== "PAUSED") {
    throw new Error(`Cannot resume session with status ${session.status}.`);
  }

  // Calculate elapsed time since the session was marked PAUSED (recorded in updatedAt)
  const pausedDeltaSeconds = Math.max(
    0,
    Math.floor((Date.now() - session.updatedAt.getTime()) / 1000)
  );

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      status: "ACTIVE",
      pausedDuration: session.pausedDuration + pausedDeltaSeconds,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  return updated as unknown as FocusSessionWithTask;
}

/**
 * Marks a focus session as COMPLETED and increments the parent task metrics.
 * Idempotent: returns session directly if already COMPLETED.
 */
export async function completeFocusSession(
  userId: string,
  sessionId: string,
  actualDuration: number = DEFAULT_FOCUS_DURATION_SECONDS
): Promise<FocusSessionWithTask> {
  const session = await prisma.focusSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Focus session not found or access denied.");
  }

  if (session.status === "COMPLETED") {
    return session as unknown as FocusSessionWithTask;
  }

  if (session.status !== "ACTIVE" && session.status !== "PAUSED") {
    throw new Error(`Cannot complete session with status ${session.status}.`);
  }

  const minutesToAdd = Math.round(actualDuration / 60);

  return await prisma.$transaction(async (tx) => {
    // 1. Update session status
    const updated = await tx.focusSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        actualDuration,
      },
      include: {
        task: {
          include: {
            category: true,
          },
        },
      },
    });

    // 2. Increment task completedSessions and totalFocusMinutes
    await tx.learningTask.update({
      where: { id: session.learningTaskId },
      data: {
        completedSessions: { increment: 1 },
        totalFocusMinutes: { increment: minutesToAdd },
      },
    });

    return updated as unknown as FocusSessionWithTask;
  });
}

/**
 * Cancels a focus session without incrementing task statistics.
 * Idempotent: returns session directly if already CANCELLED.
 */
export async function cancelFocusSession(
  userId: string,
  sessionId: string
): Promise<FocusSessionWithTask> {
  const session = await prisma.focusSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Focus session not found or access denied.");
  }

  if (session.status === "CANCELLED") {
    return session as unknown as FocusSessionWithTask;
  }

  if (session.status !== "ACTIVE" && session.status !== "PAUSED") {
    throw new Error(`Cannot cancel session with status ${session.status}.`);
  }

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      status: "CANCELLED",
      endedAt: new Date(),
    },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
  });

  return updated as unknown as FocusSessionWithTask;
}

/**
 * Retrieves recent completed or past focus sessions for history view.
 */
export async function getRecentFocusSessionsForUser(
  userId: string,
  limit = 10
): Promise<FocusSessionWithTask[]> {
  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return sessions as unknown as FocusSessionWithTask[];
}

export const getFocusSessionByIdForUser = getFocusSessionById;

