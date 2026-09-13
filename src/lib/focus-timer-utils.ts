/**
 * Focus Timer Mathematical Calculations
 * Zero-Drift Epoch Timestamp Delta Mathematics
 * As specified in docs/09-pomodoro-focus-system.md
 */

export interface TimerCalculationParams {
  startTimestampMs: number;
  plannedDurationSeconds: number;
  accumulatedPausedDurationSeconds?: number;
  isPaused?: boolean;
  pauseStartTimestampMs?: number | null;
  nowMs?: number;
}

/**
 * Calculates active elapsed seconds without timer drift.
 */
export function calculateActiveElapsedSeconds(params: TimerCalculationParams): number {
  const now = params.nowMs ?? Date.now();
  const start = params.startTimestampMs;

  if (now < start) {
    return 0;
  }

  const basePausedMs = (params.accumulatedPausedDurationSeconds ?? 0) * 1000;
  let currentPauseDeltaMs = 0;

  if (params.isPaused && params.pauseStartTimestampMs) {
    currentPauseDeltaMs = Math.max(0, now - params.pauseStartTimestampMs);
  }

  const totalPausedMs = basePausedMs + currentPauseDeltaMs;
  const activeElapsedMs = Math.max(0, now - start - totalPausedMs);

  return Math.floor(activeElapsedMs / 1000);
}

/**
 * Calculates exact remaining focus seconds.
 */
export function calculateRemainingSeconds(params: TimerCalculationParams): number {
  const activeElapsedSeconds = calculateActiveElapsedSeconds(params);
  return Math.max(0, params.plannedDurationSeconds - activeElapsedSeconds);
}

/**
 * Formats seconds into MM:SS string with zero-padding for tabular-nums display.
 */
export function formatTimerDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${mm}:${ss}`;
}

/**
 * Calculates percentage completed (0 to 100).
 */
export function calculateProgressPercentage(
  elapsedSeconds: number,
  plannedSeconds: number
): number {
  if (plannedSeconds <= 0) return 100;
  const ratio = elapsedSeconds / plannedSeconds;
  return Math.min(100, Math.max(0, Math.round(ratio * 1000) / 10));
}
