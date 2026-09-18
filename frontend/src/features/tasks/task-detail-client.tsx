"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Timer,
  CheckCircle2,
  BookOpen,
  Tag,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Loader2,
  Sparkles,
  History,
  HelpCircle,
  CheckCircle,
  Award,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { DeleteTaskDialog } from "@/features/tasks/delete-task-dialog";
import { toggleTaskStatusApi } from "@/lib/api/tasks";
import { markTopicAsLearnedApi } from "@/lib/api/revisions";
import { getClientAuthToken, ensureClientAuthToken } from "@/lib/api/client";
import { ActiveRecallDrawer } from "@/features/revisions/active-recall-drawer";
import { formatDisplayDate, formatDateToISO } from "@/lib/date-utils";
import type { TaskWithDetails, Category } from "@/types";

type TabType = "overview" | "history" | "logs" | "roadmap";

interface TaskDetailClientProps {
  task: TaskWithDetails;
  categories: Category[];
}

export function TaskDetailClient({ task, categories }: TaskDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isMarkLearnedOpen, setIsMarkLearnedOpen] = useState(false);
  const [isMarkingLearned, setIsMarkingLearned] = useState(false);
  const [activeRecallRevId, setActiveRecallRevId] = useState<string | null>(null);
  const [isRecallDrawerOpen, setIsRecallDrawerOpen] = useState(false);

  const handleMarkAsLearned = async () => {
    setIsMarkingLearned(true);
    const token = getClientAuthToken() || await ensureClientAuthToken();
    const res = await markTopicAsLearnedApi(task.id, token || undefined);
    setIsMarkingLearned(false);
    if (res.success) {
      setIsMarkLearnedOpen(false);
      setActiveTab("roadmap");
      router.refresh();
    }
  };

  const plannedDateStr = formatDateToISO(new Date(task.plannedDate));
  const formattedPlannedDate = formatDisplayDate(plannedDateStr);
  const formattedCreatedDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedUpdatedDate = new Date(task.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const priorityLabels: Record<string, { label: string; color: string; border: string }> = {
    HIGH: { label: "High Priority", color: "text-red-600 dark:text-red-400", border: "border-red-500/30 bg-red-500/10" },
    MEDIUM: { label: "Medium Priority", color: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30 bg-amber-500/10" },
    LOW: { label: "Low Priority", color: "text-slate-600 dark:text-slate-400", border: "border-slate-500/30 bg-slate-500/10" },
  };

  const statusVariantMap: Record<
    string,
    "default" | "revision" | "outline" | "focus" | "secondary"
  > = {
    PLANNED: "outline",
    IN_PROGRESS: "default",
    LEARNING_COMPLETED: "focus",
    REVISION_PENDING: "revision",
    FULLY_COMPLETED: "focus",
  };

  const currentPriority = priorityLabels[task.priority] || priorityLabels.MEDIUM;

  const handleToggleStatus = async () => {
    try {
      setIsTogglingStatus(true);
      let token = getClientAuthToken();
      if (!token) {
        token = await ensureClientAuthToken();
      }
      if (!token) return;

      const res = await toggleTaskStatusApi(task.id, token);
      if (res.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteSuccess = () => {
    router.push("/planner");
    router.refresh();
  };

  const confidenceLabels: Record<number, string> = {
    1: "Very Low",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Very High",
  };

  // Milestone intervals for spaced revisions
  const milestones = [
    { number: 1, name: "Revision 1", offset: "Day 0 (Same Day)", desc: "Immediate active recall consolidation before sleep" },
    { number: 2, name: "Revision 2", offset: "Day +3", desc: "Halt initial steep forgetting curve decay" },
    { number: 3, name: "Revision 3", offset: "Day +15", desc: "Long-term memory retention reinforcement" },
    { number: 4, name: "Revision 4", offset: "Day +30", desc: "Permanent retention & topic mastery verification" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/planner"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Daily Planner</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[240px] sm:max-w-md">
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {task.category && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border"
                style={{
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                  borderColor: `${task.category.color}40`,
                }}
              >
                <Tag className="h-3 w-3" />
                <span>{task.category.name}</span>
              </span>
            )}
            <Badge
              variant={statusVariantMap[task.status] || "outline"}
              className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5"
            >
              {task.status.replace(/_/g, " ")}
            </Badge>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded border ${currentPriority.border} ${currentPriority.color}`}
            >
              {currentPriority.label}
            </span>
          </div>

          {/* Primary Call to Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0">
            {(task.status === "PLANNED" || task.status === "IN_PROGRESS") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className="h-10 min-h-[42px] gap-1.5 text-xs flex-1 sm:flex-initial justify-center font-medium"
              >
                {isTogglingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : task.status === "PLANNED" ? (
                  <PlayCircle className="h-4 w-4 text-primary" />
                ) : (
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  {task.status === "PLANNED" ? "In Progress" : "Planned"}
                </span>
              </Button>
            )}

            {task.status !== "FULLY_COMPLETED" && (
              <Button asChild size="sm" variant="focus" className="h-10 min-h-[44px] gap-2 text-xs font-semibold flex-1 sm:flex-initial justify-center shadow-xs">
                <Link href={`/focus?taskId=${task.id}`}>
                  <Timer className="h-4 w-4" />
                  <span>
                    {task.status === "IN_PROGRESS" ? "Resume Focus" : "Start 45m Focus"}
                  </span>
                </Link>
              </Button>
            )}

            {task.status !== "FULLY_COMPLETED" && task.status !== "REVISION_PENDING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMarkLearnedOpen(true)}
                className="h-10 min-h-[42px] gap-1.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-900 dark:hover:bg-purple-950/30 font-medium justify-center flex-1 sm:flex-initial"
              >
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Mark as Learned</span>
              </Button>
            )}

            {task.status === "FULLY_COMPLETED" && (
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Topic Mastered</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">
          {task.title}
        </h1>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Planned: <strong className="text-foreground">{formattedPlannedDate}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Created: {formattedCreatedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Updated: {formattedUpdatedDate}</span>
          </div>
        </div>
      </div>

      {/* Tab Controls Bar - Scrollable on mobile */}
      <div className="flex items-center gap-1 border-b pb-px overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-[38px] ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview & Notes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-[38px] flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Focus History ({task.focusSessions.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "logs"}
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Learning Logs</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-muted text-muted-foreground">
            {task.learningLogs.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "roadmap"}
          onClick={() => setActiveTab("roadmap")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === "roadmap"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Revision Roadmap</span>
        </button>
      </div>

      {/* Tab Panels */}

      {/* TAB 1: OVERVIEW & NOTES */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in-50 duration-150" role="tabpanel">
          {/* Left Column (2/3): Study Notes */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Study Notes & Objectives</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Context, key references, and links planned for this study unit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <div className="rounded-lg bg-muted/20 border p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {task.description}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
                    <span>No study notes attached to this topic yet.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditOpen(true)}
                      className="mt-2 text-xs"
                    >
                      Add Study Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3): 45m Block Progress Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>45-Minute Focus Blocks</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Estimated vs completed deliberate study blocks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Session Progress:</span>
                  <span className="font-bold font-mono text-foreground">
                    {task.completedSessions} / {task.estimatedSessions} Blocks
                  </span>
                </div>

                {/* Block Circles Tracker */}
                <div className="flex items-center gap-2 py-1">
                  {Array.from({ length: task.estimatedSessions }).map((_, idx) => {
                    const isDone = idx < task.completedSessions;
                    return (
                      <div
                        key={idx}
                        className={`h-4 w-4 rounded-full transition-all ${
                          isDone
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                            : "border-2 border-muted-foreground/30 bg-muted/50"
                        }`}
                        title={`Block ${idx + 1}: ${isDone ? "Completed" : "Pending"}`}
                      />
                    );
                  })}
                </div>

                <div className="p-3 rounded-lg border bg-muted/30 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Focus Time:</span>
                    <span className="font-bold text-foreground">{task.totalFocusMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Focus Time:</span>
                    <span className="font-bold text-foreground">{task.estimatedSessions * 45} min</span>
                  </div>
                </div>

                {task.status !== "FULLY_COMPLETED" && (
                  <Button asChild variant="focus" className="w-full gap-2 text-xs">
                    <Link href={`/focus?taskId=${task.id}`}>
                      <Timer className="h-4 w-4" />
                      <span>Start 45m Focus Session</span>
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: FOCUS HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150" role="tabpanel">
          {task.focusSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center border-dashed">
                <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No Focus Sessions Recorded Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Deliberate study blocks of 45 minutes will appear here with actual timestamps and duration logs.
                </p>
                <Button asChild size="sm" variant="focus">
                  <Link href={`/focus?taskId=${task.id}`}>
                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                    <span>Start First Session</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {task.focusSessions.map((session, index) => {
                const matchingLog = task.learningLogs.find(
                  (l) => l.focusSessionId === session.id
                );

                return (
                  <div
                    key={session.id}
                    className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">
                          Session #{task.focusSessions.length - index}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        Started: {new Date(session.startedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded bg-muted/40 border">
                        Actual: {Math.round(session.actualDuration / 60)} min ({session.actualDuration}s)
                      </span>
                      <span className="text-muted-foreground">
                        Planned: {Math.round(session.plannedDuration / 60)} min
                      </span>
                      {matchingLog ? (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary gap-1">
                          <Link href={`/learning-logs/${matchingLog.id}`}>
                            <span>View Log</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      ) : session.status === "COMPLETED" ? (
                        <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/5">
                          <Link href={`/learning-logs?sessionId=${session.id}`}>
                            <Sparkles className="h-3 w-3" />
                            <span>Log Learning</span>
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEARNING LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150" role="tabpanel">
          {(() => {
            const unlogged = task.focusSessions.find(
              (s) => s.status === "COMPLETED" && !task.learningLogs.some((l) => l.focusSessionId === s.id)
            );
            if (!unlogged) return null;
            return (
              <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">You have a completed focus session ready for reflection.</span>
                </div>
                <Button asChild size="sm" className="h-7 text-xs gap-1 shrink-0">
                  <Link href={`/learning-logs?sessionId=${unlogged.id}`}>
                    <span>Log Learning</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            );
          })()}

          {task.learningLogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center border-dashed">
                <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No Learning Reflections Recorded</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Upon finishing a 45-minute focus session, you will be prompted to capture what you learned, what you completed, any doubts, and a 1–5 confidence score.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {task.learningLogs.map((log, index) => (
                <Card key={log.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/10 pb-3 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">
                          Reflection #{task.learningLogs.length - index}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          <span>Confidence:</span>
                          <span>{log.confidence}/5 — {confidenceLabels[log.confidence] || "Moderate"}</span>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary">
                          <Link href={`/learning-logs/${log.id}`}>
                            <span>Full View</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                    <div>
                      <h5 className="font-bold text-foreground mb-1">What Did I Learn?</h5>
                      <p className="p-3 rounded-md bg-muted/20 text-muted-foreground whitespace-pre-wrap">
                        {log.whatLearned}
                      </p>
                    </div>

                    {log.whatCompleted && (
                      <div>
                        <h5 className="font-bold text-foreground mb-1">What Did I Complete?</h5>
                        <p className="p-2.5 rounded-md bg-muted/10 text-muted-foreground">
                          {log.whatCompleted}
                        </p>
                      </div>
                    )}

                    {log.doubts && (
                      <div>
                        <h5 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Unresolved Doubts & Questions</span>
                        </h5>
                        <p className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                          {log.doubts}
                        </p>
                      </div>
                    )}

                    {log.notes && (
                      <div>
                        <h5 className="font-bold text-foreground mb-1">Reference Notes</h5>
                        <p className="p-2.5 rounded-md bg-muted/10 text-muted-foreground whitespace-pre-wrap">
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REVISION ROADMAP */}
      {activeTab === "roadmap" && (
        <div className="space-y-6 animate-in fade-in-50 duration-150" role="tabpanel">
          {/* Milestone Step Progress Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span>4-Stage Spaced Revision Schedule</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Automated 30-day retention intervals designed to beat the forgetting curve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.revisions.length === 0 && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>Ready to initiate your 30-day revision cycle?</span>
                    </p>
                    <p className="text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                      Once initial study is finished, mark this topic as learned to schedule Day 0, +3, +15, and +30 checkpoints.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsMarkLearnedOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Mark as Learned</span>
                  </Button>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {milestones.map((m) => {
                  const existingRev = task.revisions.find((r) => r.revisionNumber === m.number);
                  const isCompleted = existingRev?.status === "COMPLETED";

                  return (
                    <div
                      key={m.number}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        isCompleted
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                          : existingRev
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-muted/20 border-muted"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {m.name}
                          </span>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border">
                              {existingRev?.status || "Scheduled"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-foreground pt-1">
                          {m.offset}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                          {m.desc}
                        </p>
                      </div>

                      {existingRev && (
                        <div className="border-t pt-2 mt-1 flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-mono text-muted-foreground text-[10px]">
                            {new Date(existingRev.scheduledDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <Button
                            size="sm"
                            variant={isCompleted ? "outline" : "default"}
                            onClick={() => {
                              setActiveRecallRevId(existingRev.id);
                              setIsRecallDrawerOpen(true);
                            }}
                            className={`h-6 text-[10px] px-2 gap-1 ${
                              isCompleted
                                ? "text-muted-foreground"
                                : "bg-purple-600 hover:bg-purple-700 text-white font-medium"
                            }`}
                          >
                            <BrainCircuit className="h-3 w-3" />
                            <span>{isCompleted ? "View" : "Review"}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Topic Mastery Summary */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Topic Mastery Rule (`FULLY_COMPLETED`)</span>
                  {task.status === "FULLY_COMPLETED" ? (
                    <Badge variant="focus" className="text-xs">
                      Mastery Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      In Progress ({task.revisions.filter((r) => r.status === "COMPLETED").length} / 4 Revisions)
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Per the LearnTrack domain invariants, a learning task transitions to <strong>FULLY_COMPLETED</strong> only when initial deliberate study is finished and all 4 spaced repetition checkpoints (Day 0, Day +3, Day +15, Day +30) are individually completed with active recall.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Topic as Learned Confirmation Dialog */}
      <Dialog open={isMarkLearnedOpen} onOpenChange={setIsMarkLearnedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Mark Topic as Learned?</span>
            </DialogTitle>
            <DialogDescription>
              Finish initial deliberate study for &ldquo;{task.title}&rdquo; and initiate the 4-stage automated spaced revision schedule:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs space-y-2">
            <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 font-mono text-[11px]">
              <div>• <strong>Revision 1:</strong> Day 0 (Same day consolidation)</div>
              <div>• <strong>Revision 2:</strong> Day +3 (Decay interception)</div>
              <div>• <strong>Revision 3:</strong> Day +15 (Intermediate retrieval)</div>
              <div>• <strong>Revision 4:</strong> Day +30 (Mastery verification)</div>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Note: The topic status will advance to <strong>REVISION_PENDING</strong>. It achieves <strong>FULLY_COMPLETED</strong> only after all 4 revisions are finished.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMarkLearnedOpen(false)}
              disabled={isMarkingLearned}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleMarkAsLearned}
              disabled={isMarkingLearned}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-medium"
            >
              {isMarkingLearned ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scheduling 4 Milestones...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Confirm & Start 30-Day Cycle</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Recall Drawer */}
      <ActiveRecallDrawer
        open={isRecallDrawerOpen}
        onOpenChange={setIsRecallDrawerOpen}
        revisionId={activeRecallRevId}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Edit Dialog */}
      <TaskFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        defaultDate={plannedDateStr}
        categories={categories}
        taskToEdit={task}
        onSuccess={() => {
          setIsEditOpen(false);
          router.refresh();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        task={task}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
