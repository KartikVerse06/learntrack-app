"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FocusSessionWithTask } from "@/server/repositories/focus-session-repository";
import {
  calculateActiveElapsedSeconds,
  calculateRemainingSeconds,
  formatTimerDisplay,
  calculateProgressPercentage,
} from "@/lib/focus-timer-utils";

const LOCAL_STORAGE_KEY = "learntrack_active_timer";

export interface StoredTimerState {
  sessionId: string;
  taskId: string;
  taskTitle: string;
  startTime: number;
  plannedDuration: number;
  pausedDuration: number;
  isPaused: boolean;
  pauseStartTime: number | null;
}

export function useFocusTimer(
  initialSession: FocusSessionWithTask | null,
  onCompleteCallback?: (session: FocusSessionWithTask, elapsed: number) => void
) {
  const [session, setSession] = useState<FocusSessionWithTask | null>(initialSession);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!initialSession) return 2700;
    return calculateRemainingSeconds({
      startTimestampMs: new Date(initialSession.startedAt).getTime(),
      plannedDurationSeconds: initialSession.plannedDuration,
      accumulatedPausedDurationSeconds: initialSession.pausedDuration,
      isPaused: initialSession.status === "PAUSED",
      pauseStartTimestampMs:
        initialSession.status === "PAUSED"
          ? new Date(initialSession.updatedAt).getTime()
          : null,
    });
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const hasTriggeredCompleteRef = useRef(false);
  const onCompleteRef = useRef(onCompleteCallback);
  onCompleteRef.current = onCompleteCallback;

  // Sync session prop updates
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  // Recalculate time from timestamps
  const evaluateTime = useCallback(() => {
    if (!session || session.status === "COMPLETED" || session.status === "CANCELLED") {
      return;
    }

    const startMs = new Date(session.startedAt).getTime();
    const isPaused = session.status === "PAUSED";
    const pauseStartMs = isPaused ? new Date(session.updatedAt).getTime() : null;

    const remaining = calculateRemainingSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: session.plannedDuration,
      accumulatedPausedDurationSeconds: session.pausedDuration,
      isPaused,
      pauseStartTimestampMs: pauseStartMs,
    });

    const elapsed = calculateActiveElapsedSeconds({
      startTimestampMs: startMs,
      plannedDurationSeconds: session.plannedDuration,
      accumulatedPausedDurationSeconds: session.pausedDuration,
      isPaused,
      pauseStartTimestampMs: pauseStartMs,
    });

    setRemainingSeconds(remaining);
    setElapsedSeconds(elapsed);

    // Persist to localStorage
    try {
      const stored: StoredTimerState = {
        sessionId: session.id,
        taskId: session.learningTaskId,
        taskTitle: session.task?.title ?? "Focus Task",
        startTime: startMs,
        plannedDuration: session.plannedDuration,
        pausedDuration: session.pausedDuration,
        isPaused,
        pauseStartTime: pauseStartMs,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Ignore local storage errors in incognito or restricted environments
    }

    // Auto-complete when remaining reaches 0
    if (remaining <= 0 && !hasTriggeredCompleteRef.current && session.status === "ACTIVE") {
      hasTriggeredCompleteRef.current = true;
      if (onCompleteRef.current) {
        onCompleteRef.current(session, elapsed);
      }
    }
  }, [session]);

  // Interval ticker (250ms for smooth zero-drift display updates)
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") {
      return;
    }

    // Initial evaluation
    evaluateTime();

    const intervalId = setInterval(() => {
      evaluateTime();
    }, 250);

    return () => clearInterval(intervalId);
  }, [session, evaluateTime]);

  // Visibility and window focus handlers (resilient background recovery)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        evaluateTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [evaluateTime]);

  // Tab synchronization with BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel("learntrack_timer");

    channel.onmessage = (event) => {
      if (event.data?.type === "TIMER_UPDATED" && event.data?.session) {
        setSession(event.data.session);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Update browser document title dynamically
  useEffect(() => {
    if (!session) return;

    const taskTitle = session.task?.title || "Focus";
    const timeDisplay = formatTimerDisplay(remainingSeconds);

    if (session.status === "ACTIVE") {
      document.title = `${timeDisplay} — ${taskTitle} | LearnTrack`;
    } else if (session.status === "PAUSED") {
      document.title = `[PAUSED] ${timeDisplay} — ${taskTitle}`;
    } else if (session.status === "COMPLETED") {
      document.title = `🔔 Focus Complete! Log Your Learnings`;
    }

    return () => {
      document.title = "LearnTrack — Self-Directed Learning Platform";
    };
  }, [session, remainingSeconds]);

  // Broadcast session changes
  const updateSessionState = (newSession: FocusSessionWithTask | null) => {
    setSession(newSession);
    if (!newSession || newSession.status === "COMPLETED" || newSession.status === "CANCELLED") {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("learntrack_timer");
        channel.postMessage({ type: "TIMER_UPDATED", session: newSession });
        channel.close();
      } catch {
        // Ignore
      }
    }
  };

  const progressPercentage = session
    ? calculateProgressPercentage(elapsedSeconds, session.plannedDuration)
    : 0;

  return {
    session,
    setSession: updateSessionState,
    remainingSeconds,
    elapsedSeconds,
    formattedTime: formatTimerDisplay(remainingSeconds),
    progressPercentage,
    isRunning: session?.status === "ACTIVE",
    isPaused: session?.status === "PAUSED",
    isCompleted: session?.status === "COMPLETED",
    isCancelled: session?.status === "CANCELLED",
  };
}
