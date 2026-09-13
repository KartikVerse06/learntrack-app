import { describe, it, expect } from "vitest";
import {
  calculateRevisionDates,
  computeRevisionState,
  getRelativeRevisionDueLabel,
  REVISION_INTERVALS,
} from "@/lib/revision-date-utils";

describe("Revision Date Calculation Engine & Invariants", () => {
  it("should have exactly 4 intervals with correct offsets: Day 0, +3, +15, +30", () => {
    expect(REVISION_INTERVALS).toHaveLength(4);
    expect(REVISION_INTERVALS[0].offsetDays).toBe(0);
    expect(REVISION_INTERVALS[1].offsetDays).toBe(3);
    expect(REVISION_INTERVALS[2].offsetDays).toBe(15);
    expect(REVISION_INTERVALS[3].offsetDays).toBe(30);

    expect(REVISION_INTERVALS.map((i) => i.revisionNumber)).toEqual([1, 2, 3, 4]);
  });

  it("should calculate correct revision milestone dates for standard case (Sept 11)", () => {
    const milestones = calculateRevisionDates("2026-09-11");
    expect(milestones).toHaveLength(4);

    expect(milestones[0]).toMatchObject({
      revisionNumber: 1,
      offsetDays: 0,
      scheduledDate: "2026-09-11", // Day 0 Same Day
    });
    expect(milestones[1]).toMatchObject({
      revisionNumber: 2,
      offsetDays: 3,
      scheduledDate: "2026-09-14", // +3 days
    });
    expect(milestones[2]).toMatchObject({
      revisionNumber: 3,
      offsetDays: 15,
      scheduledDate: "2026-09-26", // +15 days
    });
    expect(milestones[3]).toMatchObject({
      revisionNumber: 4,
      offsetDays: 30,
      scheduledDate: "2026-10-11", // +30 days
    });
  });

  it("should correctly handle month boundaries (Jan 30)", () => {
    const milestones = calculateRevisionDates("2026-01-30");
    // Jan 30 + 0 = Jan 30
    // Jan 30 + 3 = Feb 2
    // Jan 30 + 15 = Feb 14
    // Jan 30 + 30 = Mar 1 (2026 is non-leap year: 31 in Jan, 28 in Feb -> Jan 30 + 30 = March 1)
    expect(milestones[0].scheduledDate).toBe("2026-01-30");
    expect(milestones[1].scheduledDate).toBe("2026-02-02");
    expect(milestones[2].scheduledDate).toBe("2026-02-14");
    expect(milestones[3].scheduledDate).toBe("2026-03-01");
  });

  it("should correctly handle leap years (Feb 2024)", () => {
    // 2024 is a leap year (29 days in Feb)
    const milestones = calculateRevisionDates("2024-02-27");
    // Feb 27 + 0 = Feb 27
    // Feb 27 + 3 = Mar 1
    // Feb 27 + 15 = Mar 13
    // Feb 27 + 30 = Mar 28
    expect(milestones[0].scheduledDate).toBe("2024-02-27");
    expect(milestones[1].scheduledDate).toBe("2024-03-01");
    expect(milestones[2].scheduledDate).toBe("2024-03-13");
    expect(milestones[3].scheduledDate).toBe("2024-03-28");
  });

  it("should correctly handle year rollover (Dec 15)", () => {
    const milestones = calculateRevisionDates("2026-12-15");
    // Dec 15 + 0 = Dec 15, 2026
    // Dec 15 + 3 = Dec 18, 2026
    // Dec 15 + 15 = Dec 30, 2026
    // Dec 15 + 30 = Jan 14, 2027
    expect(milestones[0].scheduledDate).toBe("2026-12-15");
    expect(milestones[1].scheduledDate).toBe("2026-12-18");
    expect(milestones[2].scheduledDate).toBe("2026-12-30");
    expect(milestones[3].scheduledDate).toBe("2027-01-14");
  });

  it("should determine revision status deterministically", () => {
    const today = "2026-09-11";

    // Past date -> OVERDUE
    expect(computeRevisionState("2026-09-10", today, "PENDING")).toBe("OVERDUE");
    // Today -> DUE
    expect(computeRevisionState("2026-09-11", today, "PENDING")).toBe("DUE");
    // Future date -> PENDING
    expect(computeRevisionState("2026-09-14", today, "PENDING")).toBe("PENDING");

    // Already COMPLETED stays COMPLETED even if in the past
    expect(computeRevisionState("2026-09-01", today, "COMPLETED")).toBe("COMPLETED");
    // SKIPPED stays SKIPPED
    expect(computeRevisionState("2026-09-01", today, "SKIPPED")).toBe("SKIPPED");
  });

  it("should generate clear relative due labels", () => {
    const today = "2026-09-11";

    const dueToday = getRelativeRevisionDueLabel("2026-09-11", today);
    expect(dueToday.isDueToday).toBe(true);
    expect(dueToday.isOverdue).toBe(false);
    expect(dueToday.label).toBe("Due Today");

    const overdue1 = getRelativeRevisionDueLabel("2026-09-10", today);
    expect(overdue1.isOverdue).toBe(true);
    expect(overdue1.label).toBe("Overdue by 1 day");

    const overdue3 = getRelativeRevisionDueLabel("2026-09-08", today);
    expect(overdue3.isOverdue).toBe(true);
    expect(overdue3.label).toBe("Overdue by 3 days");

    const futureTomorrow = getRelativeRevisionDueLabel("2026-09-12", today);
    expect(futureTomorrow.isOverdue).toBe(false);
    expect(futureTomorrow.label).toBe("Due tomorrow");

    const future3Days = getRelativeRevisionDueLabel("2026-09-14", today);
    expect(future3Days.isOverdue).toBe(false);
    expect(future3Days.label).toBe("Due in 3 days");
  });
});
