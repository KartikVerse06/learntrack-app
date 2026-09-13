import { Request, Response } from "express";
import {
  getRecentLearningLogsForUser,
  getLearningLogByIdForUser,
  getLearningLogForFocusSession,
  getCompletedSessionsWithoutLogs,
  createLearningLog,
  updateLearningLogForUser,
} from "../repositories/learning-log-repository.js";
import {
  CreateLearningLogSchema,
  UpdateLearningLogSchema,
} from "../validators/learning-log.js";

export async function getLogs(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = req.query.sessionId as string | undefined;

  if (sessionId) {
    const log = await getLearningLogForFocusSession(userId, sessionId);
    return res.status(200).json({
      success: true,
      data: log,
    });
  }

  const limit = parseInt((req.query.limit as string) || "20", 10);

  const logs = await getRecentLearningLogsForUser(userId, limit);
  return res.status(200).json({
    success: true,
    data: logs,
  });
}

export async function getSessionsWithoutLogs(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessions = await getCompletedSessionsWithoutLogs(userId);

  return res.status(200).json({
    success: true,
    data: sessions,
  });
}

export async function getLogById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const logId = req.params.id;

  const log = await getLearningLogByIdForUser(userId, logId);
  if (!log) {
    return res.status(404).json({
      success: false,
      error: {
        code: "LOG_NOT_FOUND",
        message: "Learning log not found.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: log,
  });
}

export async function createLog(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = CreateLearningLogSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid learning log data",
      },
    });
  }

  try {
    const log = await createLearningLog(userId, parseResult.data);
    return res.status(201).json({
      success: true,
      data: log,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "LOG_CREATION_ERROR",
        message: err.message || "Failed to create learning log",
      },
    });
  }
}

export async function updateLog(req: Request, res: Response) {
  const userId = req.user!.userId;
  const logId = req.params.id;
  const parseResult = UpdateLearningLogSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid update log data",
      },
    });
  }

  try {
    const log = await updateLearningLogForUser(userId, logId, parseResult.data);
    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "LOG_UPDATE_ERROR",
        message: err.message || "Failed to update learning log",
      },
    });
  }
}
