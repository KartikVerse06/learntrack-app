import {
  AnalyticsReportData,
  CalendarActivityReportData,
  CompleteReportData,
  FocusTimeReportData,
  LearningLogReportData,
  LearningProgressReportData,
  MasteryReportData,
  MoneyReportData,
  ReportType,
  RevisionReportData,
} from "./report-types";

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function generateMetadataHeader(meta: {
  title: string;
  generatedAt: string;
  periodLabel: string;
  user: { name: string; email: string };
}): string[] {
  return [
    toCsvRow(["Report Title", meta.title]),
    toCsvRow(["Generated At", meta.generatedAt]),
    toCsvRow(["Reporting Period", meta.periodLabel]),
    toCsvRow(["Generated For", `${meta.user.name} (${meta.user.email})`]),
    toCsvRow([]),
  ];
}

export function generateLearningProgressCsv(data: LearningProgressReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- EXECUTIVE SUMMARY ---"]),
    toCsvRow(["Total Learning Tasks", data.summary.totalTasks]),
    toCsvRow(["Active Tasks", data.summary.activeTasks]),
    toCsvRow(["Completed Tasks", data.summary.completedTasks]),
    toCsvRow(["Archived Tasks", data.summary.archivedTasks]),
    toCsvRow(["Topics Learned (Initial)", data.summary.topicsLearned]),
    toCsvRow(["Topics Fully Completed (Mastered)", data.summary.topicsFullyCompleted]),
    toCsvRow(["Completion Percentage", `${data.summary.completionPercentage}%`]),
    toCsvRow(["Total Focus Minutes", data.summary.totalFocusMinutes]),
    toCsvRow([]),

    toCsvRow(["--- CATEGORY SUMMARY ---"]),
    toCsvRow(["Category Name", "Total Tasks", "Completed Tasks", "Focus Minutes"]),
    ...data.categories.map((c) =>
      toCsvRow([c.name, c.taskCount, c.completedCount, c.focusMinutes])
    ),
    toCsvRow([]),

    toCsvRow(["--- LEARNING TASKS DETAIL ---"]),
    toCsvRow([
      "Task ID",
      "Topic Title",
      "Category",
      "Priority",
      "Status",
      "Completed Sessions",
      "Estimated Sessions",
      "Focus Minutes",
      "Planned Date",
      "Learning Completed At",
    ]),
    ...data.tasks.map((t) =>
      toCsvRow([
        t.id,
        t.title,
        t.categoryName,
        t.priority,
        t.status,
        t.completedSessions,
        t.estimatedSessions,
        t.totalFocusMinutes,
        t.plannedDate,
        t.learningCompletedAt || "In Progress",
      ])
    ),
  ];
  return rows.join("\r\n");
}

export function generateFocusTimeCsv(data: FocusTimeReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- FOCUS SUMMARY ---"]),
    toCsvRow(["Total Sessions", data.summary.totalSessions]),
    toCsvRow(["Completed 45m Blocks", data.summary.completedSessions]),
    toCsvRow(["Interrupted Sessions", data.summary.interruptedSessions]),
    toCsvRow(["Total Focus Minutes", data.summary.totalFocusMinutes]),
    toCsvRow(["Total Focus Hours", data.summary.totalFocusHours]),
    toCsvRow(["Average Session Minutes", `${data.summary.averageSessionMinutes} min`]),
    toCsvRow(["Completion Rate", `${data.summary.completionRate}%`]),
    toCsvRow([]),

    toCsvRow(["--- DAILY FOCUS LOG ---"]),
    toCsvRow(["Date", "Day", "Focus Minutes", "Sessions Recorded"]),
    ...data.dailyFocus.map((d) =>
      toCsvRow([d.date, d.dayLabel, d.focusMinutes, d.sessionCount])
    ),
    toCsvRow([]),

    toCsvRow(["--- CATEGORY FOCUS BREAKDOWN ---"]),
    toCsvRow(["Category Name", "Focus Minutes", "Share of Total (%)"]),
    ...data.categoryBreakdown.map((c) =>
      toCsvRow([c.name, c.focusMinutes, `${c.percentage}%`])
    ),
    toCsvRow([]),

    toCsvRow(["--- TOPIC FOCUS BREAKDOWN ---"]),
    toCsvRow(["Topic Title", "Category", "Focus Minutes", "Sessions"]),
    ...data.topicBreakdown.map((t) =>
      toCsvRow([t.title, t.categoryName, t.focusMinutes, t.sessionCount])
    ),
  ];
  return rows.join("\r\n");
}

