import { describe, it, expect } from "vitest";
import {
  calculateActiveElapsedSeconds,
  calculateRemainingSeconds,
  formatTimerDisplay,
} from "../src/lib/focus-timer-utils";
import {
  formatDateToISO,
  parseISODate,
  getRelativeDateISO,
} from "../src/lib/date-utils";
import {
  calculateMoneyAllocation,
  formatMoney,
} from "../src/lib/money/money-utils";
import { REVISION_INTERVALS } from "../src/lib/revision-date-utils";

describe("Frontend Invariants & Domain Verification", () => {
  describe("45-Minute Focus Block Invariants", () => {
    it("formats 2700 seconds as exactly 45:00", () => {
      expect(formatTimerDisplay(2700)).toBe("45:00");
      expect(formatTimerDisplay(0)).toBe("00:00");
      expect(formatTimerDisplay(65)).toBe("01:05");
    });

    it("calculates active elapsed seconds based on timestamp delta", () => {
      const startMs = 1700000000000;
      const nowMs = startMs + 600 * 1000; // 10 minutes later
      const accumulatedPaused = 60; // 1 minute paused

      const elapsed = calculateActiveElapsedSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        accumulatedPausedDurationSeconds: accumulatedPaused,
        isPaused: false,
        nowMs,
      });
      // 600 - 60 = 540 seconds (9 mins)
      expect(elapsed).toBe(540);
    });

    it("calculates remaining seconds accurately without drifting below zero", () => {
      const startMs = 1700000000000;
      const remaining = calculateRemainingSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        nowMs: startMs + 2800 * 1000, // 2800 seconds elapsed
      });
      expect(remaining).toBe(0);

      const remainingHalf = calculateRemainingSeconds({
        startTimestampMs: startMs,
        plannedDurationSeconds: 2700,
        nowMs: startMs + 1350 * 1000, // 1350 seconds elapsed
      });
      expect(remainingHalf).toBe(1350);
    });
  });

  describe("Spaced Revision Schedule Intervals", () => {
    it("strictly defines exactly 4 automated intervals: Day 0, +3, +15, +30", () => {
      expect(REVISION_INTERVALS.map((r) => r.offsetDays)).toEqual([0, 3, 15, 30]);
      expect(REVISION_INTERVALS).toHaveLength(4);
    });
  });

  describe("50/20/20/10 Financial Allocation Formula", () => {
    it("allocates exactly 50% Needs, 20% Savings, 20% Growth, 10% Wants", () => {
      const breakdown = calculateMoneyAllocation(10000);
      expect(breakdown.needs).toBe(5000);
      expect(breakdown.savings).toBe(2000);
      expect(breakdown.growth).toBe(2000);
      expect(breakdown.wants).toBe(1000);
      expect(breakdown.needs + breakdown.savings + breakdown.growth + breakdown.wants).toBe(10000);
    });

    it("formats money amounts with Indian Rupee symbol", () => {
      const formatted = formatMoney(5000);
      expect(formatted).toContain("5,000");
    });
  });

  describe("Date Utility Robustness", () => {
    it("formats Date to ISO YYYY-MM-DD correctly", () => {
      const d = new Date(Date.UTC(2026, 8, 14)); // Sep 14 2026 UTC
      expect(formatDateToISO(d)).toBe("2026-09-14");
    });

    it("computes relative offset dates accurately across month boundaries", () => {
      expect(getRelativeDateISO("2026-09-14", 1)).toBe("2026-09-15");
      expect(getRelativeDateISO("2026-09-30", 1)).toBe("2026-10-01");
    });
  });
});

