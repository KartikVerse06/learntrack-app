import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let currentUserId: string;

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => ({
    userId: currentUserId,
  })),
}));

import { prisma } from "@/lib/db";
import { createUser, hashPassword } from "@/server/repositories/user-repository";
import { createLearningTask } from "@/server/repositories/learning-task-repository";
import {
  createFocusSession,
  completeFocusSession,
} from "@/server/repositories/focus-session-repository";
import { createLearningLogAction } from "@/server/actions/learning-log-actions";
import {
  markTopicAsLearnedAction,
  completeRevisionAction,
  getRevisionsAction,
  getRevisionMetricsAction,
} from "@/server/actions/revision-actions";

describe("E2E Learning Lifecycle: PLAN -> FOCUS -> LOG -> REVISE (1-4) -> FULLY_COMPLETED", () => {
  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("ValidPass123!");

    const user = await createUser({
      name: "Lifecyle Learner",
      email: `lifecycle_${timestamp}@learntrack.test`,
      passwordHash: hash,
    });
    currentUserId = user.id;
  });

  it("should execute complete 7-step learning journey from initial plan to verified mastery", async () => {
    // STEP 1: PLAN — User creates a new learning task
    const task = await createLearningTask(currentUserId, {
      title: "Zero-Knowledge SNARKs & Circuit Synthesis",
      description: "Deep dive into R1CS and Groth16 proof generation",
      plannedDate: "2026-09-11",
      estimatedSessions: 1,
    });
    expect(task.status).toBe("PLANNED");

    // STEP 2: FOCUS — User runs 45m focus session
    const session = await createFocusSession(currentUserId, task.id);
    expect(session.status).toBe("ACTIVE");

    const completedSession = await completeFocusSession(currentUserId, session.id, 2700);
    expect(completedSession.status).toBe("COMPLETED");

    // STEP 3: LEARNING LOG — User reflects on the focus session
    const logRes = await createLearningLogAction({
      taskId: task.id,
      sessionId: session.id,
      whatLearned: "Derived QAP polynomial reduction from Rank-1 Constraint Systems.",
      whatCompleted: "Implemented 3-gate circuit test in Rust",
      doubts: "Need to verify trusted setup ceremony mechanics",
      notes: "Reference: Vitalik blog on QAP",
      confidence: 4,
    });
    expect(logRes.success).toBe(true);

    // Verify task is still in deliberate study, NOT fully completed, NO revisions yet
    let dbTask = await prisma.learningTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(dbTask.status).toBe("IN_PROGRESS");
    const initialRevCount = await prisma.revision.count({ where: { learningTaskId: task.id } });
    expect(initialRevCount).toBe(0);

    // STEP 4: MARK AS LEARNED — Generates the 4 spaced revision milestones
    const markRes = await markTopicAsLearnedAction(task.id);
    expect(markRes.success).toBe(true);
    if (!markRes.success) return;

    expect(markRes.data.task.status).toBe("REVISION_PENDING");
    expect(markRes.data.revisions).toHaveLength(4);

    const [rev1, rev2, rev3, rev4] = markRes.data.revisions;
    expect(rev1.revisionNumber).toBe(1);
    expect(rev2.revisionNumber).toBe(2);
    expect(rev3.revisionNumber).toBe(3);
    expect(rev4.revisionNumber).toBe(4);

    // Verify Revision Center reflects Revision 1 due today
    let metrics = await getRevisionMetricsAction();
    expect(metrics.success).toBe(true);
    if (!metrics.success) return;
    expect(metrics.data.dueToday).toBe(1);
    expect(metrics.data.upcoming).toBe(3);
    expect(metrics.data.masteredTopicsCount).toBe(0);

    // STEP 5: REVISION 1 (Same Day / Day 0)
    const r1Complete = await completeRevisionAction({
      revisionId: rev1.id,
      notes: "Unassisted recall of QAP evaluation at point tau",
      confidence: 4,
    });
    expect(r1Complete.success).toBe(true);
    if (!r1Complete.success) return;
    expect(r1Complete.data.isTopicMastered).toBe(false);

    dbTask = await prisma.learningTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(dbTask.status).toBe("REVISION_PENDING"); // CRITICAL INVARIANT: Not mastered!

    // STEP 6: REVISION 2 (Day +3)
    const r2Complete = await completeRevisionAction({
      revisionId: rev2.id,
      notes: "Reviewed toxic waste disposal in multi-party ceremonies",
      confidence: 4,
    });
    expect(r2Complete.success).toBe(true);
    if (!r2Complete.success) return;
    expect(r2Complete.data.isTopicMastered).toBe(false);

    dbTask = await prisma.learningTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(dbTask.status).toBe("REVISION_PENDING");

    // STEP 7: REVISION 3 (Day +15)
    const r3Complete = await completeRevisionAction({
      revisionId: rev3.id,
      notes: "Active recall check: pairing operations and elliptic curve groups",
      confidence: 5,
    });
    expect(r3Complete.success).toBe(true);
    if (!r3Complete.success) return;
    expect(r3Complete.data.isTopicMastered).toBe(false);

    dbTask = await prisma.learningTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(dbTask.status).toBe("REVISION_PENDING");

    // STEP 8: REVISION 4 (Day +30 — FINAL MASTER VERIFICATION)
    const r4Complete = await completeRevisionAction({
      revisionId: rev4.id,
      notes: "Permanent retention confirmed. Intuitive understanding from first principles.",
      confidence: 5,
    });
    expect(r4Complete.success).toBe(true);
    if (!r4Complete.success) return;
    expect(r4Complete.data.isTopicMastered).toBe(true); // NOW MASTERED!

    // STEP 9: FINAL VERIFICATION OF DATABASE INVARIANTS
    dbTask = await prisma.learningTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(dbTask.status).toBe("FULLY_COMPLETED");
    expect(dbTask.fullyCompletedAt).not.toBeNull();

    // Verify completed archive in Revision Center
    const archive = await getRevisionsAction("completed");
    expect(archive.success).toBe(true);
    if (!archive.success) return;
    expect(archive.data).toHaveLength(4);
    expect(archive.data.every((r) => r.status === "COMPLETED")).toBe(true);

    // Verify Dashboard metrics
    metrics = await getRevisionMetricsAction();
    if (!metrics.success) return;
    expect(metrics.data.dueToday).toBe(0);
    expect(metrics.data.upcoming).toBe(0);
    expect(metrics.data.completed).toBe(4);
    expect(metrics.data.masteredTopicsCount).toBe(1);
  });
});
