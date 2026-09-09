import Link from "next/link";
import {
  Timer,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/session";
import { getDailyTaskSummary } from "@/server/repositories/learning-task-repository";
import { getTodayISO } from "@/lib/date-utils";

export default async function DashboardPage() {
  const { userId } = await requireAuth();
  const todayStr = getTodayISO();
  const summary = await getDailyTaskSummary(userId, todayStr);

  const priorityBorders: Record<string, string> = {
    HIGH: "border-l-4 border-l-red-500",
    MEDIUM: "border-l-4 border-l-amber-500",
    LOW: "border-l-4 border-l-slate-400",
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome to LearnTrack
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build consistency through 45-minute focus blocks and structured spaced revisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="default" className="gap-2">
            <Link href="/planner">
              <Plus className="h-4 w-4" />
              <span>Plan Daily Topics</span>
            </Link>
          </Button>
          <Button asChild variant="focus" className="gap-2">
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
            <div className="text-2xl font-bold font-mono">0</div>
            <p className="text-xs text-muted-foreground mt-1">0 overdue</p>
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
            <div className="text-2xl font-bold font-mono">0</div>
            <p className="text-xs text-muted-foreground mt-1">Requires all 4 revisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Split */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Left Column (4/7): Today's Learning Agenda */}
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today&apos;s Learning Agenda</CardTitle>
              <CardDescription>Topics planned for deliberate study today</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
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
                {summary.tasks.map((task) => (
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
                      <p className="text-sm font-semibold text-foreground truncate">
                        {task.title}
                      </p>
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
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Spaced Revisions</CardTitle>
              <CardDescription>Automated 30-day retention checkpoints</CardDescription>
            </div>
            <Badge variant="revision" className="text-xs">
              0 Due
            </Badge>
          </CardHeader>
          <CardContent>
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
                Mark completed topics as learned to automatically generate revision milestones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
