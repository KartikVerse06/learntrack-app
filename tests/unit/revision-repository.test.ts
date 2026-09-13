import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  markTopicAsLearned,
  completeRevision,
  getRevisionsForUser,
  getRevisionsForTask,
  getRevisionByIdForUser,
  getRevisionMetrics,
} from "@/server/repositories/revision-repository";
import { parseISODate, formatDateToISO, getTodayISO } from "@/lib/date-utils";

describe("Revision Repository & Mastery State Machine", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeEach(async () => {
    // Generate unique test users
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `user-a-rev-${timestamp}@learntrack.test`,
        name: "User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `user-b-rev-${timestamp}@learntrack.test`,
        name: "User B",
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.revision.deleteMany({
      where: {
        user: {
          email: { contains: "rev-" },
        },
      },
    });
    await prisma.learningTask.deleteMany({
      where: {
        user: {
          email: { contains: "rev-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "rev-" },
      },
    });
  });

  it("should atomically generate exactly 4 revision milestones when marking a topic as learned", async () => {
    const task = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Distributed Consensus Algorithms",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    const result = await markTopicAsLearned(userA.id, task.id, "UTC");

    expect(result.task.status).toBe("REVISION_PENDING");
    expect(result.revisions).toHaveLength(4);

    const [r1, r2, r3, r4] = result.revisions;

    expect(r1.revisionNumber).toBe(1);
    expect(r1.status).toBe("DUE");

    expect(r2.revisionNumber).toBe(2);
    expect(r2.status).toBe("PENDING");

    expect(r3.revisionNumber).toBe(3);
    expect(r3.status).toBe("PENDING");

    expect(r4.revisionNumber).toBe(4);
    expect(r4.status).toBe("PENDING");

    // Verify persisted in database
    const dbRevisions = await prisma.revision.findMany({
      where: { learningTaskId: task.id },
      orderBy: { revisionNumber: "asc" },
    });
    expect(dbRevisions).toHaveLength(4);
    expect(dbRevisions.map((r) => r.revisionNumber)).toEqual([1, 2, 3, 4]);
  });

  it("should enforce idempotency when markTopicAsLearned is called repeatedly", async () => {
    const task = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Database Indexing & B-Trees",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    // Call first time
    const res1 = await markTopicAsLearned(userA.id, task.id);
    expect(res1.revisions).toHaveLength(4);

    // Call second time
    const res2 = await markTopicAsLearned(userA.id, task.id);
    expect(res2.revisions).toHaveLength(4);

    // Verify still exactly 4 in the database
    const count = await prisma.revision.count({
      where: { learningTaskId: task.id },
    });
    expect(count).toBe(4);
  });

  it("should strictly uphold the FULLY_COMPLETED invariant across all 4 revisions", async () => {
    const task = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "EVM Opcode Execution",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    // Generate the 4 milestones
    const { revisions } = await markTopicAsLearned(userA.id, task.id);
    const [r1, r2, r3, r4] = revisions;

    // 1. Complete Revision 1
    const res1 = await completeRevision(userA.id, r1.id, {
      notes: "Recalled fundamental stack execution",
      confidence: 4,
    });
    expect(res1.isTopicMastered).toBe(false);
    expect(res1.revision.status).toBe("COMPLETED");

    let updatedTask = await prisma.learningTask.findUniqueOrThrow({
      where: { id: task.id },
    });
    expect(updatedTask.status).toBe("REVISION_PENDING");
    expect(updatedTask.fullyCompletedAt).toBeNull();

    // 2. Complete Revision 2
    const res2 = await completeRevision(userA.id, r2.id, {
      notes: "Checked gas calculations",
      confidence: 4,
    });
    expect(res2.isTopicMastered).toBe(false);

    updatedTask = await prisma.learningTask.findUniqueOrThrow({
      where: { id: task.id },
    });
    expect(updatedTask.status).toBe("REVISION_PENDING");
    expect(updatedTask.fullyCompletedAt).toBeNull();

    // 3. Complete Revision 3
    const res3 = await completeRevision(userA.id, r3.id, {
      notes: "Verified memory expansion formulas",
      confidence: 5,
    });
    expect(res3.isTopicMastered).toBe(false);

    updatedTask = await prisma.learningTask.findUniqueOrThrow({
      where: { id: task.id },
    });
    expect(updatedTask.status).toBe("REVISION_PENDING");
    expect(updatedTask.fullyCompletedAt).toBeNull();

    // 4. Complete Revision 4 (FINAL REVISION)
    const res4 = await completeRevision(userA.id, r4.id, {
      notes: "Flawless active recall derivation",
      confidence: 5,
    });
    expect(res4.isTopicMastered).toBe(true);
    expect(res4.revision.status).toBe("COMPLETED");

    // NOW and ONLY NOW task transitions to FULLY_COMPLETED
    updatedTask = await prisma.learningTask.findUniqueOrThrow({
      where: { id: task.id },
    });
    expect(updatedTask.status).toBe("FULLY_COMPLETED");
    expect(updatedTask.fullyCompletedAt).not.toBeNull();
  });

  it("should enforce tenant boundary: User A cannot mark User B's task as learned", async () => {
    const taskB = await prisma.learningTask.create({
      data: {
        userId: userB.id,
        title: "User B Private Topic",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    await expect(markTopicAsLearned(userA.id, taskB.id)).rejects.toThrow(
      /Task not found or access denied/
    );

    // Verify no revisions were created
    const count = await prisma.revision.count({
      where: { learningTaskId: taskB.id },
    });
    expect(count).toBe(0);
  });

  it("should enforce tenant boundary: User A cannot complete User B's revision", async () => {
    const taskB = await prisma.learningTask.create({
      data: {
        userId: userB.id,
        title: "User B Spaced Topic",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    const { revisions } = await markTopicAsLearned(userB.id, taskB.id);
    const r1 = revisions[0];

    // User A attempts to complete User B's revision
    await expect(
      completeRevision(userA.id, r1.id, { confidence: 5 })
    ).rejects.toThrow(/Revision not found or access denied/);

    // Verify r1 remains unchanged
    const unchanged = await prisma.revision.findUniqueOrThrow({
      where: { id: r1.id },
    });
    expect(unchanged.status).toBe("DUE");
    expect(unchanged.completedAt).toBeNull();
  });

  it("should correctly compute revision metrics and tabs for a user", async () => {
    const task = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        title: "Compiler Architecture",
        plannedDate: parseISODate("2026-09-11"),
        status: "IN_PROGRESS",
      },
    });

    await markTopicAsLearned(userA.id, task.id);

    const metrics = await getRevisionMetrics(userA.id);
    expect(metrics.dueToday).toBe(1); // Revision 1
    expect(metrics.upcoming).toBe(3); // Revisions 2, 3, 4
    expect(metrics.completed).toBe(0);
    expect(metrics.masteredTopicsCount).toBe(0);

    // Check tabs
    const dueList = await getRevisionsForUser(userA.id, "due");
    expect(dueList).toHaveLength(1);
    expect(dueList[0].revisionNumber).toBe(1);

    const upcomingList = await getRevisionsForUser(userA.id, "upcoming");
    expect(upcomingList).toHaveLength(3);
    expect(upcomingList.map((r) => r.revisionNumber)).toEqual([2, 3, 4]);

    const completedList = await getRevisionsForUser(userA.id, "completed");
    expect(completedList).toHaveLength(0);
  });
});
