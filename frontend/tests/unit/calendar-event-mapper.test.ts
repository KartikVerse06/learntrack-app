import { describe, it, expect } from "vitest";
import {
  mapTaskToCalendarEvent,
  mapRevisionToCalendarEvent,
  mapFocusSessionToCalendarEvent,
  CALENDAR_COLORS,
} from "@/lib/calendar/calendar-event-mapper";
import { parseISODate } from "@/lib/date-utils";

describe("Calendar Event Mapper & DTO Compliance", () => {
  it("should map LearningTask to all-day Blue calendar event", () => {
    const task = {
      id: "clx_task_1",
      userId: "user_1",
      categoryId: "cat_1",
      title: "Raft Consensus Protocol",
      description: "Leader election & log replication",
      plannedDate: parseISODate("2026-09-11"),
      priority: "HIGH" as const,
      estimatedSessions: 2,
      completedSessions: 1,
      totalFocusMinutes: 45,
      status: "IN_PROGRESS" as const,
      learningCompletedAt: null,
      fullyCompletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: "cat_1",
        userId: "user_1",
        name: "Systems",
        color: "#3B82F6",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const event = mapTaskToCalendarEvent(task);

    expect(event.id).toBe("task_clx_task_1");
    expect(event.title).toBe("Raft Consensus Protocol");
    expect(event.start).toBe("2026-09-11");
    expect(event.allDay).toBe(true);
    expect(event.backgroundColor).toBe("#3B82F6");
    expect(event.extendedProps.type).toBe("TASK");
    expect(event.extendedProps.priority).toBe("HIGH");
    expect(event.extendedProps.categoryName).toBe("Systems");
  });

  it("should map Revision to all-day Purple event with milestone prefix", () => {
    const revision = {
      id: "clx_rev_2",
      userId: "user_1",
      learningTaskId: "clx_task_1",
      revisionNumber: 2,
      scheduledDate: parseISODate("2026-09-14"),
      status: "PENDING" as const,
      startedAt: null,
      completedAt: null,
      notes: null,
      confidence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      task: {
        id: "clx_task_1",
        userId: "user_1",
        categoryId: null,
        title: "Raft Consensus Protocol",
        description: null,
        plannedDate: parseISODate("2026-09-11"),
        priority: "HIGH" as const,
        estimatedSessions: 2,
        completedSessions: 1,
        totalFocusMinutes: 45,
        status: "REVISION_PENDING" as const,
        learningCompletedAt: new Date(),
        fullyCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
      },
    };

    const event = mapRevisionToCalendarEvent(revision);

    expect(event.id).toBe("rev_clx_rev_2");
    expect(event.title).toBe("[Rev 2] Raft Consensus Protocol");
    expect(event.start).toBe("2026-09-14");
    expect(event.allDay).toBe(true);
    expect(event.backgroundColor).toBe(CALENDAR_COLORS.REVISION);
    expect(event.extendedProps.type).toBe("REVISION");
    expect(event.extendedProps.revisionNumber).toBe(2);
  });

  it("should map completed FocusSession to timestamped Emerald event with duration", () => {
    const startedAt = new Date("2026-09-11T10:00:00.000Z");
    const endedAt = new Date("2026-09-11T10:45:00.000Z");

    const session = {
      id: "clx_sess_1",
      userId: "user_1",
      learningTaskId: "clx_task_1",
      startedAt,
      endedAt,
      plannedDuration: 2700,
      actualDuration: 2700,
      pausedDuration: 0,
      status: "COMPLETED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      task: {
        id: "clx_task_1",
        userId: "user_1",
        categoryId: null,
        title: "Raft Consensus Protocol",
        description: null,
        plannedDate: parseISODate("2026-09-11"),
        priority: "HIGH" as const,
        estimatedSessions: 2,
        completedSessions: 1,
        totalFocusMinutes: 45,
        status: "IN_PROGRESS" as const,
        learningCompletedAt: null,
        fullyCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
      },
    };

    const event = mapFocusSessionToCalendarEvent(session);

    expect(event.id).toBe("session_clx_sess_1");
    expect(event.title).toBe("[Focus 45m] Raft Consensus Protocol");
    expect(event.allDay).toBe(false);
    expect(event.start).toBe("2026-09-11T10:00:00.000Z");
    expect(event.end).toBe("2026-09-11T10:45:00.000Z");
    expect(event.backgroundColor).toBe(CALENDAR_COLORS.FOCUS);
    expect(event.extendedProps.type).toBe("FOCUS_SESSION");
    expect(event.extendedProps.durationMinutes).toBe(45);
  });
});
