import Link from "next/link";
import {
  Timer,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/session";
import { getTaskSummaryApi } from "@/lib/api/tasks";
import { getRevisionMetricsApi, getRevisionsApi } from "@/lib/api/revisions";
import { getMoneySummaryApi } from "@/lib/api/money";
import { getTodayISO } from "@/lib/date-utils";
import { formatMoney } from "@/lib/money/money-utils";

export default async function DashboardPage() {
  const { token } = await requireAuth();
  const todayStr = getTodayISO();
  const now = new Date();

  const [summaryRes, revMetricsRes, dueRevsRes, moneyRes] = await Promise.all([
    getTaskSummaryApi(todayStr, token),
    getRevisionMetricsApi(token),
    getRevisionsApi("due", undefined, token),
    getMoneySummaryApi(now.getMonth() + 1, now.getFullYear(), token),
  ]);

  const summary = summaryRes.success && summaryRes.data ? summaryRes.data : {
    totalTasks: 0,
    completedTasks: 0,
    plannedSessions: 0,
    completedSessions: 0,
    totalFocusMinutes: 0,
    tasks: [],
  };

  const revisionMetrics = revMetricsRes.success && revMetricsRes.data ? revMetricsRes.data : {
    dueToday: 0,
    overdue: 0,
    totalDue: 0,
    upcoming: 0,
    completed: 0,
    masteredTopicsCount: 0,
  };

  const dueRevisions: any[] = dueRevsRes.success && dueRevsRes.data ? dueRevsRes.data : [];
  const moneySummary = moneyRes.success && moneyRes.data ? moneyRes.data : { budget: null, totalRemaining: 0 };

  const priorityBorders: Record<string, string> = {
    HIGH: "border-l-4 border-l-red-500",
    MEDIUM: "border-l-4 border-l-amber-500",
    LOW: "border-l-4 border-l-slate-400",
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome to LearnTrack
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Build consistency through 45-minute focus blocks and structured spaced revisions.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <Button asChild variant="default" className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm font-semibold shadow-xs">
            <Link href="/planner">
              <Plus className="h-4 w-4" />
              <span>Plan Daily Topics</span>
            </Link>
          </Button>
          <Button asChild variant="focus" className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm font-semibold shadow-xs">
            <Link href="/focus">
              <Timer className="h-4 w-4" />
              <span>Start 45m Focus</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 4-Card Focus & Retention Metrics Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Focus
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {summary.totalFocusMinutes} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {summary.plannedSessions * 45} min ({summary.plannedSessions} sessions)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              45m Sessions
            </CardTitle>
            <Timer className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {summary.completedSessions} / {summary.plannedSessions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completedSessions} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Revisions Due
            </CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-600">
              {revisionMetrics.totalDue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {revisionMetrics.overdue} overdue, {revisionMetrics.dueToday} due today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topics Mastered
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {revisionMetrics.masteredTopicsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires all 4 revisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Money This Month Minimal Indicator */}
      {moneySummary.budget && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-card/60 backdrop-blur-xs gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Money This Month
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {formatMoney(moneySummary.budget.amount)} budget • {formatMoney(moneySummary.totalRemaining)} remaining
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="min-h-[38px] text-xs gap-1.5 shrink-0 w-full sm:w-auto justify-center">
            <Link href="/money">
              <span>View Budget</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Two-Column Split: Stacked on mobile & tablet, 4:3 on desktop */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column (4/7): Today's Learning Agenda */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Today&apos;s Learning Agenda</CardTitle>
              <CardDescription className="text-xs">Topics planned for deliberate study today</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link href="/planner" className="gap-1 text-xs">
                <span>View Planner</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {summary.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed rounded-lg bg-muted/20">
                <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  No learning tasks scheduled for today
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Plan a focused topic to begin your deliberate practice routine.
                </p>
                <Button asChild size="sm" variant="default">
                  <Link href="/planner">Create First Task</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-lg border bg-card/60 flex items-center justify-between gap-3 ${
                      priorityBorders[task.priority]
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.category && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                            style={{
                              backgroundColor: `${task.category.color}15`,
                              color: task.category.color,
                              borderColor: `${task.category.color}40`,
                            }}
                          >
                            {task.category.name}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {task.completedSessions}/{task.estimatedSessions} blocks
                        </span>
                      </div>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors block"
                      >
                        {task.title}
                      </Link>
                    </div>

                    <Button asChild size="sm" variant="focus" className="h-8 text-xs shrink-0">
                      <Link href={`/focus?taskId=${task.id}`}>
                        <Timer className="h-3.5 w-3.5 mr-1" />
                        <span>Start</span>
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (3/7): Due Spaced Revisions */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Spaced Revisions</CardTitle>
              <CardDescription className="text-xs">Automated 30-day retention checkpoints</CardDescription>
            </div>
            <Badge variant="revision" className="text-xs">
              {revisionMetrics.totalDue} Due
            </Badge>
          </CardHeader>
          <CardContent>
            {dueRevisions.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border p-3.5 bg-muted/20 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">4-Interval Progression</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                    <div className="p-1.5 rounded bg-background border">Rev 1: Same Day</div>
                    <div className="p-1.5 rounded bg-background border">Rev 2: Day +3</div>
                    <div className="p-1.5 rounded bg-background border">Rev 3: Day +15</div>
                    <div className="p-1.5 rounded bg-background border">Rev 4: Day +30</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center py-4">
                  No revisions due today. Mark completed topics as learned to initiate their 30-day revision cycle.
                </p>
                <div className="pt-1 text-center">
                  <Button asChild variant="outline" size="sm" className="text-xs gap-1.5 w-full">
                    <Link href="/revisions">
                      <span>Open Revision Center</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dueRevisions.slice(0, 4).map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      rev.isOverdue
                        ? "bg-destructive/5 border-destructive/30"
                        : "bg-purple-500/5 border-purple-500/20"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-background border text-muted-foreground">
                          Rev {rev.revisionNumber}
                        </span>
                        {rev.isOverdue ? (
                          <span className="text-[10px] font-bold text-destructive">
                            {rev.dueLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-purple-600">
                            Due Today
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/tasks/${rev.task.id}`}
                        className="font-semibold text-foreground truncate block hover:text-purple-600 transition-colors"
                      >
                        {rev.task.title}
                      </Link>
                    </div>

                    <Button asChild size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                      <Link href="/revisions">Review</Link>
                    </Button>
                  </div>
                ))}

                <div className="pt-2 text-center">
                  <Button asChild variant="outline" size="sm" className="text-xs gap-1.5 w-full">
                    <Link href="/revisions">
                      <span>View All ({dueRevisions.length}) in Revision Center</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
