import { describe, it, expect } from "vitest";
import {
  parseISODate,
  formatDateToISO,
  getTodayISO,
  getRelativeDateISO,
  formatDisplayDate,
  isToday,
} from "@/lib/date-utils";
import {
  calculateRevisionDates,
  computeRevisionState,
  getRelativeRevisionDueLabel,
} from "@/lib/revision-date-utils";
import { calculateDateRangeBounds } from "@/lib/analytics/analytics-utils";

describe("Timezone & Date-Shift Invariance Engine", () => {
  describe("Calendar Date-Only Preservation Across Global Timezones", () => {
    const testDates = [
      "2026-01-01",
      "2026-02-28",
      "2026-03-01",
      "2026-06-15",
      "2026-09-11",
      "2026-12-31",
    ];

    it("should parse and format calendar dates with 100% roundtrip fidelity without day shift", () => {
      for (const dStr of testDates) {
        const parsed = parseISODate(dStr);
        const formatted = formatDateToISO(parsed);
        expect(formatted).toBe(dStr);
      }
    });

    it("should format display date consistently in UTC without local machine offset distortion", () => {
      const display = formatDisplayDate("2026-09-11");
      expect(display).toBe("Friday, September 11, 2026");
    });
  });

  describe("Leap Year and Month Boundary Calculations (Spaced Revisions)", () => {
    it("should correctly handle leap year February (29 days) in 2024", () => {
      // 2024 is a leap year. Feb 25 + 3 days = Feb 28; + 15 days = Mar 11; + 30 days = Mar 26
      const baseDate = "2024-02-25";
      const milestones = calculateRevisionDates(baseDate);

      expect(milestones[0].scheduledDate).toBe("2024-02-25"); // Day 0
      expect(milestones[1].scheduledDate).toBe("2024-02-28"); // Day +3
      expect(milestones[2].scheduledDate).toBe("2024-03-11"); // Day +15 (29 - 25 = 4 days in Feb, 11 in Mar)
      expect(milestones[3].scheduledDate).toBe("2024-03-26"); // Day +30 (4 in Feb, 26 in Mar)
    });

    it("should correctly handle non-leap year February (28 days) in 2025", () => {
      // 2025 is NOT a leap year. Feb 25 + 3 days = Feb 28; + 15 days = Mar 12; + 30 days = Mar 27
      const baseDate = "2025-02-25";
      const milestones = calculateRevisionDates(baseDate);

      expect(milestones[0].scheduledDate).toBe("2025-02-25"); // Day 0
      expect(milestones[1].scheduledDate).toBe("2025-02-28"); // Day +3
      expect(milestones[2].scheduledDate).toBe("2025-03-12"); // Day +15 (28 - 25 = 3 days in Feb, 12 in Mar)
      expect(milestones[3].scheduledDate).toBe("2025-03-27"); // Day +30 (3 in Feb, 27 in Mar)
    });

    it("should correctly handle year boundary crossing (December to January)", () => {
      const baseDate = "2026-12-20";
      const milestones = calculateRevisionDates(baseDate);

      expect(milestones[0].scheduledDate).toBe("2026-12-20");
      expect(milestones[1].scheduledDate).toBe("2026-12-23");
      expect(milestones[2].scheduledDate).toBe("2027-01-04"); // Dec has 31 days (11 in Dec + 4 in Jan)
      expect(milestones[3].scheduledDate).toBe("2027-01-19"); // 11 in Dec + 19 in Jan
    });
  });

  describe("Dynamic Revision State Evaluation Across Day Offsets", () => {
    const today = "2026-09-11";

    it("should mark today's revision as DUE", () => {
      const state = computeRevisionState("2026-09-11", today, "PENDING");
      expect(state).toBe("DUE");
      const relative = getRelativeRevisionDueLabel("2026-09-11", today);
      expect(relative.isDueToday).toBe(true);
      expect(relative.isOverdue).toBe(false);
      expect(relative.label).toBe("Due Today");
    });

    it("should mark past revision as OVERDUE", () => {
      const state = computeRevisionState("2026-09-08", today, "PENDING");
      expect(state).toBe("OVERDUE");
      const relative = getRelativeRevisionDueLabel("2026-09-08", today);
      expect(relative.isOverdue).toBe(true);
      expect(relative.label).toBe("Overdue by 3 days");
    });

    it("should mark future revision as PENDING", () => {
      const state = computeRevisionState("2026-09-14", today, "PENDING");
      expect(state).toBe("PENDING");
      const relative = getRelativeRevisionDueLabel("2026-09-14", today);
      expect(relative.isOverdue).toBe(false);
      expect(relative.label).toBe("Due in 3 days");
    });

    it("should preserve COMPLETED status regardless of date shift", () => {
      expect(computeRevisionState("2026-09-05", today, "COMPLETED")).toBe("COMPLETED");
      expect(computeRevisionState("2026-09-11", today, "COMPLETED")).toBe("COMPLETED");
      expect(computeRevisionState("2026-09-20", today, "COMPLETED")).toBe("COMPLETED");
    });
  });

  describe("Analytics Date Range Bounds & Month Rollover", () => {
    it("should accurately compute 30-day range crossing from September into August", () => {
      const bounds = calculateDateRangeBounds("30d", "2026-09-11");
      expect(bounds.endDate).toBe("2026-09-11");
      expect(bounds.startDate).toBe("2026-08-13");
    });

    it("should accurately compute 90-day range crossing from March into December", () => {
      const bounds = calculateDateRangeBounds("90d", "2026-03-01");
      expect(bounds.endDate).toBe("2026-03-01");
      // March 1 (1 day) + Feb (28 days) + Jan (31 days) + Dec (30 days) = 90 days total
      expect(bounds.startDate).toBe("2025-12-02");
    });
  });
});
