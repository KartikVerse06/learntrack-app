import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { getCalendarEvents } from "@/server/repositories/calendar-repository";
import { parseISODate } from "@/lib/date-utils";

describe("Calendar Repository & Range Filtering", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeEach(async () => {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `cal-user-a-${timestamp}@learntrack.test`,
        name: "Calendar User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `cal-user-b-${timestamp}@learntrack.test`,
        name: "Calendar User B",
      },
    });
  });

  afterAll(async () => {
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "cal-user-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "cal-user-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "cal-user-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "cal-user-" } },
    });
  });

  it("should retrieve events within range and exclude events outside range", async () => {
    // Create task within September 2026 range
    const taskInRange = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Task in September",
        plannedDate: parseISODate("2026-09-15"),
        status: "PLANNED",
      },
    });

    // Create task outside range (October 2026)
    await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Task in October",
        plannedDate: parseISODate("2026-10-15"),
        status: "PLANNED",
      },
    });

    // Create revision within September range
    await prisma.revision.create({
      data: {
        userId: userA.id,
        learningTaskId: taskInRange.id,
        revisionNumber: 1,
        scheduledDate: parseISODate("2026-09-15"),
        status: "DUE",
      },
    });

    // Create revision outside range
    await prisma.revision.create({
      data: {
        userId: userA.id,
        learningTaskId: taskInRange.id,
        revisionNumber: 4,
        scheduledDate: parseISODate("2026-10-15"),
        status: "PENDING",
      },
    });

    // Create completed focus session in September
    await prisma.focusSession.create({
      data: {
        userId: userA.id,
        learningTaskId: taskInRange.id,
        startedAt: new Date("2026-09-15T14:00:00Z"),
        endedAt: new Date("2026-09-15T14:45:00Z"),
        actualDuration: 2700,
        status: "COMPLETED",
      },
    });

    // Query for September 2026
    const events = await getCalendarEvents(userA.id, "2026-09-01", "2026-09-30");

    // Expect 3 events: 1 Task, 1 Revision, 1 FocusSession
    expect(events).toHaveLength(3);

    const types = events.map((e) => e.extendedProps.type);
    expect(types).toContain("TASK");
    expect(types).toContain("REVISION");
    expect(types).toContain("FOCUS_SESSION");

    // Verify October events were excluded
    const eventTitles = events.map((e) => e.title);
    expect(eventTitles).not.toContain("Task in October");
  });

  it("should enforce tenant boundary: User A cannot see User B's events", async () => {
    const taskB = await prisma.learningTask.create({
      data: {
        userId: userB.id,
        title: "User B Secret Topic",
        plannedDate: parseISODate("2026-09-15"),
        status: "PLANNED",
      },
    });

    await prisma.revision.create({
      data: {
        userId: userB.id,
        learningTaskId: taskB.id,
        revisionNumber: 1,
        scheduledDate: parseISODate("2026-09-15"),
        status: "DUE",
      },
    });

    // User A queries the same range
    const userAEvents = await getCalendarEvents(userA.id, "2026-09-01", "2026-09-30");

    expect(userAEvents).toHaveLength(0);
    expect(userAEvents.find((e) => e.title.includes("Secret Topic"))).toBeUndefined();
  });
});
