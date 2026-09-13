import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/date-utils";
import {
  createLearningTask,
  getTaskByIdForUser,
  getDailyTaskSummary,
} from "@/server/repositories/learning-task-repository";
import {
  createFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
} from "@/server/repositories/focus-session-repository";
import { createLearningLog } from "@/server/repositories/learning-log-repository";
import {
  markTopicAsLearned,
  completeRevision,
  getRevisionsForTask,
} from "@/server/repositories/revision-repository";
import { getCalendarEvents } from "@/server/repositories/calendar-repository";
import { getFullAnalyticsPayload } from "@/server/repositories/analytics-repository";

describe("E2E Full Learning Lifecycle & Cross-Domain Consistency", () => {
  let user: { id: string; email: string };
  let category: { id: string; name: string };

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 1000000);
    user = await prisma.user.create({
      data: {
        email: `lifecycle-${timestamp}@learntrack.test`,
        name: "Lifecycle User",
      },
    });

    category = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Distributed Systems",
        color: "#2563EB",
      },
    });
  });

  afterAll(async () => {
    await prisma.learningLog.deleteMany({
      where: { user: { email: { contains: "lifecycle-" } } },
    });
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "lifecycle-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "lifecycle-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "lifecycle-" } } },
    });
    await prisma.category.deleteMany({
      where: { user: { email: { contains: "lifecycle-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "lifecycle-" } },
    });
  });

  it("should execute complete 8-stage lifecycle and assert cross-domain data consistency", async () => {
    const plannedDate = "2026-09-11";

    // =========================================================================
    // STAGE 1: PLAN — Create learning task in Daily Planner
    // =========================================================================
    const task = await createLearningTask(user.id, {
      title: "Raft Consensus Algorithm",
      description: "Understand leader election, log replication, and safety properties.",
      categoryId: category.id,
      plannedDate,
      priority: "HIGH",
      estimatedSessions: 1,
    });

    expect(task.status).toBe("PLANNED");
    expect(task.estimatedSessions).toBe(1);
    expect(task.completedSessions).toBe(0);

    // Verify Dashboard Daily Task Summary Consistency
    const initialSummary = await getDailyTaskSummary(user.id, plannedDate);
    expect(initialSummary.totalTasks).toBe(1);
    expect(initialSummary.plannedSessions).toBe(1);
    expect(initialSummary.completedSessions).toBe(0);
    expect(initialSummary.totalFocusMinutes).toBe(0);

    // =========================================================================
    // STAGE 2: FOCUS — Launch 45-minute focus session
    // =========================================================================
    const session = await createFocusSession(user.id, task.id);
    expect(session.status).toBe("ACTIVE");
    expect(session.plannedDuration).toBe(2700);

    // Verify Task status transitioned to IN_PROGRESS
    const taskInProgress = await getTaskByIdForUser(user.id, task.id);
    expect(taskInProgress?.status).toBe("IN_PROGRESS");

    // Simulate pause and resume
    const paused = await pauseFocusSession(user.id, session.id);
    expect(paused.status).toBe("PAUSED");

    const resumed = await resumeFocusSession(user.id, session.id);
    expect(resumed.status).toBe("ACTIVE");

    // Complete the 45-minute focus block
    const completedSession = await completeFocusSession(user.id, session.id);
    expect(completedSession.status).toBe("COMPLETED");
    expect(completedSession.actualDuration).toBe(2700); // 45m

    // Verify Task statistics incremented atomically
    const taskAfterFocus = await getTaskByIdForUser(user.id, task.id);
    expect(taskAfterFocus?.completedSessions).toBe(1);
    expect(taskAfterFocus?.totalFocusMinutes).toBe(45);

    // Verify Calendar shows the emerald focus session event
    const calendarEventsAfterFocus = await getCalendarEvents(
      user.id,
      "2026-09-01",
      "2026-09-30"
    );
    const focusEvent = calendarEventsAfterFocus.find(
      (e) => e.extendedProps.type === "FOCUS_SESSION"
    );
    expect(focusEvent).toBeDefined();
    expect(focusEvent?.backgroundColor).toBe("#10B981");

    // =========================================================================
    // STAGE 3: LOG — Create reflective Learning Log
    // =========================================================================
    const log = await createLearningLog(user.id, {
      taskId: task.id,
      sessionId: session.id,
      whatLearned: "Dissected Raft randomized election timeouts to avoid split-vote deadlock.",
      whatCompleted: "Finished sections 5.1 and 5.2 of the Ongaro-Ousterhout paper.",
      confidence: 3, // Initial confidence: 3/5
    });

    expect(log.confidence).toBe(3);
    expect(log.learningTaskId).toBe(task.id);

    // =========================================================================
    // STAGE 4: LEARN — Mark topic as learned & trigger revision schedule
    // =========================================================================
    const { task: learnedTask, revisions } = await markTopicAsLearned(
      user.id,
      task.id,
      "UTC"
    );

    expect(learnedTask.status).toBe("REVISION_PENDING");
    expect(learnedTask.learningCompletedAt).not.toBeNull();
    expect(revisions.length).toBe(4);

    // Verify revision milestone schedule offsets
    expect(revisions[0].revisionNumber).toBe(1);
    expect(revisions[0].status).toBe("DUE"); // Revision 1 is due same day

    expect(revisions[1].revisionNumber).toBe(2);
    expect(revisions[1].status).toBe("PENDING");

    expect(revisions[2].revisionNumber).toBe(3);
    expect(revisions[2].status).toBe("PENDING");

    expect(revisions[3].revisionNumber).toBe(4);
    expect(revisions[3].status).toBe("PENDING");

    // =========================================================================
    // STAGES 5–7: REVISE (1–3) — Complete early revisions and assert mastery guard
    // =========================================================================
    // Complete Revision 1 (Day 0)
    const rev1Result = await completeRevision(user.id, revisions[0].id, {
      confidence: 4,
      notes: "Active recall on Term IDs and RequestVote RPC args.",
    });
    expect(rev1Result.isTopicMastered).toBe(false);

    // Complete Revision 2 (Day +3)
    const rev2Result = await completeRevision(user.id, revisions[1].id, {
      confidence: 4,
      notes: "Log matching invariant proof review.",
    });
    expect(rev2Result.isTopicMastered).toBe(false);

    // Complete Revision 3 (Day +15)
    const rev3Result = await completeRevision(user.id, revisions[2].id, {
      confidence: 5,
      notes: "Joint consensus cluster membership changes.",
    });
    expect(rev3Result.isTopicMastered).toBe(false);

    // CRITICAL INVARIANT: With 3/4 revisions complete, topic MUST NOT be FULLY_COMPLETED
    const taskAfterRev3 = await getTaskByIdForUser(user.id, task.id);
    expect(taskAfterRev3?.status).toBe("REVISION_PENDING");
    expect(taskAfterRev3?.fullyCompletedAt).toBeNull();

    // =========================================================================
    // STAGE 8: COMPLETE — Revision 4 completed unlocks FULLY_COMPLETED
    // =========================================================================
    const rev4Result = await completeRevision(user.id, revisions[3].id, {
      confidence: 5,
      notes: "Log compaction and install snapshot RPC.",
    });
    expect(rev4Result.isTopicMastered).toBe(true);

    // Verify task atomically transitioned to FULLY_COMPLETED
    const fullyMasteredTask = await getTaskByIdForUser(user.id, task.id);
    expect(fullyMasteredTask?.status).toBe("FULLY_COMPLETED");
    expect(fullyMasteredTask?.fullyCompletedAt).not.toBeNull();

    // =========================================================================
    // STAGE 9: ANALYZE — Validate cross-domain Analytics consistency
    // =========================================================================
    const analytics = await getFullAnalyticsPayload(user.id, "30d", "UTC");

    expect(analytics.hasActivity).toBe(true);
    expect(analytics.summary.totalFocusMinutes).toBe(45);
    expect(analytics.summary.completedFocusSessions).toBe(1);
    expect(analytics.summary.topicsLearned).toBe(1);
    expect(analytics.summary.topicsFullyCompleted).toBe(1);
    expect(analytics.summary.totalRevisions).toBe(4);
    expect(analytics.summary.completedRevisions).toBe(4);
    expect(analytics.summary.revisionAdherenceRate).toBe(100);
    expect(analytics.summary.currentStreak).toBe(1);

    // Verify Confidence Progression Trajectory Curve:
    // Stage 0: Initial Log (3.0)
    // Stage 1: Rev 1 (4.0)
    // Stage 2: Rev 2 (4.0)
    // Stage 3: Rev 3 (5.0)
    // Stage 4: Rev 4 (5.0)
    expect(analytics.confidenceTrajectory[0].averageConfidence).toBe(3);
    expect(analytics.confidenceTrajectory[1].averageConfidence).toBe(4);
    expect(analytics.confidenceTrajectory[2].averageConfidence).toBe(4);
    expect(analytics.confidenceTrajectory[3].averageConfidence).toBe(5);
    expect(analytics.confidenceTrajectory[4].averageConfidence).toBe(5);

    // Verify Category Distribution
    expect(analytics.categoryDistribution.length).toBe(1);
    expect(analytics.categoryDistribution[0].categoryName).toBe("Distributed Systems");
    expect(analytics.categoryDistribution[0].totalMinutes).toBe(45);

    // Verify Deterministic Insights generated
    const insightIds = analytics.insights.map((i) => i.id);
    expect(insightIds).toContain("topics-mastered");
    expect(insightIds).toContain("revision-adherence-high");
  });
});
