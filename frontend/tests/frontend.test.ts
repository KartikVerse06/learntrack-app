import { describe, it, expect } from "vitest";
import {
  calculateActiveElapsedSeconds,
  calculateRemainingSeconds,
  formatTimerDisplay,
} from "../src/lib/focus-timer-utils";
import {
  formatDateToISO,
  parseISODate,
  getRelativeDateISO,
} from "../src/lib/date-utils";
import {
  calculateMoneyAllocation,
  formatMoney,
} from "../src/lib/money/money-utils";
import { REVISION_INTERVALS } from "../src/lib/revision-date-utils";

describe("Frontend Invariants & Domain Verification", () => {
  describe("45-Minute Focus Block Invariants", () => {
    it("formats 2700 seconds as exactly 45:00", () => {
      expect(formatTimerDisplay(2700)).toBe("45:00");
      expect(formatTimerDisplay(0)).toBe("00:00");
      expect(formatTimerDisplay(65)).toBe("01:05");
    });

    it("calculates active elapsed seconds based on timestamp delta", () => {
      const startMs = 1700000000000;
      const nowMs = startMs + 600 * 1000; // 10 minutes later
      const accumulatedPaused = 60; // 1 minute paused

      const elapsed = calculateActiveElapsedSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        accumulatedPausedDurationSeconds: accumulatedPaused,
        isPaused: false,
        nowMs,
      });
      // 600 - 60 = 540 seconds (9 mins)
      expect(elapsed).toBe(540);
    });

    it("calculates remaining seconds accurately without drifting below zero", () => {
      const startMs = 1700000000000;
      const remaining = calculateRemainingSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        nowMs: startMs + 2800 * 1000, // 2800 seconds elapsed
      });
      expect(remaining).toBe(0);

      const remainingHalf = calculateRemainingSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        nowMs: startMs + 1350 * 1000, // 1350 seconds elapsed
      });
      expect(remainingHalf).toBe(1350);
    });
  });

  describe("Spaced Revision Schedule Intervals", () => {
    it("strictly defines exactly 4 automated intervals: Day 0, +3, +15, +30", () => {
      expect(REVISION_INTERVALS.map((r) => r.offsetDays)).toEqual([0, 3, 15, 30]);
      expect(REVISION_INTERVALS).toHaveLength(4);
    });
  });

  describe("50/20/20/10 Financial Allocation Formula", () => {
    it("allocates exactly 50% Needs, 20% Savings, 20% Growth, 10% Wants", () => {
      const breakdown = calculateMoneyAllocation(10000);
      expect(breakdown.needs).toBe(5000);
      expect(breakdown.savings).toBe(2000);
      expect(breakdown.growth).toBe(2000);
      expect(breakdown.wants).toBe(1000);
      expect(breakdown.needs + breakdown.savings + breakdown.growth + breakdown.wants).toBe(10000);
    });

    it("formats money amounts with Indian Rupee symbol", () => {
      const formatted = formatMoney(5000);
      expect(formatted).toContain("5,000");
    });
  });

  describe("Date Utility Robustness", () => {
    it("formats Date to ISO YYYY-MM-DD correctly", () => {
      const d = new Date(Date.UTC(2026, 8, 14)); // Sep 14 2026 UTC
      expect(formatDateToISO(d)).toBe("2026-09-14");
    });

    it("computes relative offset dates accurately across month boundaries", () => {
      expect(getRelativeDateISO("2026-09-14", 1)).toBe("2026-09-15");
      expect(getRelativeDateISO("2026-09-30", 1)).toBe("2026-10-01");
    });
  });
});
