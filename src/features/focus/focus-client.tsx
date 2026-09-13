"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Timer,
  Volume2,
  VolumeX,
  Bell,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FocusSessionWithTask } from "@/server/repositories/focus-session-repository";
import type { TaskWithCategory } from "@/server/repositories/learning-task-repository";
import { useFocusTimer } from "./use-focus-timer";
import {
  startFocusAction,
  pauseFocusAction,
  resumeFocusAction,
  completeFocusAction,
  cancelFocusAction,
} from "@/server/actions/focus-actions";
import { soundManager, type SoundChoice } from "@/lib/sound";
import {
  requestNotificationPermission,
  dispatchSessionCompletionNotification,
  startTitleFlashing,
} from "@/lib/notifications";

import { LearningLogModal } from "@/features/learning-logs/learning-log-modal";
import type { LearningLogWithRelations } from "@/server/repositories/learning-log-repository";

interface FocusClientProps {
  initialSession: FocusSessionWithTask | null;
  selectedTask?: TaskWithCategory | null;
  availableTasks?: TaskWithCategory[];
}

export function FocusClient({
  initialSession,
  selectedTask,
  availableTasks = [],
}: FocusClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states for user confirmation
  const [showFinishEarlyDialog, setShowFinishEarlyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio preference local toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundChoice] = useState<SoundChoice>("bell");
  const setSessionRef = useRef<((s: FocusSessionWithTask | null) => void) | null>(null);

  // Handle completion event triggered by the timer or manually
  const handleSessionCompleted = useCallback(
    async (completedSession: FocusSessionWithTask, elapsed: number) => {
      // 1. Play audio chime
      soundManager.play({ enabled: soundEnabled, choice: soundChoice, volume: 0.8 });

      // 2. Dispatch desktop notification
      const taskTitle = completedSession.task?.title || "Topic";
      dispatchSessionCompletionNotification(taskTitle);

      // 3. Oscillate document title if tab is inactive
      startTitleFlashing(document.title);

      // 4. Server-side session completion & task progression
      const durationToPersist = Math.max(1, elapsed);
      const res = await completeFocusAction({
        sessionId: completedSession.id,
        actualDuration: durationToPersist,
      });

      if (res.success) {
        setSessionRef.current?.(res.data);
        setShowLogModal(true);
      } else if (res.error) {
        setErrorMessage(res.error.message);
      }
    },
    [soundEnabled, soundChoice]
  );

  const {
    session,
    setSession,
    remainingSeconds,
    elapsedSeconds,
    formattedTime,
    progressPercentage,
    isPaused,
    isCompleted,
    isCancelled,
  } = useFocusTimer(initialSession, handleSessionCompleted);
  setSessionRef.current = setSession;

  // Circular progress ring dimensions
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Control action handlers
  const handleStartSession = (taskId: string) => {
    setErrorMessage(null);
    // Pre-unlock HTML5 audio context and request notification on user gesture
    soundManager.initialize(soundChoice);
    requestNotificationPermission().catch(() => {});

    startTransition(async () => {
      const res = await startFocusAction({ taskId });
      if (res.success) {
        setSession(res.data);
        router.refresh();
      } else {
        setErrorMessage(res.error?.message || "Failed to start focus session.");
      }
    });
  };

  const handlePause = () => {
    if (!session) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await pauseFocusAction({ sessionId: session.id });
      if (res.success) {
        setSession(res.data);
      } else {
        setErrorMessage(res.error?.message || "Failed to pause session.");
      }
    });
  };

  const handleResume = () => {
    if (!session) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await resumeFocusAction({ sessionId: session.id });
      if (res.success) {
        setSession(res.data);
      } else {
        setErrorMessage(res.error?.message || "Failed to resume session.");
      }
    });
  };

  const handleConfirmFinishEarly = () => {
    if (!session) return;
    setShowFinishEarlyDialog(false);
    startTransition(async () => {
      await handleSessionCompleted(session, Math.max(1, elapsedSeconds));
    });
  };

  const handleConfirmCancel = () => {
    if (!session) return;
    setShowCancelDialog(false);
    startTransition(async () => {
      const res = await cancelFocusAction({ sessionId: session.id });
      if (res.success) {
        setSession(res.data);
      } else {
        setErrorMessage(res.error?.message || "Failed to cancel session.");
      }
    });
  };

  // -------------------------------------------------------------
  // STATE 1: SESSION COMPLETED
  // -------------------------------------------------------------
  if (session && isCompleted) {
    const task = session.task;
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-xl mx-auto py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
        <Card className="w-full p-8 shadow-xl border-emerald-500/30 bg-card/95 backdrop-blur">
          <CardContent className="flex flex-col items-center space-y-6 p-0">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <Badge variant="focus" className="px-3 py-1 text-xs">
                Focus Session Completed
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                45-Minute Focus Block Complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                Deliberate study on <strong className="text-foreground">{task?.title}</strong> has been logged.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full py-4 border-y border-border/60 text-left">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Active Duration
                </span>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {Math.round((session.actualDuration || elapsedSeconds) / 60)} minutes
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Task Progress
                </span>
                <p className="text-lg font-semibold text-foreground">
                  {task ? `${task.completedSessions} / ${task.estimatedSessions} sessions` : "Completed"}
                </p>
              </div>
            </div>

            {/* Learning Log Prompt */}
            <div className="w-full bg-primary/5 rounded-lg p-3.5 text-xs text-foreground text-left flex items-start gap-2.5 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Reflect & Retain Knowledge</strong>
                Synthesize core mental models, practical outputs, doubts, and confidence score.
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-2">
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2 shadow-md"
                onClick={() => setShowLogModal(true)}
              >
                <Sparkles className="h-4 w-4" />
                <span>Record Learning Log</span>
              </Button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleStartSession(session.learningTaskId)}
                  disabled={isPending}
                >
                  <Play className="h-4 w-4" />
                  <span>Start Another Session</span>
                </Button>
                <Link href="/planner" className="w-full">
                  <Button variant="secondary" className="w-full gap-2">
                    <span>Return to Planner</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <LearningLogModal
              open={showLogModal}
              onOpenChange={setShowLogModal}
              taskId={session.learningTaskId}
              sessionId={session.id}
              taskTitle={task?.title || "Focus Topic"}
              taskCategory={task?.category}
              onSuccess={(log, nextAction) => {
                setShowLogModal(false);
                if (nextAction === "another_session") {
                  handleStartSession(session.learningTaskId);
                } else if (nextAction === "view_task") {
                  router.push(`/tasks/${session.learningTaskId}`);
                } else {
                  router.push("/planner");
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: ACTIVE OR PAUSED FOCUS TIMER
  // -------------------------------------------------------------
  if (session && !isCancelled) {
    const task = session.task;
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-2xl mx-auto py-4 px-4 space-y-6">
        {errorMessage && (
          <div className="w-full p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Task Context Strip */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            {task?.category && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                  borderColor: `${task.category.color}30`,
                }}
              >
                {task.category.name}
              </Badge>
            )}
            <Badge variant={isPaused ? "priorityMedium" : "focus"} className="text-xs">
              {isPaused ? "PAUSED" : "ACTIVE FOCUS"}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground line-clamp-1">
            {task?.title || "Deliberate Practice"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Single-task deliberate study • 45 minutes
          </p>
        </div>

        {/* Central Circular Progress Clock */}
        <div className="relative flex items-center justify-center py-1 sm:py-4">
          <svg
            className="w-[210px] h-[210px] xs:w-[250px] xs:h-[250px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] max-w-[80vw] max-h-[36vh] -rotate-90"
            viewBox="0 0 300 300"
          >
            {/* Background Track */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-muted fill-transparent"
              strokeWidth="10"
            />
            {/* Progress Stroke */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className={`fill-transparent transition-all duration-500 ease-out ${
                isPaused
                  ? "stroke-amber-500"
                  : "stroke-emerald-600 dark:stroke-emerald-500"
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time & State Overlay */}
          <div className="absolute flex flex-col items-center justify-center space-y-1 text-center">
            <span
              className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-mono font-extrabold tracking-tighter text-foreground tabular-nums select-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {formattedTime}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  isPaused
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span>{isPaused ? "Paused" : `${progressPercentage}% elapsed`}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar - Exact Mobile Hierarchy: [ Pause ] -> [ Finish Early ] -> [ Cancel ] */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-sm">
          {isPaused ? (
            <Button
              size="lg"
              variant="default"
              className="w-full sm:flex-1 gap-2 text-sm sm:text-base font-semibold shadow-md min-h-[48px]"
              onClick={handleResume}
              disabled={isPending}
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Resume</span>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:flex-1 gap-2 text-sm sm:text-base font-semibold shadow-sm min-h-[48px]"
              onClick={handlePause}
              disabled={isPending}
            >
              <Pause className="h-5 w-5 fill-current" />
              <span>Pause</span>
            </Button>
          )}

          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto sm:flex-initial gap-1.5 text-xs sm:text-sm font-semibold min-h-[44px]"
            onClick={() => setShowFinishEarlyDialog(true)}
            disabled={isPending}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Finish Early</span>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full sm:w-auto sm:flex-initial text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs sm:text-sm font-medium min-h-[44px]"
            onClick={() => setShowCancelDialog(true)}
            disabled={isPending}
          >
            <XCircle className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
        </div>

        {/* Audio Toggle & Metadata Strip */}
        <div className="flex items-center justify-between w-full max-w-md px-4 py-2 text-xs text-muted-foreground border rounded-lg bg-card/50">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-emerald-600" />
            <span>
              Elapsed: <strong>{Math.floor(elapsedSeconds / 60)}m</strong> of 45m
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            title={soundEnabled ? "Mute completion chime" : "Enable completion chime"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chime Off</span>
              </>
            )}
          </button>
        </div>

        {/* Confirm Finish Early Dialog */}
        <Dialog open={showFinishEarlyDialog} onOpenChange={setShowFinishEarlyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finish Focus Session Early?</DialogTitle>
              <DialogDescription>
                You have focused for {Math.max(1, Math.round(elapsedSeconds / 60))} minutes.
                Would you like to complete and record this deliberate study session?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowFinishEarlyDialog(false)}
                disabled={isPending}
              >
                Continue Focusing
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmFinishEarly}
                disabled={isPending}
              >
                Log Completed Time
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discard Focus Session?</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this focus block? Elapsed time will not be recorded in your task statistics.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={isPending}
              >
                Keep Session
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isPending}
              >
                Discard Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: READY TO START (TASK SELECTED)
  // -------------------------------------------------------------
  if (selectedTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-xl mx-auto py-8 px-4 text-center">
        {errorMessage && (
          <div className="w-full p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {errorMessage}
          </div>
        )}

        <Card className="w-full p-8 shadow-md border-emerald-200/60 dark:border-emerald-950/60">
          <CardContent className="flex flex-col items-center space-y-6 p-0">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Timer className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                {selectedTask.category && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${selectedTask.category.color}15`,
                      color: selectedTask.category.color,
                    }}
                  >
                    {selectedTask.category.name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {selectedTask.completedSessions} / {selectedTask.estimatedSessions} Blocks
                </Badge>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {selectedTask.title}
              </h2>
              {selectedTask.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-md mx-auto">
                  {selectedTask.description}
                </p>
              )}
            </div>

            <div className="text-7xl font-mono font-bold tracking-tight text-foreground tabular-nums py-2">
              45:00
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
              <Button
                size="lg"
                variant="default"
                className="w-full gap-2 text-base font-semibold shadow-md"
                onClick={() => handleStartSession(selectedTask.id)}
                disabled={isPending}
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Start Focus Block</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Bell className="h-3.5 w-3.5 text-emerald-600" />
              <span>Chime alert and browser notification upon completion</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: DIRECT ACCESS EMPTY STATE (NO ACTIVE SESSION & NO TASK)
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-xl mx-auto py-8 px-4 text-center space-y-6">
      {errorMessage && (
        <div className="w-full p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <Timer className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          No Active Focus Session
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          LearnTrack enforces deliberate single-task practice. Select a learning task from your daily agenda to launch a 45-minute focus block.
        </p>
      </div>

      {availableTasks.length > 0 ? (
        <div className="w-full space-y-3 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-left">
            Today&apos;s Planned Topics
          </span>
          <div className="space-y-2 text-left">
            {availableTasks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:border-emerald-500/50 transition-colors"
              >
                <div className="space-y-0.5 pr-3">
                  <div className="flex items-center gap-2">
                    {t.category && (
                      <span
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${t.category.color}15`,
                          color: t.category.color,
                        }}
                      >
                        {t.category.name}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground line-clamp-1">
                      {t.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.completedSessions} of {t.estimatedSessions} sessions completed
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 shrink-0"
                  onClick={() => handleStartSession(t.id)}
                  disabled={isPending}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Focus</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <Link href="/planner">
            <Button size="lg" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>Go to Daily Planner</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
