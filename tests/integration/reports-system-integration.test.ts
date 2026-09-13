import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { fetchReportData } from "@/server/repositories/report-repository";
import { generateCsvForReport } from "@/lib/reports/csv-generator";
import { generateJsonForReport } from "@/lib/reports/json-generator";
import { generatePdfForReport } from "@/lib/reports/pdf-generator";
import { ReportType } from "@/lib/reports/report-types";

describe("Reports System Integration & Multi-Tenant Isolation", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let categoryA: { id: string; name: string };
  let categoryB: { id: string; name: string };

  beforeEach(async () => {
    const ts = Date.now() + Math.floor(Math.random() * 1000000);

    // Create User A
    userA = await prisma.user.create({
      data: {
        email: `report-user-a-${ts}@learntrack.test`,
        name: "User A (Secret Project)",
      },
    });

    // Create User B
    userB = await prisma.user.create({
      data: {
        email: `report-user-b-${ts}@learntrack.test`,
        name: "User B (Competitor)",
      },
    });

    // User A Category & Task
    categoryA = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Proprietary Architecture",
        color: "#2563EB",
      },
    });

    const taskA = await prisma.learningTask.create({
      data: {
        userId: userA.id,
        categoryId: categoryA.id,
        title: "Confidential Quantum Algorithm",
        plannedDate: new Date(),
        priority: "HIGH",
        status: "LEARNING_COMPLETED",
        learningCompletedAt: new Date(),
        estimatedSessions: 4,
        completedSessions: 2,
        totalFocusMinutes: 90,
      },
    });

    // User A Focus Session
    const sessionA = await prisma.focusSession.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        startedAt: new Date(),
        endedAt: new Date(),
        plannedDuration: 2700,
        actualDuration: 2700,
        status: "COMPLETED",
      },
    });

    // User A Learning Log
    await prisma.learningLog.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        focusSessionId: sessionA.id,
        whatLearned: "Quantum key exchange under noisy channels.",
        confidence: 5,
        notes: "Top Secret Notes for User A.",
      },
    });

    // User A Revision
    await prisma.revision.create({
      data: {
        userId: userA.id,
        learningTaskId: taskA.id,
        revisionNumber: 1,
        scheduledDate: new Date(),
        status: "COMPLETED",
        completedAt: new Date(),
        confidence: 5,
      },
    });

    // User A Budget
    const now = new Date();
    await prisma.moneyBudget.create({
      data: {
        userId: userA.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        amount: 8000,
        needsAmount: 4000,
        savingsAmount: 1600,
        growthAmount: 1600,
        wantsAmount: 800,
      },
    });

    // User B Category & Task
    categoryB = await prisma.category.create({
      data: {
        userId: userB.id,
        name: "User B Category",
        color: "#10B981",
      },
    });

    await prisma.learningTask.create({
      data: {
        userId: userB.id,
        categoryId: categoryB.id,
        title: "User B Private Research",
        plannedDate: new Date(),
        priority: "LOW",
        status: "PLANNED",
      },
    });
  });

  afterAll(async () => {
    await prisma.moneyExpense.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.moneyBudget.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.learningLog.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.revision.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.focusSession.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.learningTask.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.category.deleteMany({
      where: { user: { email: { contains: "report-user-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "report-user-" } },
    });
  });

  it("should fetch all 9 report types accurately for User A from real database records", async () => {
    const reportTypes: ReportType[] = [
      "learning-progress",
      "focus-time",
      "learning-logs",
      "revisions",
      "mastery",
      "calendar",
      "analytics",
      "money",
      "complete",
    ];

    for (const type of reportTypes) {
      const data = await fetchReportData(userA.id, type, "all");
      expect(data).toBeDefined();
      expect(data.metadata.reportType).toBe(type);
      expect(data.metadata.user.email).toBe(userA.email);
    }
  });

  it("should generate valid CSV, JSON, and PDF from real User A data", async () => {
    const completeData = await fetchReportData(userA.id, "complete", "all");

    // CSV
    const csv = generateCsvForReport("complete", completeData);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Confidential Quantum Algorithm");
    expect(csv).toContain("Quantum key exchange");
    expect(csv).not.toContain("User B Private Research");

    // JSON
    const jsonStr = generateJsonForReport("complete", completeData);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.reportType).toBe("complete");
    expect(parsed.user.email).toBe(userA.email);
    expect(JSON.stringify(parsed)).not.toContain("User B Private Research");

    // PDF
    const pdf = generatePdfForReport("complete", completeData);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.toString("utf-8")).toContain("%PDF-1.4");
  });

  it("should strictly enforce tenant boundary: User B report must never contain User A data", async () => {
    const userBReport = await fetchReportData(userB.id, "complete", "all");
    const userBCsv = generateCsvForReport("complete", userBReport);
    const userBJson = generateJsonForReport("complete", userBReport);
    const userBPdf = generatePdfForReport("complete", userBReport).toString("utf-8");

    // Confirm User A's confidential tasks, logs, and categories are NOT in User B's export
    for (const content of [userBCsv, userBJson, userBPdf]) {
      expect(content).not.toContain("Confidential Quantum Algorithm");
      expect(content).not.toContain("Quantum key exchange");
      expect(content).not.toContain("Proprietary Architecture");
      expect(content).not.toContain("Top Secret Notes for User A");
    }

    // Confirm User B's own data is present
    expect(userBCsv).toContain("User B Private Research");
  });
});
