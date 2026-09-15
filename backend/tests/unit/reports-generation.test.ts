import { describe, it, expect } from "vitest";
import {
  reportQuerySchema,
  ReportType,
  LearningProgressReportData,
  FocusTimeReportData,
  LearningLogReportData,
  RevisionReportData,
  MasteryReportData,
  CalendarActivityReportData,
  AnalyticsReportData,
  MoneyReportData,
  CompleteReportData,
} from "@/lib/reports/report-types";
import { resolveDateInterval } from "@/repositories/report-repository";
import { generateCsvForReport } from "@/lib/reports/csv-generator";
import { generateJsonForReport } from "@/lib/reports/json-generator";
import { generatePdfForReport } from "@/lib/reports/pdf-generator";

// --- Mock Data Factories ---

const mockMetadata = (type: ReportType) => ({
  reportType: type,
  title: `Test ${type} Report`,
  generatedAt: "2026-09-13T10:00:00.000Z",
  periodLabel: "Last 30 Days",
  from: "2026-08-14",
  to: "2026-09-13",
  user: {
    name: "Alex Learner",
    email: "alex@learntrack.local",
  },
});

const mockLearningProgress: LearningProgressReportData = {
  metadata: mockMetadata("learning-progress"),
  summary: {
    totalTasks: 12,
    completedTasks: 8,
    activeTasks: 4,
    archivedTasks: 0,
    topicsLearned: 8,
    topicsFullyCompleted: 3,
    completionPercentage: 67,
    totalFocusMinutes: 540,
  },
  categories: [
    {
      name: "Computer Science",
      color: "#3b82f6",
      taskCount: 8,
      completedCount: 6,
      focusMinutes: 360,
    },
    {
      name: "Mathematics",
      color: "#10b981",
      taskCount: 4,
      completedCount: 2,
      focusMinutes: 180,
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "Distributed Systems Consensus (Raft)",
      categoryName: "Computer Science",
      priority: "HIGH",
      status: "FULLY_COMPLETED",
      completedSessions: 4,
      estimatedSessions: 4,
      totalFocusMinutes: 180,
      plannedDate: "2026-09-01",
      learningCompletedAt: "2026-09-01",
    },
  ],
};

const mockFocusTime: FocusTimeReportData = {
  metadata: mockMetadata("focus-time"),
  summary: {
    totalSessions: 16,
    completedSessions: 14,
    interruptedSessions: 2,
    totalFocusMinutes: 630,
    totalFocusHours: "10.5 hrs",
    averageSessionMinutes: 45,
    completionRate: 88,
  },
  dailyFocus: [
    { date: "2026-09-12", dayLabel: "Saturday", focusMinutes: 90, sessionCount: 2 },
    { date: "2026-09-13", dayLabel: "Sunday", focusMinutes: 135, sessionCount: 3 },
  ],
  categoryBreakdown: [
    { name: "Computer Science", focusMinutes: 450, percentage: 71 },
    { name: "Mathematics", focusMinutes: 180, percentage: 29 },
  ],
  topicBreakdown: [
    { title: "Distributed Consensus", categoryName: "Computer Science", focusMinutes: 180, sessionCount: 4 },
  ],
};

const mockLearningLogs: LearningLogReportData = {
  metadata: mockMetadata("learning-logs"),
  summary: {
    totalLogs: 6,
    averageConfidence: 4.2,
    highConfidenceCount: 5,
    openDoubtsCount: 1,
  },
  logs: [
    {
      id: "log-1",
      topicTitle: "Raft Leader Election",
      categoryName: "Computer Science",
      date: "2026-09-10",
      confidence: 5,
      confidenceLabel: "Mastered",
      whatLearned: "Heartbeat timers and randomized split vote resolution.",
      whatCompleted: "Implemented election timer state machine.",
      doubts: "Need to verify log compaction under network partitions.",
      notes: "Paper figures 3 and 4 are key.",
    },
  ],
};

