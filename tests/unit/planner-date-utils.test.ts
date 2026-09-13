import { describe, it, expect } from "vitest";
import {
  formatDateToISO,
  parseISODate,
  getTodayISO,
  getRelativeDateISO,
  formatDisplayDate,
  isToday,
} from "@/lib/date-utils";

describe("Planner Date Utilities", () => {
  it("should format Date objects to deterministic YYYY-MM-DD strings", () => {
    const date = new Date(Date.UTC(2026, 8, 10)); // Month 8 is September
    expect(formatDateToISO(date)).toBe("2026-09-10");
  });

  it("should parse ISO date strings into exact UTC Date objects", () => {
    const parsed = parseISODate("2026-09-10");
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(8); // September
    expect(parsed.getUTCDate()).toBe(10);
  });

  it("should throw error when parsing malformed ISO dates", () => {
    expect(() => parseISODate("2026-09")).toThrow("Invalid ISO date format");
    expect(() => parseISODate("invalid-date-string")).toThrow("Invalid ISO date format");
  });

  it("should correctly compute relative dates for previous and next days", () => {
    const baseDate = "2026-09-10";
    const nextDay = getRelativeDateISO(baseDate, 1);
    const prevDay = getRelativeDateISO(baseDate, -1);
    const threeDaysLater = getRelativeDateISO(baseDate, 3);

    expect(nextDay).toBe("2026-09-11");
    expect(prevDay).toBe("2026-09-09");
    expect(threeDaysLater).toBe("2026-09-13");
  });

  it("should handle month and leap year boundaries accurately", () => {
    // End of February in leap year 2024
    expect(getRelativeDateISO("2024-02-28", 1)).toBe("2024-02-29");
    expect(getRelativeDateISO("2024-02-29", 1)).toBe("2024-03-01");

    // Year boundary
    expect(getRelativeDateISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(getRelativeDateISO("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("should format display dates in human-readable US English format", () => {
    const display = formatDisplayDate("2026-09-10");
    expect(display).toContain("September 10, 2026");
    expect(display).toContain("Thursday");
  });

  it("should determine if a date is today accurately", () => {
    const today = getTodayISO();
    expect(isToday(today)).toBe(true);

    const yesterday = getRelativeDateISO(today, -1);
    expect(isToday(yesterday)).toBe(false);

    const tomorrow = getRelativeDateISO(today, 1);
    expect(isToday(tomorrow)).toBe(false);
  });
});
