import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let mockCurrentUserId: string | null = null;

// Mock requireAuth to point to mockCurrentUserId
vi.mock("@/lib/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Authentication required.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
  requireAuth: vi.fn(async () => {
    if (!mockCurrentUserId) {
      const { UnauthorizedError } = await import("@/lib/session");
      throw new UnauthorizedError();
    }
    return { userId: mockCurrentUserId };
  }),
}));

import { getAnalyticsDataAction } from "@/server/actions/analytics-actions";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Analytics Server Actions & Validation", () => {
  let userAId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const hash = await hashPassword("ValidPass123!");

    const userA = await createUser({
      name: "Analytics Action User A",
      email: `ana_act_a_${timestamp}@example.com`,
      passwordHash: hash,
    });
    userAId = userA.id;

    mockCurrentUserId = userAId;
  });

  it("should return UNAUTHORIZED if user session is absent", async () => {
    mockCurrentUserId = null;

    const res = await getAnalyticsDataAction("30d", "UTC");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("UNAUTHORIZED");
      expect(res.error.message).toContain("Authentication required");
    }
  });

  it("should fetch analytics data successfully for authorized user", async () => {
    const res = await getAnalyticsDataAction("30d", "UTC");

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.dateRange).toBe("30d");
      expect(res.data.summary).toBeDefined();
      expect(res.data.dailyFocus).toBeDefined();
      expect(res.data.revisionAdherence).toBeDefined();
      expect(res.data.confidenceTrajectory.length).toBe(5); // Stages 0 through 4
    }
  });

  it("should reject invalid date range with VALIDATION_ERROR", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await getAnalyticsDataAction("invalid_range" as any, "UTC");

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