const mockRevisions: RevisionReportData = {
  metadata: mockMetadata("revisions"),
  summary: {
    totalRevisions: 12,
    completedRevisions: 9,
    dueToday: 1,
    overdue: 0,
    upcoming: 2,
    adherenceRate: 90,
    masteredTopicsCount: 3,
  },
  milestoneProgression: {
    r1: { total: 4, completed: 4, description: "Day 0 (Same Day)" },
    r2: { total: 4, completed: 3, description: "Day +3" },
    r3: { total: 2, completed: 1, description: "Day +15" },
    r4: { total: 2, completed: 1, description: "Day +30" },
  },
  revisions: [
    {
      id: "rev-1",
      topicTitle: "Raft Leader Election",
      categoryName: "Computer Science",
      revisionNumber: 1,
      milestoneName: "R1 - Immediate",
      intervalOffset: "Day 0",
      scheduledDate: "2026-09-01",
      completedAt: "2026-09-01",
      status: "COMPLETED",
      isOverdue: false,
      confidence: 5,
      notes: "Recalled all state transitions cleanly.",
    },
  ],
};

const mockMastery: MasteryReportData = {
  metadata: mockMetadata("mastery"),
  summary: {
    totalTopics: 10,
    learnedTopics: 8,
    fullyCompletedTopics: 3,
    inRevisionTopics: 5,
    masteryPercentage: 30,
    averageConfidence: 4.3,
  },
  categoryMastery: [
    {
      name: "Computer Science",
      color: "#3b82f6",
      totalTopics: 7,
      masteredTopics: 2,
      masteryPercentage: 29,
    },
  ],
  masteryList: [
    {
      id: "task-1",
      title: "Raft Consensus Algorithm",
      categoryName: "Computer Science",
      status: "FULLY_COMPLETED",
      revisionsCompleted: 4,
      isMastered: true,
      learningCompletedDate: "2026-08-10",
      masteryDate: "2026-09-10",
    },
  ],
};

const mockCalendar: CalendarActivityReportData = {
  metadata: mockMetadata("calendar"),
  summary: {
    totalEvents: 18,
    tasksPlanned: 6,
    focusSessionsRecorded: 8,
    revisionsScheduled: 4,
  },
  events: [
    {
      id: "ev-1",
      title: "Raft Consensus Protocol",
      type: "TASK",
      typeLabel: "Planned Learning Task",
      date: "2026-09-12",
      status: "FULLY_COMPLETED",
      categoryName: "Computer Science",
    },
    {
      id: "ev-2",
      title: "Focus: Raft Consensus Protocol",
      type: "FOCUS_SESSION",
      typeLabel: "Focus Block (45m)",
      date: "2026-09-12",
      status: "COMPLETED",
      durationMinutes: 45,
    },
  ],
};

const mockAnalytics: AnalyticsReportData = {
  metadata: mockMetadata("analytics"),
  summary: {
    totalFocusMinutes: 810,
    completedFocusSessions: 18,
    focusCompletionRate: 95,
    topicsLearned: 8,
    topicsFullyCompleted: 3,
    revisionAdherenceRate: 92,
    currentStreak: 7,
    longestStreak: 14,
  },
  insights: ["High revision adherence at 92%", "Peak focus occurs in morning blocks"],
  dailyTrajectory: [{ date: "2026-09-12", focusMinutes: 90, sessions: 2 }],
  revisionDistribution: [
    { revisionNumber: 1, completed: 4, scheduled: 4 },
    { revisionNumber: 2, completed: 3, scheduled: 4 },
    { revisionNumber: 3, completed: 1, scheduled: 2 },
    { revisionNumber: 4, completed: 1, scheduled: 2 },
  ],
};

