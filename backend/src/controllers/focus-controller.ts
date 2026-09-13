import { Request, Response } from "express";
import {
  getActiveFocusSession,
  getFocusSessionById,
  createFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  cancelFocusSession,
} from "../repositories/focus-session-repository.js";
import {
  StartFocusSessionSchema,
  CompleteSessionSchema,
} from "../validators/focus.js";

export async function getActive(req: Request, res: Response) {
  const userId = req.user!.userId;
  const session = await getActiveFocusSession(userId);

  return res.status(200).json({
    success: true,
    data: session,
  });
}

export async function getSession(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.params.id;

  const session = await getFocusSessionById(userId, sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Focus session not found.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: session,
  });
}

export async function startSession(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = StartFocusSessionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid start session data",
      },
    });
  }

  try {
    const session = await createFocusSession(userId, parseResult.data.taskId);
    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FOCUS_SESSION_ERROR",
        message: err.message || "Failed to start focus session",
      },
    });
  }
}

export async function pause(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.params.id;

  try {
    const session = await pauseFocusSession(userId, sessionId);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FOCUS_SESSION_ERROR",
        message: err.message || "Failed to pause focus session",
      },
    });
  }
}

export async function resume(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.params.id;

  try {
    const session = await resumeFocusSession(userId, sessionId);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FOCUS_SESSION_ERROR",
        message: err.message || "Failed to resume focus session",
      },
    });
  }
}

export async function complete(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.params.id;
  const parseResult = CompleteSessionSchema.safeParse({
    sessionId,
    ...req.body,
  });

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid completion data",
      },
    });
  }

  try {
    const session = await completeFocusSession(userId, sessionId, parseResult.data.actualDuration);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FOCUS_SESSION_ERROR",
        message: err.message || "Failed to complete focus session",
      },
    });
  }
}

export async function cancel(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.params.id;

  try {
    const session = await cancelFocusSession(userId, sessionId);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FOCUS_SESSION_ERROR",
        message: err.message || "Failed to cancel focus session",
      },
    });
  }
}