export function generateLearningLogsCsv(data: LearningLogReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- REFLECTION SUMMARY ---"]),
    toCsvRow(["Total Logs", data.summary.totalLogs]),
    toCsvRow(["Average Confidence (1-5)", data.summary.averageConfidence]),
    toCsvRow(["High Confidence Logs (4-5)", data.summary.highConfidenceCount]),
    toCsvRow(["Logs with Doubts/Questions", data.summary.openDoubtsCount]),
    toCsvRow([]),

    toCsvRow(["--- REFLECTIVE SESSION LOGS ---"]),
    toCsvRow([
      "Log ID",
      "Date",
      "Topic Title",
      "Category",
      "Confidence Score",
      "Confidence Level",
      "What Was Learned",
      "What Was Completed",
      "Doubts & Open Questions",
      "Detailed Notes",
    ]),
    ...data.logs.map((l) =>
      toCsvRow([
        l.id,
        l.date,
        l.topicTitle,
        l.categoryName,
        l.confidence,
        l.confidenceLabel,
        l.whatLearned,
        l.whatCompleted || "",
        l.doubts || "",
        l.notes || "",
      ])
    ),
  ];
  return rows.join("\r\n");
}

export function generateRevisionsCsv(data: RevisionReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- SPACED REVISION SUMMARY ---"]),
    toCsvRow(["Total Revisions Scheduled", data.summary.totalRevisions]),
    toCsvRow(["Completed Revisions", data.summary.completedRevisions]),
    toCsvRow(["Due Today", data.summary.dueToday]),
    toCsvRow(["Overdue Revisions", data.summary.overdue]),
    toCsvRow(["Upcoming Revisions", data.summary.upcoming]),
    toCsvRow(["Adherence Rate", `${data.summary.adherenceRate}%`]),
    toCsvRow(["Mastered Topics", data.summary.masteredTopicsCount]),
    toCsvRow([]),

    toCsvRow(["--- 4-STAGE MILESTONE PROGRESSION ---"]),
    toCsvRow(["Milestone", "Schedule Interval", "Total Scheduled", "Completed"]),
    toCsvRow(["R1", data.milestoneProgression.r1.description, data.milestoneProgression.r1.total, data.milestoneProgression.r1.completed]),
    toCsvRow(["R2", data.milestoneProgression.r2.description, data.milestoneProgression.r2.total, data.milestoneProgression.r2.completed]),
    toCsvRow(["R3", data.milestoneProgression.r3.description, data.milestoneProgression.r3.total, data.milestoneProgression.r3.completed]),
    toCsvRow(["R4", data.milestoneProgression.r4.description, data.milestoneProgression.r4.total, data.milestoneProgression.r4.completed]),
    toCsvRow([]),

    toCsvRow(["--- SCHEDULED REVISION SESSIONS ---"]),
    toCsvRow([
      "Revision ID",
      "Topic Title",
      "Category",
      "Milestone",
      "Interval Offset",
      "Scheduled Date",
      "Completed Date",
      "Status",
      "Overdue?",
      "Confidence (1-5)",
      "Revision Notes",
    ]),
    ...data.revisions.map((r) =>
      toCsvRow([
        r.id,
        r.topicTitle,
        r.categoryName,
        r.milestoneName,
        r.intervalOffset,
        r.scheduledDate,
        r.completedAt || "Pending",
        r.status,
        r.isOverdue ? "YES" : "NO",
        r.confidence !== null ? r.confidence : "",
        r.notes || "",
      ])
    ),
  ];
  return rows.join("\r\n");
}