const mockMoney: MoneyReportData = {
  metadata: mockMetadata("money"),
  formula: {
    needsPct: 50,
    savingsPct: 20,
    growthPct: 20,
    wantsPct: 10,
  },
  currentBudget: {
    year: 2026,
    month: 9,
    amount: 1000,
    needs: 500,
    savings: 200,
    growth: 200,
    wants: 100,
    totalSpent: 420,
    netBalance: 580,
    formulaVerified: true,
  },
  monthlyHistory: [
    {
      year: 2026,
      month: 9,
      monthLabel: "Sep 2026",
      amount: 1000,
      needs: 500,
      savings: 200,
      growth: 200,
      wants: 100,
      totalSpent: 420,
      netBalance: 580,
    },
  ],
  recentExpenses: [
    {
      date: "2026-09-05",
      amount: 120,
      description: "Distributed Systems Textbook",
      category: "GROWTH",
    },
  ],
};

const mockComplete: CompleteReportData = {
  metadata: mockMetadata("complete"),
  learningProgress: mockLearningProgress,
  focusTime: mockFocusTime,
  learningLogs: mockLearningLogs,
  revisions: mockRevisions,
  mastery: mockMastery,
  calendarActivity: mockCalendar,
  analytics: mockAnalytics,
  money: mockMoney,
};

