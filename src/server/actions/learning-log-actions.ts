"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, UnauthorizedError } from "@/lib/session";
import {
  CreateLearningLogSchema,
  UpdateLearningLogSchema,
  type CreateLearningLogInput,
  type UpdateLearningLogInput,
} from "@/server/validators/learning-log";
import {
  createLearningLog,
  updateLearningLogForUser,
  getLearningLogByIdForUser,
  getLearningLogForFocusSession,
  getCompletedSessionsWithoutLogs,
  type LearningLogWithRelations,
} from "@/server/repositories/learning-log-repository";
import type { ActionResult } from "@/types";

export async function createLearningLogAction(
  rawInput: CreateLearningLogInput
): Promise<ActionResult<LearningLogWithRelations>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CreateLearningLogSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the reflection form errors.",
          details: fieldErrors,
        },
      };
    }

    const log = await createLearningLog(userId, parseResult.data);

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/focus");
    revalidatePath(`/tasks/${log.learningTaskId}`);
    revalidatePath(`/learning-logs/${log.id}`);

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    const message = error instanceof Error ? error.message : "Failed to record learning log.";
    const code = message.includes("already exists")
      ? "CONFLICT_ERROR"
      : message.includes("not found")
      ? "NOT_FOUND"
      : "INTERNAL_ERROR";

    return {
      success: false,
      error: { code, message },
    };
  }
}

export async function updateLearningLogAction(
  rawInput: UpdateLearningLogInput
): Promise<ActionResult<LearningLogWithRelations>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = UpdateLearningLogSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid learning log update payload.",
        },
      };
    }

    const { id, ...data } = parseResult.data;
    const updated = await updateLearningLogForUser(userId, id, data);

    revalidatePath(`/tasks/${updated.learningTaskId}`);
    revalidatePath(`/learning-logs/${updated.id}`);

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    const message = error instanceof Error ? error.message : "Failed to update learning log.";
    return {
      success: false,
      error: {
        code: message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
    };
  }
}

export async function getLearningLogByIdAction(
  logId: string
): Promise<ActionResult<LearningLogWithRelations | null>> {
  try {
    const { userId } = await requireAuth();
    const log = await getLearningLogByIdForUser(userId, logId);

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to retrieve learning log.",
      },
    };
  }
}

export async function getLearningLogForSessionAction(
  sessionId: string
): Promise<ActionResult<LearningLogWithRelations | null>> {
  try {
    const { userId } = await requireAuth();
    const log = await getLearningLogForFocusSession(userId, sessionId);

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to retrieve session learning log.",
      },
    };
  }
}

export async function getCompletedSessionsWithoutLogsAction(
  taskId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof getCompletedSessionsWithoutLogs>>>> {
  try {
    const { userId } = await requireAuth();
    const sessions = await getCompletedSessionsWithoutLogs(userId, taskId);

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to retrieve eligible sessions.",
      },
    };
  }
}
