import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { getFullAnalyticsPayload } from "@/repositories/analytics-repository";
import { parseISODate } from "@/lib/date-utils";

describe("Analytics Repository & Tenant Boundary Isolation", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeEach(async () => {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `ana-user-a-${timestamp}@learntrack.test`,
        name: "Analytics User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `ana-user-b-${timestamp}@learntrack.test`,
        name: "Analytics User B",
      },
    });
  });

  afterAll(async () => {
    await prisma.learningLog.deleteMany({
      where: { user: { email: { contains: "ana-user-" } } },
    });
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "ana-user-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "ana-user-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "ana-user-" } } },
    });
    await prisma.category.deleteMany({
      where: { user: { email: { contains: "ana-user-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "ana-user-" } },
    });
  });

  it("should return empty state for new user without data", async () => {
    const payload = await getFullAnalyticsPayload(userA.id, "30d", "UTC");

    expect(payload.hasActivity).toBe(false);
    expect(payload.summary.totalFocusMinutes).toBe(0);
    expect(payload.summary.completedFocusSessions).toBe(0);
    expect(payload.summary.topicsLearned).toBe(0);
    expect(payload.summary.topicsFullyCompleted).toBe(0);
    expect(payload.summary.currentStreak).toBe(0);
    expect(payload.insights[0].id).toBe("empty-welcome");
  });

  it("should enforce multi-tenant isolation: User A receives 0 metrics for User B activity", async () => {
    // 1. Create category and task for User B
    const catB = await prisma.category.create({
      data: {
        userId: userB.id,
        name: "User B Category",
        color: "#EF4444",
      },
    });

    const taskB = await prisma.learningTask.create({
      data: {
        userId: userB.id,
        categoryId: catB.id,
        title: "User B Secret Study Topic",
        plannedDate: parseISODate("2026-09-10"),
        status: "FULLY_COMPLETED",
        learningCompletedAt: new Date("2026-09-10T10:00:00Z"),
        fullyCompletedAt: new Date("2026-09-10T12:00:00Z"),
      },
    });

    // Create 45m completed focus session for User B
    await prisma.focusSession.create({
      data: {
        userId: userB.id,
        learningTaskId: taskB.id,
        status: "COMPLETED",
        startedAt: new Date("2026-09-10T09:00:00Z"),
        endedAt: new Date("2026-09-10T09:45:00Z"),
        actualDuration: 2700, // 45 min
      },
    });

    // 2. Query Analytics for User A
    const payloadA = await getFullAnalyticsPayload(userA.id, "30d", "UTC");

    // User A must see 0 focus minutes, 0 tasks, 0 sessions
    expect(payloadA.hasActivity).toBe(false);
    expect(payloadA.summary.totalFocusMinutes).toBe(0);
    expect(payloadA.summary.completedFocusSessions).toBe(0);
    expect(payloadA.summary.topicsFullyCompleted).toBe(0);
    expect(payloadA.categoryDistribution.length).toBe(0);

    // 3. Query Analytics for User B
    const payloadB = await getFullAnalyticsPayload(userB.id, "30d", "UTC");
    expect(payloadB.hasActivity).toBe(true);
    expect(payloadB.summary.totalFocusMinutes).toBe(45);
    expect(payloadB.summary.completedFocusSessions).toBe(1);
    expect(payloadB.summary.topicsFullyCompleted).toBe(1);
    expect(payloadB.categoryDistribution[0].categoryName).toBe("User B Category");
  });

  it("should calculate confidence progression trajectory across Stage 0 and Revision milestones", async () => {
    // 1. Create Task for User A
    const taskA = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Distributed Systems Consensus",
        plannedDate: parseISODate("2026-09-01"),
        status: "REVISION_PENDING",
        learningCompletedAt: new Date("2026-09-01T10:00:00Z"),
      },
    });

    // 2. Create focus session with LearningLog (Confidence = 3)
    const sessionA = await prisma.focusSession.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        status: "COMPLETED",
        startedAt: new Date("2026-09-01T09:00:00Z"),
        endedAt: new Date("2026-09-01T09:45:00Z"),
        actualDuration: 2700,
      },
    });

    await prisma.learningLog.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        focusSessionId: sessionA.id,
        whatLearned: "Learned Raft leader election and log replication principles.",
        confidence: 3,
      },
    });

    // 3. Create Revision 1 (Completed with Confidence = 4)
    await prisma.revision.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        revisionNumber: 1,
        scheduledDate: parseISODate("2026-09-01"),
        status: "COMPLETED",
        completedAt: new Date("2026-09-01T14:00:00Z"),
        confidence: 4,
      },
    });

    // 4. Create Revision 2 (Completed with Confidence = 5)
    await prisma.revision.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        revisionNumber: 2,
        scheduledDate: parseISODate("2026-09-04"),
        status: "COMPLETED",
        completedAt: new Date("2026-09-04T15:00:00Z"),
        confidence: 5,
      },
    });

    // 5. Query analytics
    const payload = await getFullAnalyticsPayload(userA.id, "30d", "UTC");

    // Check confidence progression trajectory
    const stage0 = payload.confidenceTrajectory.find((s) => s.stage === 0);
    const stage1 = payload.confidenceTrajectory.find((s) => s.stage === 1);
    const stage2 = payload.confidenceTrajectory.find((s) => s.stage === 2);
    const stage3 = payload.confidenceTrajectory.find((s) => s.stage === 3);

    expect(stage0?.averageConfidence).toBe(3);
    expect(stage1?.averageConfidence).toBe(4);
    expect(stage2?.averageConfidence).toBe(5);
    expect(stage3?.averageConfidence).toBeNull(); // Not completed yet
  });
});