describe("LearnTrack Reports Export & Download System", () => {
  describe("Validation & Query Parameter Schema", () => {
    it("should validate all 9 supported report types and formats", () => {
      const types: ReportType[] = [
        "learning-progress",
        "focus-time",
        "learning-logs",
        "revisions",
        "mastery",
        "calendar",
        "analytics",
        "money",
        "complete",
      ];

      for (const t of types) {
        for (const fmt of ["pdf", "csv", "json"] as const) {
          const res = reportQuerySchema.safeParse({
            type: t,
            format: fmt,
            range: "30d",
          });
          expect(res.success).toBe(true);
        }
      }
    });

    it("should default range to '30d' when omitted", () => {
      const res = reportQuerySchema.safeParse({
        type: "focus-time",
        format: "pdf",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.range).toBe("30d");
      }
    });

    it("should reject malicious or invalid types and formats", () => {
      expect(reportQuerySchema.safeParse({ type: "passwords", format: "pdf" }).success).toBe(false);
      expect(reportQuerySchema.safeParse({ type: "learning-progress", format: "exe" }).success).toBe(false);
      expect(reportQuerySchema.safeParse({ type: "focus-time", format: "pdf", from: "not-a-date" }).success).toBe(false);
    });
  });

  describe("Date Interval Boundaries", () => {
    it("should resolve 'today' correctly", () => {
      const interval = resolveDateInterval({ rangePreset: "today" });
      expect(interval.periodLabel).toBe("Today");
      expect(interval.startDate).toBeDefined();
      expect(interval.endDate).toBeDefined();
    });

    it("should resolve 'custom' dates accurately", () => {
      const interval = resolveDateInterval({
        rangePreset: "custom",
        from: "2026-01-01",
        to: "2026-06-30",
      });
      expect(interval.fromStr).toBe("2026-01-01");
      expect(interval.toStr).toBe("2026-06-30");
      expect(interval.periodLabel).toContain("Custom");
    });
  });

  describe("CSV Generation Engine", () => {
    it("should prepend UTF-8 BOM (\\uFEFF) for Excel compatibility", () => {
      const csv = generateCsvForReport("learning-progress", mockLearningProgress);
      expect(csv.startsWith("\uFEFF")).toBe(true);
    });

    it("should include executive summary, headers, and properly escaped fields", () => {
      const csv = generateCsvForReport("learning-progress", mockLearningProgress);
      expect(csv).toContain("Test learning-progress Report");
      expect(csv).toContain("Distributed Systems Consensus (Raft)");
      expect(csv).toContain("Computer Science");
      expect(csv).toContain("67%");
    });

    it("should generate valid CSV for all 9 report types without errors", () => {
      const dataset: [ReportType, unknown][] = [
        ["learning-progress", mockLearningProgress],
        ["focus-time", mockFocusTime],
        ["learning-logs", mockLearningLogs],
        ["revisions", mockRevisions],
        ["mastery", mockMastery],
        ["calendar", mockCalendar],
        ["analytics", mockAnalytics],
        ["money", mockMoney],
        ["complete", mockComplete],
      ];

      for (const [type, data] of dataset) {
        const result = generateCsvForReport(type, data);
        expect(result.length).toBeGreaterThan(50);
        expect(result.startsWith("\uFEFF")).toBe(true);
      }
    });

    it("should escape quotes and newlines per RFC 4180", () => {
      const customLog: LearningLogReportData = {
        ...mockLearningLogs,
        logs: [
          {
            id: "log-q",
            topicTitle: 'Topic with "Double Quotes" and, comma',
            categoryName: "CS",
            date: "2026-09-12",
            confidence: 4,
            confidenceLabel: "High",
            whatLearned: "First line\nSecond line",
            whatCompleted: null,
            doubts: null,
            notes: null,
          },
        ],
      };

      const csv = generateCsvForReport("learning-logs", customLog);
      expect(csv).toContain('"Topic with ""Double Quotes"" and, comma"');
      expect(csv).toContain('"First line\nSecond line"');
    });
  });

  describe("JSON Export Engine", () => {
    it("should output valid parseable JSON with standardized envelope", () => {
      const jsonStr = generateJsonForReport("analytics", mockAnalytics);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.schema).toBe("https://learntrack.app/schemas/report-v1.json");
      expect(parsed.exportVersion).toBe("1.0");
      expect(parsed.reportType).toBe("analytics");
      expect(parsed.user.name).toBe("Alex Learner");
      expect(parsed.data.summary.currentStreak).toBe(7);
    });

    it("should generate valid JSON for all 9 types", () => {
      const dataset: [ReportType, unknown][] = [
        ["learning-progress", mockLearningProgress],
        ["focus-time", mockFocusTime],
        ["learning-logs", mockLearningLogs],
        ["revisions", mockRevisions],
        ["mastery", mockMastery],
        ["calendar", mockCalendar],
        ["analytics", mockAnalytics],
        ["money", mockMoney],
        ["complete", mockComplete],
      ];

      for (const [type, data] of dataset) {
        const jsonStr = generateJsonForReport(type, data);
        const parsed = JSON.parse(jsonStr);
        expect(parsed.reportType).toBe(type);
        expect(parsed.data).toBeDefined();
      }
    });
  });

  describe("Native PDF Generation Engine", () => {
    it("should generate a valid PDF-1.4 binary buffer", () => {
      const pdf = generatePdfForReport("focus-time", mockFocusTime);
      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(100);

      const header = pdf.subarray(0, 8).toString("utf-8");
      expect(header.startsWith("%PDF-1.4")).toBe(true);

      const content = pdf.toString("utf-8");
      expect(content).toContain("xref");
      expect(content).toContain("trailer");
      expect(content).toContain("%%EOF");
    });

    it("should generate valid PDFs for all 9 report types", () => {
      const dataset: [ReportType, unknown][] = [
        ["learning-progress", mockLearningProgress],
        ["focus-time", mockFocusTime],
        ["learning-logs", mockLearningLogs],
        ["revisions", mockRevisions],
        ["mastery", mockMastery],
        ["calendar", mockCalendar],
        ["analytics", mockAnalytics],
        ["money", mockMoney],
        ["complete", mockComplete],
      ];

      for (const [type, data] of dataset) {
        const pdf = generatePdfForReport(type, data);
        expect(Buffer.isBuffer(pdf)).toBe(true);
        expect(pdf.length).toBeGreaterThan(500);
        expect(pdf.toString("utf-8")).toContain("%%EOF");
      }
    });
  });

  describe("Tenant Isolation & Data Privacy Verification", () => {
    it("should never expose password hashes, tokens, or credentials in any export", () => {
      const allExports = [
        generateCsvForReport("complete", mockComplete),
        generateJsonForReport("complete", mockComplete),
        generatePdfForReport("complete", mockComplete).toString("utf-8"),
      ];

      for (const exp of allExports) {
        expect(exp).not.toContain("password");
        expect(exp).not.toContain("hashedPassword");
        expect(exp).not.toContain("sessionToken");
        expect(exp).not.toContain("secret");
      }
    });
  });
});