export function generateMasteryCsv(data: MasteryReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- TOPIC MASTERY SUMMARY ---"]),
    toCsvRow(["Total Topics", data.summary.totalTopics]),
    toCsvRow(["Topics Learned", data.summary.learnedTopics]),
    toCsvRow(["Fully Completed (4/4 Revisions)", data.summary.fullyCompletedTopics]),
    toCsvRow(["In Revision Cycle", data.summary.inRevisionTopics]),
    toCsvRow(["Mastery Percentage", `${data.summary.masteryPercentage}%`]),
    toCsvRow(["Average Confidence", data.summary.averageConfidence]),
    toCsvRow([]),

    toCsvRow(["--- CATEGORY MASTERY BREAKDOWN ---"]),
    toCsvRow(["Category Name", "Total Topics", "Mastered Topics", "Mastery Rate (%)"]),
    ...data.categoryMastery.map((c) =>
      toCsvRow([c.name, c.totalTopics, c.masteredTopics, `${c.masteryPercentage}%`])
    ),
    toCsvRow([]),

    toCsvRow(["--- TOPIC RETENTION & MASTERY AUDIT ---"]),
    toCsvRow([
      "Task ID",
      "Topic Title",
      "Category",
      "Status",
      "Revisions Completed",
      "Mastery Status",
      "Learning Completed Date",
      "Mastery Date",
    ]),
    ...data.masteryList.map((m) =>
      toCsvRow([
        m.id,
        m.title,
        m.categoryName,
        m.status,
        `${m.revisionsCompleted}/4`,
        m.isMastered ? "MASTERED" : "IN_PROGRESS",
        m.learningCompletedDate || "Pending",
        m.masteryDate || "Pending",
      ])
    ),
  ];
  return rows.join("\r\n");
}

export function generateCalendarCsv(data: CalendarActivityReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- CALENDAR ACTIVITY SUMMARY ---"]),
    toCsvRow(["Total Events", data.summary.totalEvents]),
    toCsvRow(["Tasks Planned", data.summary.tasksPlanned]),
    toCsvRow(["Focus Sessions", data.summary.focusSessionsRecorded]),
    toCsvRow(["Revisions Scheduled", data.summary.revisionsScheduled]),
    toCsvRow([]),

    toCsvRow(["--- CHRONOLOGICAL ACTIVITY FEED ---"]),
    toCsvRow([
      "Event ID",
      "Date",
      "Type",
      "Activity Label",
      "Title",
      "Status",
      "Category",
      "Duration (Minutes)",
    ]),
    ...data.events.map((e) =>
      toCsvRow([
        e.id,
        e.date,
        e.type,
        e.typeLabel,
        e.title,
        e.status,
        e.categoryName || "",
        e.durationMinutes !== undefined ? e.durationMinutes : "",
      ])
    ),
  ];
  return rows.join("\r\n");
}

export function generateAnalyticsCsv(data: AnalyticsReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- PERFORMANCE & STREAK SUMMARY ---"]),
    toCsvRow(["Total Focus Minutes", data.summary.totalFocusMinutes]),
    toCsvRow(["Completed Focus Sessions", data.summary.completedFocusSessions]),
    toCsvRow(["Focus Completion Rate", `${data.summary.focusCompletionRate}%`]),
    toCsvRow(["Topics Learned", data.summary.topicsLearned]),
    toCsvRow(["Topics Fully Completed", data.summary.topicsFullyCompleted]),
    toCsvRow(["Revision Adherence Rate", `${data.summary.revisionAdherenceRate}%`]),
    toCsvRow(["Current Streak (Days)", data.summary.currentStreak]),
    toCsvRow(["Longest Streak (Days)", data.summary.longestStreak]),
    toCsvRow([]),

    toCsvRow(["--- SYSTEM INSIGHTS ---"]),
    ...data.insights.map((insight) => toCsvRow(["Insight", insight])),
    toCsvRow([]),

    toCsvRow(["--- DAILY TRAJECTORY ---"]),
    toCsvRow(["Date", "Focus Minutes", "Sessions Completed"]),
    ...data.dailyTrajectory.map((d) =>
      toCsvRow([d.date, d.focusMinutes, d.sessions])
    ),
    toCsvRow([]),

    toCsvRow(["--- REVISION DISTRIBUTION ---"]),
    toCsvRow(["Revision Stage", "Completed", "Total Scheduled"]),
    ...data.revisionDistribution.map((r) =>
      toCsvRow([`Revision ${r.revisionNumber}`, r.completed, r.scheduled])
    ),
  ];
  return rows.join("\r\n");
}

