"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, UnauthorizedError } from "@/lib/session";
import {
  StartFocusSessionSchema,
  PauseResumeSessionSchema,
  CompleteSessionSchema,
  CancelSessionSchema,
  type StartFocusSessionInput,
  type PauseResumeSessionInput,
  type CompleteSessionInput,
  type CancelSessionInput,
} from "@/server/validators/focus";
import {
  createFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  cancelFocusSession,
  getActiveFocusSession,
  getFocusSessionById,
  type FocusSessionWithTask,
} from "@/server/repositories/focus-session-repository";
import type { ActionResult } from "@/types";

export async function startFocusAction(
  rawInput: StartFocusSessionInput
): Promise<ActionResult<FocusSessionWithTask>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = StartFocusSessionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input provided.",
        },
      };
    }

    const session = await createFocusSession(userId, parseResult.data.taskId);

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/focus");
    revalidatePath(`/tasks/${session.learningTaskId}`);

    return {
      success: true,
      data: session,
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

    const message = error instanceof Error ? error.message : "Failed to start focus session.";
    const code = message.includes("already running")
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

export async function pauseFocusAction(
  rawInput: PauseResumeSessionInput
): Promise<ActionResult<FocusSessionWithTask>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = PauseResumeSessionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session ID.",
        },
      };
    }

    const session = await pauseFocusSession(userId, parseResult.data.sessionId);

    revalidatePath("/focus");

    return {
      success: true,
      data: session,
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

    const message = error instanceof Error ? error.message : "Failed to pause focus session.";
    return {
      success: false,
      error: {
        code: message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
    };
  }
}

export async function resumeFocusAction(
  rawInput: PauseResumeSessionInput
): Promise<ActionResult<FocusSessionWithTask>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = PauseResumeSessionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session ID.",
        },
      };
    }

    const session = await resumeFocusSession(userId, parseResult.data.sessionId);

    revalidatePath("/focus");

    return {
      success: true,
      data: session,
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

    const message = error instanceof Error ? error.message : "Failed to resume focus session.";
    return {
      success: false,
      error: {
        code: message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
    };
  }
}

export async function completeFocusAction(
  rawInput: CompleteSessionInput
): Promise<ActionResult<FocusSessionWithTask>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CompleteSessionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session completion details.",
        },
      };
    }

    const { sessionId, actualDuration } = parseResult.data;
    const session = await completeFocusSession(userId, sessionId, actualDuration);

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/focus");
    revalidatePath(`/tasks/${session.learningTaskId}`);

    return {
      success: true,
      data: session,
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

    const message = error instanceof Error ? error.message : "Failed to complete focus session.";
    return {
      success: false,
      error: {
        code: message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
    };
  }
}

export async function cancelFocusAction(
  rawInput: CancelSessionInput
): Promise<ActionResult<FocusSessionWithTask>> {
  try {
    const { userId } = await requireAuth();

    const parseResult = CancelSessionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session ID.",
        },
      };
    }

    const session = await cancelFocusSession(userId, parseResult.data.sessionId);

    revalidatePath("/dashboard");
    revalidatePath("/planner");
    revalidatePath("/focus");
    revalidatePath(`/tasks/${session.learningTaskId}`);

    return {
      success: true,
      data: session,
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

    const message = error instanceof Error ? error.message : "Failed to cancel focus session.";
    return {
      success: false,
      error: {
        code: message.includes("not found") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
    };
  }
}

export async function getActiveFocusSessionAction(): Promise<
  ActionResult<FocusSessionWithTask | null>
> {
  try {
    const { userId } = await requireAuth();
    const session = await getActiveFocusSession(userId);

    return {
      success: true,
      data: session,
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
        message: error instanceof Error ? error.message : "Failed to fetch active session.",
      },
    };
  }
}

export async function getFocusSessionByIdAction(
  sessionId: string
): Promise<ActionResult<FocusSessionWithTask | null>> {
  try {
    const { userId } = await requireAuth();
    const session = await getFocusSessionById(userId, sessionId);

    return {
      success: true,
      data: session,
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
        message: error instanceof Error ? error.message : "Failed to fetch session.",
      },
    };
  }
}
