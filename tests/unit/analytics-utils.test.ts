import { describe, it, expect } from "vitest";
import {
  calculateDateRangeBounds,
  generateDateSequence,
  calculateStreakFromDates,
  generateDeterministicInsights,
} from "@/lib/analytics/analytics-utils";
import type {
  AnalyticsSummaryDTO,
  RevisionAdherenceDTO,
  CategoryDistributionItem,
} from "@/lib/analytics/analytics-types";

describe("Analytics Utilities & Streak Engine", () => {
  describe("calculateDateRangeBounds", () => {
    it("should calculate correct 7-day inclusive range ending on today", () => {
      const todayISO = "2026-09-11";
      const bounds = calculateDateRangeBounds("7d", todayISO);

      expect(bounds.endDate).toBe("2026-09-11");
      expect(bounds.startDate).toBe("2026-09-05");
      const sequence = generateDateSequence(bounds.startDate!, bounds.endDate);
      expect(sequence.length).toBe(7);
      expect(sequence[0]).toBe("2026-09-05");
      expect(sequence[6]).toBe("2026-09-11");
    });

    it("should calculate correct 30-day inclusive range ending on today", () => {
      const todayISO = "2026-09-11";
      const bounds = calculateDateRangeBounds("30d", todayISO);

      expect(bounds.endDate).toBe("2026-09-11");
      expect(bounds.startDate).toBe("2026-08-13");
      const sequence = generateDateSequence(bounds.startDate!, bounds.endDate);
      expect(sequence.length).toBe(30);
    });

    it("should return null startDate for all-time range", () => {
      const bounds = calculateDateRangeBounds("all", "2026-09-11");
      expect(bounds.startDate).toBeNull();
      expect(bounds.endDate).toBe("2026-09-11");
    });
  });

  describe("calculateStreakFromDates (Rigorous Streak Engine)", () => {
    const today = "2026-09-11";

    it("should return 0 streak for empty qualifying dates set", () => {
      const result = calculateStreakFromDates(new Set(), today);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it("should recognize active streak when today is qualified", () => {
      const qualifying = new Set(["2026-09-11", "2026-09-10", "2026-09-09"]);
      const result = calculateStreakFromDates(qualifying, today);

      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("should recognize active streak when today is not yet qualified, but yesterday was", () => {
      // Today is not in set yet, but yesterday (2026-09-10) and day before (2026-09-09) are
      const qualifying = new Set(["2026-09-10", "2026-09-09"]);
      const result = calculateStreakFromDates(qualifying, today);

      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it("should reset current streak to 0 if neither today nor yesterday are qualified", () => {
      // Last qualified date was 2 days ago (2026-09-09)
      const qualifying = new Set(["2026-09-09", "2026-09-08", "2026-09-07"]);
      const result = calculateStreakFromDates(qualifying, today);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(3);
    });

    it("should correctly preserve historical longest streak larger than current streak", () => {
      // 5-day streak in August, 2-day streak now
      const qualifying = new Set([
        "2026-08-01",
        "2026-08-02",
        "2026-08-03",
        "2026-08-04",
        "2026-08-05",
        "2026-09-10",
        "2026-09-11",
      ]);
      const result = calculateStreakFromDates(qualifying, today);

      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });
  });

  describe("generateDeterministicInsights", () => {
    const baseSummary: AnalyticsSummaryDTO = {
      totalFocusMinutes: 270,
      completedFocusSessions: 6,
      interruptedFocusSessions: 0,
      focusCompletionRate: 100,
      averageSessionMinutes: 45,
      topicsLearned: 3,
      topicsFullyCompleted: 1,
      totalRevisions: 4,
      completedRevisions: 4,
      revisionAdherenceRate: 100,
      currentStreak: 4,
      longestStreak: 4,
    };

    const baseAdherence: RevisionAdherenceDTO = {
      onTime: 4,
      late: 0,
      pending: 0,
      overdue: 0,
      adherenceRate: 100,
    };

    const baseCategories: CategoryDistributionItem[] = [
      {
        categoryId: "cat-1",
        categoryName: "TypeScript Architecture",
        color: "#2563EB",
        totalMinutes: 180,
        taskCount: 2,
        percentage: 67,
      },
    ];

    it("should return welcome insight for new user without activity", () => {
      const insights = generateDeterministicInsights(
        baseSummary,
        baseAdherence,
        baseCategories,
        false // hasActivity = false
      );

      expect(insights.length).toBe(1);
      expect(insights[0].id).toBe("empty-welcome");
    });

    it("should generate streak and adherence insights for active learner", () => {
      const insights = generateDeterministicInsights(
        baseSummary,
        baseAdherence,
        baseCategories,
        true
      );

      const ids = insights.map((i) => i.id);
      expect(ids).toContain("streak-positive");
      expect(ids).toContain("revision-adherence-high");
      expect(ids).toContain("focus-rate-high");
      expect(ids).toContain("top-category");
      expect(ids).toContain("topics-mastered");
    });

    it("should generate overdue warning when overdue revisions exist", () => {
      const overdueAdherence: RevisionAdherenceDTO = {
        ...baseAdherence,
        overdue: 2,
        adherenceRate: 60,
      };

      const insights = generateDeterministicInsights(
        baseSummary,
        overdueAdherence,
        baseCategories,
        true
      );

      const warning = insights.find((i) => i.id === "revision-overdue");
      expect(warning).toBeDefined();
      expect(warning?.type).toBe("warning");
      expect(warning?.title).toContain("2 Overdue Spaced Revisions");
    });
  });
});
