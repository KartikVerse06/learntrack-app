"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, UnauthorizedError } from "@/lib/session";
import {
  MarkTopicAsLearnedSchema,
  CompleteRevisionSchema,
  GetRevisionsSchema,
  type CompleteRevisionInput,
} from "@/server/validators/revision";
import {
  markTopicAsLearned,
  completeRevision,
  getRevisionsForUser,
  getRevisionsForTask,
  getRevisionByIdForUser,
  getRevisionMetrics,
  type RevisionWithTask,
  type RevisionWithDetails,
  type RevisionMetrics,
} from "@/server/repositories/revision-repository";
import type { ActionResult, Revision, LearningTask } from "@/types";

/**
 * Server Action: Marks a topic as learned and atomically generates the 4 revision milestones.
 */
export async function markTopicAsLearnedAction(
  taskId: string
): Promise<ActionResult<{ task: LearningTask; revisions: Revision[] }>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = MarkTopicAsLearnedSchema.safeParse({ taskId });
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid task ID",
        },
      };
    }

    const result = await markTopicAsLearned(userId, parseResult.data.taskId);

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/revisions");
    revalidatePath(`/tasks/${taskId}`);

    return {
      success: true,
      data: result,
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

    const message =
      error instanceof Error ? error.message : "Failed to mark topic as learned.";
    const code = message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR";

    return {
      success: false,
      error: { code, message },
    };
  }
}

/**
 * Server Action: Completes a spaced revision record and evaluates the Full Topic Mastery invariant.
 */
export async function completeRevisionAction(
  rawInput: CompleteRevisionInput
): Promise<ActionResult<{ revision: Revision; isTopicMastered: boolean }>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CompleteRevisionSchema.safeParse(rawInput);
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
          message: "Please correct the revision review form errors.",
          details: fieldErrors,
        },
      };
    }

    const { revisionId, notes, confidence } = parseResult.data;
    const result = await completeRevision(userId, revisionId, { notes, confidence });

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/revisions");
    revalidatePath(`/tasks/${result.revision.learningTaskId}`);

    return {
      success: true,
      data: result,
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

    const message =
      error instanceof Error ? error.message : "Failed to complete revision.";
    const code = message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR";

    return {
      success: false,
      error: { code, message },
    };
  }
}

/**
 * Server Action: Retrieves filtered revisions for the authenticated user.
 */
export async function getRevisionsAction(
  filter: "due" | "upcoming" | "completed" | "all" = "due",
  categoryId?: string
): Promise<ActionResult<RevisionWithTask[]>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = GetRevisionsSchema.safeParse({ filter, categoryId });
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid revision filter criteria.",
        },
      };
    }

    const revisions = await getRevisionsForUser(
      userId,
      parseResult.data.filter,
      undefined,
      parseResult.data.categoryId
    );

    return {
      success: true,
      data: revisions,
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
        message:
          error instanceof Error ? error.message : "Failed to fetch revisions.",
      },
    };
  }
}

/**
 * Server Action: Retrieves detailed revision information for the Active Recall Drawer.
 */
export async function getRevisionDetailsAction(
  revisionId: string
): Promise<ActionResult<RevisionWithDetails>> {
  try {
    const { userId } = await requireAuth();

    const revision = await getRevisionByIdForUser(userId, revisionId);
    if (!revision) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Revision not found or access denied.",
        },
      };
    }

    return {
      success: true,
      data: revision,
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
        message:
          error instanceof Error ? error.message : "Failed to fetch revision details.",
      },
    };
  }
}

/**
 * Server Action: Retrieves dashboard revision metrics.
 */
export async function getRevisionMetricsAction(): Promise<ActionResult<RevisionMetrics>> {
  try {
    const { userId } = await requireAuth();
    const metrics = await getRevisionMetrics(userId);
    return {
      success: true,
      data: metrics,
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
        message:
          error instanceof Error ? error.message : "Failed to fetch revision metrics.",
      },
    };
  }
}
