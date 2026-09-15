import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { CalendarEventsQuerySchema } from "@/validators/calendar";
import { calculateDateRangeBounds } from "@/lib/analytics/analytics-utils";
import { getFullAnalyticsPayload } from "@/repositories/analytics-repository";
import { checkRateLimit, clearRateLimitBuckets, getRateLimitHeaders } from "@/lib/rate-limiter";

describe("Phase 12: Production Performance & Architectural Reliability", () => {
  let perfUser: { id: string; email: string };

  beforeEach(async () => {
    clearRateLimitBuckets();
    const timestamp = Date.now() + Math.floor(Math.random() * 1000000);
    perfUser = await prisma.user.create({
      data: {
        email: `perf-audit-${timestamp}@learntrack.test`,
        name: "Performance Audit User",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "perf-audit-" } },
    });
  });

  describe("1. Bounded Range Constraints & Non-Unbounded Scans", () => {
    it("should enforce valid ISO date range bounds in Calendar query validator", () => {
      const valid = CalendarEventsQuerySchema.safeParse({
        start: "2026-09-01",
        end: "2026-09-30",
      });
      expect(valid.success).toBe(true);

      const invalid = CalendarEventsQuerySchema.safeParse({
        start: "not-a-date",
        end: "2026-09-30",
      });
      expect(invalid.success).toBe(false);
    });

    it("should compute exact window boundaries for 7d, 30d, and 90d analytics presets", () => {
      const today = "2026-09-11";

      const bounds7d = calculateDateRangeBounds("7d", today);
      expect(bounds7d.startDate).toBe("2026-09-05");
      expect(bounds7d.endDate).toBe("2026-09-11");

      const bounds30d = calculateDateRangeBounds("30d", today);
      expect(bounds30d.startDate).toBe("2026-08-13");
      expect(bounds30d.endDate).toBe("2026-09-11");

      const bounds90d = calculateDateRangeBounds("90d", today);
      expect(bounds90d.startDate).toBe("2026-06-14");
      expect(bounds90d.endDate).toBe("2026-09-11");

      const boundsAll = calculateDateRangeBounds("all", today);
      expect(boundsAll.startDate).toBeNull();
      expect(boundsAll.endDate).toBe("2026-09-11");
    });
  });

  describe("2. Concurrent Analytics Aggregation Performance", () => {
    it("should execute concurrent subquery batch without crashing or serial deadlock", async () => {
      const startTime = Date.now();
      const payload = await getFullAnalyticsPayload(perfUser.id, "30d", "UTC");
      const elapsed = Date.now() - startTime;

      expect(payload).toBeDefined();
      expect(payload.summary.totalFocusMinutes).toBe(0);
      expect(payload.summary.topicsLearned).toBe(0);
      expect(payload.dailyFocus).toHaveLength(30);
      expect(elapsed).toBeLessThan(3000); // Fast batch execution
    });
  });

  describe("3. Architectural Rate Limiting Extension Point", () => {
    it("should allow requests under the limit and throttle excess requests", async () => {
      const clientKey = "test-client-ip-127.0.0.1";
      const options = { limit: 5, windowSeconds: 10 };

      // First 5 requests must succeed
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(clientKey, options);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(5 - 1 - i);
      }

      // 6th request must be throttled
      const throttled = await checkRateLimit(clientKey, options);
      expect(throttled.success).toBe(false);
      expect(throttled.remaining).toBe(0);

      // Verify header generation
      const headers = getRateLimitHeaders(throttled);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(parseInt(headers["X-RateLimit-Reset"], 10)).toBeGreaterThanOrEqual(0);
    });
  });
});
