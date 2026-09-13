import { Request, Response } from "express";
import {
  getRevisionsForUser,
  getRevisionMetrics,
  getRevisionByIdForUser,
  completeRevision,
  markTopicAsLearned,
} from "../repositories/revision-repository.js";
import {
  CompleteRevisionSchema,
  GetRevisionsSchema,
  MarkTopicAsLearnedSchema,
} from "../validators/revision.js";

export async function getRevisions(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = GetRevisionsSchema.safeParse(req.query);
  const filter = parseResult.success && parseResult.data.filter ? parseResult.data.filter : "due";
  const categoryId = parseResult.success ? parseResult.data.categoryId : undefined;

  const revisions = await getRevisionsForUser(userId, filter, undefined, categoryId);
  return res.status(200).json({
    success: true,
    data: revisions,
  });
}

export async function getMetrics(req: Request, res: Response) {
  const userId = req.user!.userId;
  const metrics = await getRevisionMetrics(userId);

  return res.status(200).json({
    success: true,
    data: metrics,
  });
}

export async function getRevisionById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const revisionId = req.params.id;

  const revision = await getRevisionByIdForUser(userId, revisionId);
  if (!revision) {
    return res.status(404).json({
      success: false,
      error: {
        code: "REVISION_NOT_FOUND",
        message: "Revision milestone not found.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: revision,
  });
}

export async function complete(req: Request, res: Response) {
  const userId = req.user!.userId;
  const revisionId = req.params.id;
  const parseResult = CompleteRevisionSchema.safeParse({
    revisionId,
    notes: req.body.notes,
    confidence: req.body.confidence,
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
    const result = await completeRevision(userId, revisionId, {
      confidence: parseResult.data.confidence,
      notes: parseResult.data.notes,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "REVISION_COMPLETION_ERROR",
        message: err.message || "Failed to complete revision milestone",
      },
    });
  }
}

export async function markLearned(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = MarkTopicAsLearnedSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid task ID",
      },
    });
  }

  try {
    const result = await markTopicAsLearned(userId, parseResult.data.taskId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MARK_LEARNED_ERROR",
        message: err.message || "Failed to mark topic as learned",
      },
    });
  }
}
