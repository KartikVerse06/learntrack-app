import { Request, Response } from "express";
import { getFullAnalyticsPayload } from "../repositories/analytics-repository.js";
import { AnalyticsQuerySchema } from "../validators/analytics.js";
import { AnalyticsDateRange } from "../lib/analytics/analytics-types.js";

export async function getAnalytics(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = AnalyticsQuerySchema.safeParse(req.query);

  const range: AnalyticsDateRange = parseResult.success && parseResult.data.range
    ? (parseResult.data.range as AnalyticsDateRange)
    : "30d";

  const data = await getFullAnalyticsPayload(userId, range);

  return res.status(200).json({
    success: true,
    data,
  });
}