export function generateMoneyCsv(data: MoneyReportData): string {
  const rows: string[] = [
    ...generateMetadataHeader(data.metadata),
    toCsvRow(["--- 50/20/20/10 FINANCIAL FORMULA ---"]),
    toCsvRow(["Needs (Essential Living)", `${data.formula.needsPct}%`]),
    toCsvRow(["Savings (Future Security)", `${data.formula.savingsPct}%`]),
    toCsvRow(["Growth (Learning & Education)", `${data.formula.growthPct}%`]),
    toCsvRow(["Wants (Discretionary)", `${data.formula.wantsPct}%`]),
    toCsvRow([]),

    toCsvRow(["--- MONTHLY FINANCIAL HISTORY ---"]),
    toCsvRow([
      "Year",
      "Month",
      "Month Name",
      "Total Income ($)",
      "Needs ($)",
      "Savings ($)",
      "Growth/Learning ($)",
      "Wants ($)",
      "Total Spent ($)",
      "Net Balance ($)",
    ]),
    ...data.monthlyHistory.map((m) =>
      toCsvRow([
        m.year,
        m.month,
        m.monthLabel,
        m.amount.toFixed(2),
        m.needs.toFixed(2),
        m.savings.toFixed(2),
        m.growth.toFixed(2),
        m.wants.toFixed(2),
        m.totalSpent.toFixed(2),
        m.netBalance.toFixed(2),
      ])
    ),
    toCsvRow([]),

    toCsvRow(["--- RECORDED EXPENSES ---"]),
    toCsvRow(["Date", "Category", "Amount ($)", "Description"]),
    ...data.recentExpenses.map((exp) =>
      toCsvRow([exp.date, exp.category, exp.amount.toFixed(2), exp.description])
    ),
  ];
  return rows.join("\r\n");
}

export function generateCompleteCsv(data: CompleteReportData): string {
  const sections: string[] = [
    toCsvRow(["=================================================="]),
    toCsvRow(["           LEARNTRACK COMPLETED ARCHIVE            "]),
    toCsvRow(["=================================================="]),
    ...generateMetadataHeader(data.metadata),
    toCsvRow([]),

    toCsvRow(["=== 1. LEARNING PROGRESS REPORT ==="]),
    generateLearningProgressCsv(data.learningProgress),
    toCsvRow([]),

    toCsvRow(["=== 2. FOCUS TIME REPORT ==="]),
    generateFocusTimeCsv(data.focusTime),
    toCsvRow([]),

    toCsvRow(["=== 3. LEARNING REFLECTION LOGS ==="]),
    generateLearningLogsCsv(data.learningLogs),
    toCsvRow([]),

    toCsvRow(["=== 4. SPACED REVISION SCHEDULE ==="]),
    generateRevisionsCsv(data.revisions),
    toCsvRow([]),

    toCsvRow(["=== 5. TOPIC RETENTION & MASTERY ==="]),
    generateMasteryCsv(data.mastery),
    toCsvRow([]),

    toCsvRow(["=== 6. CALENDAR ACTIVITY FEED ==="]),
    generateCalendarCsv(data.calendarActivity),
    toCsvRow([]),

    toCsvRow(["=== 7. PERFORMANCE ANALYTICS & STREAKS ==="]),
    generateAnalyticsCsv(data.analytics),
    toCsvRow([]),

    toCsvRow(["=== 8. 50/20/20/10 FINANCIAL HISTORY ==="]),
    generateMoneyCsv(data.money),
  ];

  return sections.join("\r\n");
}

/**
 * Universal CSV dispatcher. Prepends UTF-8 BOM (\uFEFF) for universal spreadsheet compatibility.
 */
export function generateCsvForReport(type: ReportType, data: unknown): string {
  let content = "";
  switch (type) {
    case "learning-progress":
      content = generateLearningProgressCsv(data as LearningProgressReportData);
      break;
    case "focus-time":
      content = generateFocusTimeCsv(data as FocusTimeReportData);
      break;
    case "learning-logs":
      content = generateLearningLogsCsv(data as LearningLogReportData);
      break;
    case "revisions":
      content = generateRevisionsCsv(data as RevisionReportData);
      break;
    case "mastery":
      content = generateMasteryCsv(data as MasteryReportData);
      break;
    case "calendar":
      content = generateCalendarCsv(data as CalendarActivityReportData);
      break;
    case "analytics":
      content = generateAnalyticsCsv(data as AnalyticsReportData);
      break;
    case "money":
      content = generateMoneyCsv(data as MoneyReportData);
      break;
    case "complete":
      content = generateCompleteCsv(data as CompleteReportData);
      break;
    default:
      throw new Error(`Unsupported report type for CSV generation: ${type}`);
  }

  // Prepend UTF-8 BOM so Excel automatically recognizes encoding
  return "\uFEFF" + content;
}
