import { describe, it, expect } from "vitest";
import {
  calculateActiveElapsedSeconds,
  calculateRemainingSeconds,
  formatTimerDisplay,
  calculateProgressPercentage,
} from "@/lib/focus-timer-utils";

describe("Focus Timer Delta Mathematics & Formatting", () => {
  const PLANNED = 2700; // 45 minutes

  it("should calculate exact remaining seconds at start of session (45:00)", () => {
    const startMs = 1000000;
    const nowMs = startMs;

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(remaining).toBe(2700);
    expect(formatTimerDisplay(remaining)).toBe("45:00");
  });

  it("should calculate 30 minutes remaining when 15 minutes elapsed", () => {
    const startMs = 1000000;
    const nowMs = startMs + 15 * 60 * 1000; // 15 mins later

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(remaining).toBe(1800); // 30 minutes
    expect(formatTimerDisplay(remaining)).toBe("30:00");
  });

  it("should calculate 1 second remaining", () => {
    const startMs = 1000000;
    const nowMs = startMs + (PLANNED - 1) * 1000;

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(remaining).toBe(1);
    expect(formatTimerDisplay(remaining)).toBe("00:01");
  });

  it("should clamp remaining seconds to 0 when elapsed equals planned duration", () => {
    const startMs = 1000000;
    const nowMs = startMs + PLANNED * 1000;

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(remaining).toBe(0);
    expect(formatTimerDisplay(remaining)).toBe("00:00");
  });

  it("should clamp remaining seconds to 0 without returning negative numbers (OS sleep / lid closed)", () => {
    const startMs = 1000000;
    const nowMs = startMs + (PLANNED + 3600) * 1000; // 1 hour overdue

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(remaining).toBe(0);
    expect(formatTimerDisplay(remaining)).toBe("00:00");
  });

  it("should safely handle negative delta if client clock shifts before start", () => {
    const startMs = 1000000;
    const nowMs = startMs - 5000; // clock drifted 5s back

    const elapsed = calculateActiveElapsedSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });
    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      nowMs,
    });

    expect(elapsed).toBe(0);
    expect(remaining).toBe(2700);
  });

  it("should accurately exclude accumulated paused duration", () => {
    const startMs = 1000000;
    // 20 minutes passed in clock, but 5 minutes was paused previously
    const nowMs = startMs + 20 * 60 * 1000;
    const accumulatedPausedSeconds = 5 * 60;

    const elapsed = calculateActiveElapsedSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      accumulatedPausedDurationSeconds: accumulatedPausedSeconds,
      nowMs,
    });
    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      accumulatedPausedDurationSeconds: accumulatedPausedSeconds,
      nowMs,
    });

    expect(elapsed).toBe(15 * 60); // 15 mins active
    expect(remaining).toBe(30 * 60); // 30 mins remaining
    expect(formatTimerDisplay(remaining)).toBe("30:00");
  });

  it("should accurately freeze elapsed time while currently paused", () => {
    const startMs = 1000000;
    const pauseStartMs = startMs + 10 * 60 * 1000; // paused after 10 mins
    const nowMs = pauseStartMs + 10 * 60 * 1000; // 10 mins spent in paused state

    const elapsed = calculateActiveElapsedSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      isPaused: true,
      pauseStartTimestampMs: pauseStartMs,
      nowMs,
    });
    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: PLANNED,
      isPaused: true,
      pauseStartTimestampMs: pauseStartMs,
      nowMs,
    });

    expect(elapsed).toBe(10 * 60); // only 10 minutes counted
    expect(remaining).toBe(35 * 60); // 35 minutes remaining
  });

  it("should format timer display with zero padding", () => {
    expect(formatTimerDisplay(2700)).toBe("45:00");
    expect(formatTimerDisplay(248)).toBe("04:08");
    expect(formatTimerDisplay(9)).toBe("00:09");
    expect(formatTimerDisplay(0)).toBe("00:00");
    expect(formatTimerDisplay(-10)).toBe("00:00");
  });

  it("should calculate progress percentage accurately", () => {
    expect(calculateProgressPercentage(0, 2700)).toBe(0);
    expect(calculateProgressPercentage(1350, 2700)).toBe(50);
    expect(calculateProgressPercentage(2700, 2700)).toBe(100);
    expect(calculateProgressPercentage(3000, 2700)).toBe(100);
  });
});