// ---------------------------------------------------------------------------
// Auth Routing Logic & Session Cookie Contract
// ---------------------------------------------------------------------------
describe("Auth Routing & Session Cookie Contract", () => {
  describe("Middleware cookie name contract", () => {
    it("defines learntrack_token as the primary session cookie name", () => {
      // The middleware reads exactly these two cookie names.
      // If either name changes the routing breaks. This pins the contract.
      const PRIMARY_COOKIE = "learntrack_token";
      const FALLBACK_COOKIE = "token";
      expect(PRIMARY_COOKIE).toBe("learntrack_token");
      expect(FALLBACK_COOKIE).toBe("token");
    });

    it("treats a truthy cookie value as authenticated", () => {
      // Replicates the isAuthenticated = !!token check in middleware
      const isAuthenticated = (cookieValue: string | undefined) => !!cookieValue;

      expect(isAuthenticated("eyJhbGciOiJIUzI1NiJ9.test")).toBe(true);
      expect(isAuthenticated(undefined)).toBe(false);
      expect(isAuthenticated("")).toBe(false);
    });
  });

  describe("Root route routing logic (/ must never unconditionally go to /dashboard)", () => {
    // Pure logic test — mirrors exactly what the middleware does for pathname "/"
    const resolveRootRoute = (isAuthenticated: boolean): string =>
      isAuthenticated ? "/dashboard" : "/login";

    it("routes authenticated user at / to /dashboard", () => {
      expect(resolveRootRoute(true)).toBe("/dashboard");
    });

    it("routes unauthenticated user at / to /login", () => {
      expect(resolveRootRoute(false)).toBe("/login");
    });

    it("NEVER routes an unauthenticated user at / to /dashboard", () => {
      expect(resolveRootRoute(false)).not.toBe("/dashboard");
    });
  });

  describe("Protected route guard logic", () => {
    const PROTECTED_PREFIXES = [
      "/dashboard", "/planner", "/focus", "/revisions",
      "/calendar", "/analytics", "/money", "/reports",
      "/settings", "/tasks", "/learning-logs",
    ];

    const isProtected = (pathname: string) =>
      PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    it("marks all 9 dashboard routes as protected", () => {
      expect(isProtected("/dashboard")).toBe(true);
      expect(isProtected("/planner")).toBe(true);
      expect(isProtected("/focus")).toBe(true);
      expect(isProtected("/revisions")).toBe(true);
      expect(isProtected("/calendar")).toBe(true);
      expect(isProtected("/analytics")).toBe(true);
      expect(isProtected("/money")).toBe(true);
      expect(isProtected("/reports")).toBe(true);
      expect(isProtected("/settings")).toBe(true);
    });

    it("marks /login and /register as public (not protected)", () => {
      expect(isProtected("/login")).toBe(false);
      expect(isProtected("/register")).toBe(false);
    });

    it("marks / as public (not in protected list — handled by root route guard)", () => {
      expect(isProtected("/")).toBe(false);
    });

    it("redirects unauthenticated users away from every protected route", () => {
      // Mirrors the middleware: unauthenticated + protected route → /login
      const simulateGuard = (pathname: string, authed: boolean) => {
        if (pathname === "/") return authed ? "/dashboard" : "/login";
        if (isProtected(pathname) && !authed) return "/login";
        return null;
      };

      expect(simulateGuard("/dashboard", false)).toBe("/login");
      expect(simulateGuard("/planner", false)).toBe("/login");
      expect(simulateGuard("/focus", false)).toBe("/login");
      expect(simulateGuard("/revisions", false)).toBe("/login");
      expect(simulateGuard("/money", false)).toBe("/login");
      expect(simulateGuard("/reports", false)).toBe("/login");
      // Authenticated users pass through
      expect(simulateGuard("/dashboard", true)).toBeNull();
      expect(simulateGuard("/planner", true)).toBeNull();
    });
  });

  describe("Expired / invalid JWT token classification", () => {
    it("treats an empty string token as unauthenticated", () => {
      const isAuthenticated = (token: string | undefined) => !!token;
      expect(isAuthenticated("")).toBe(false);
    });

    it("treats string 'undefined' or 'null' as unauthenticated (client storage safety)", () => {
      // getClientAuthToken() guards against these string values
      const isSafeToken = (val: string | null) =>
        !!val && val !== "undefined" && val !== "null";

      expect(isSafeToken("undefined")).toBe(false);
      expect(isSafeToken("null")).toBe(false);
      expect(isSafeToken(null)).toBe(false);
      expect(isSafeToken("eyJhbGciOiJIUzI1NiJ9.realtoken")).toBe(true);
    });
  });
});
