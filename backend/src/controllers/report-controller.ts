import { Request, Response } from "express";
import { fetchReportData } from "../repositories/report-repository.js";
import { reportQuerySchema } from "../lib/reports/report-types.js";
import { generateCsvForReport } from "../lib/reports/csv-generator.js";
import { generateJsonForReport } from "../lib/reports/json-generator.js";
import { generatePdfForReport } from "../lib/reports/pdf-generator.js";
import { getTodayISO } from "../lib/date-utils.js";

export async function getStats(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = reportQuerySchema.safeParse(req.query);

  const range = parseResult.success ? parseResult.data.range : "30d";
  const from = parseResult.success ? parseResult.data.from : undefined;
  const to = parseResult.success ? parseResult.data.to : undefined;

  const [progress, focus, revisions, analytics, money] = await Promise.all([
    fetchReportData(userId, "learning-progress", range, from, to),
    fetchReportData(userId, "focus-time", range, from, to),
    fetchReportData(userId, "revisions", range, from, to),
    fetchReportData(userId, "analytics", range, from, to),
    fetchReportData(userId, "money", range, from, to),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      learningTasks: progress.summary?.totalTasks ?? 0,
      focusMinutes: focus.summary?.totalFocusMinutes ?? 0,
      learningLogs: progress.summary?.completedTasks ?? 0,
      revisionsDue: (revisions.summary?.dueToday ?? 0) + (revisions.summary?.overdue ?? 0),
      masteredTopics: progress.summary?.topicsFullyCompleted ?? 0,
      currentStreak: analytics.summary?.currentStreak ?? 0,
      monthlyIncome: money.currentBudget?.amount ?? 0,
      totalTasks: progress.summary?.totalTasks ?? 0,
    },
  });
}

export async function downloadReport(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parseResult = reportQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid report parameters",
      },
    });
  }

  const query = parseResult.data;
  const reportData = await fetchReportData(
    userId,
    query.type,
    query.range,
    query.from,
    query.to,
    query.categoryId
  );
  const dateStr = getTodayISO();

  if (query.format === "csv") {
    const csvContent = generateCsvForReport(query.type, reportData);
    const filename = `learntrack-${query.type}-${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }

  if (query.format === "pdf") {
    const pdfBuffer = generatePdfForReport(query.type, reportData);
    const filename = `learntrack-${query.type}-${dateStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  }

  // JSON format
  const jsonContent = generateJsonForReport(query.type, reportData);
  const filename = `learntrack-${query.type}-${dateStr}.json`;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(jsonContent);
}
