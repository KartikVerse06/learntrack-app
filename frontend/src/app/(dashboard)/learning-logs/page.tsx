import Link from "next/link";
import { Sparkles, Calendar, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getFocusSessionByIdApi } from "@/lib/api/focus";
import {
  getLearningLogForSessionApi,
  getUnloggedSessionsApi,
} from "@/lib/api/logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LearningLogPageClient } from "@/features/learning-logs/learning-log-page-client";

interface LearningLogsPageProps {
  searchParams?: {
    sessionId?: string;
  };
}

export const metadata = {
  title: "Learning Log — LearnTrack",
  description: "Record post-focus learning synthesis and confidence rating",
};

export default async function LearningLogsPage({ searchParams }: LearningLogsPageProps) {
  const { token } = await requireAuth();
  const sessionId = searchParams?.sessionId;

  // Scenario 1: Direct link with sessionId
  if (sessionId) {
    const sessionRes = await getFocusSessionByIdApi(sessionId, token);
    const session = sessionRes.success && sessionRes.data ? sessionRes.data : null;

    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Focus Session Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The requested focus session does not exist or belongs to another user account.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/planner">Return to Daily Planner</Link>
          </Button>
        </div>
      );
    }

    // Check if log already exists for this session
    const logRes = await getLearningLogForSessionApi(sessionId, token);
    const existingLog = logRes.success && logRes.data ? logRes.data : null;
    if (existingLog) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Learning Log Already Recorded</h2>
          <p className="text-xs text-muted-foreground">
            You have already synthesized what you learned for this deliberate study block.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button asChild size="sm" variant="default">
              <Link href={`/learning-logs/${existingLog.id}`}>
                <span>View Learning Log</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/tasks/${session.learningTaskId}`}>View Task</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Check if session is not yet completed
    if (session.status !== "COMPLETED") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Focus Block Still Incomplete</h2>
          <p className="text-xs text-muted-foreground">
            Learning reflections can only be recorded once the 45-minute focus session reaches completion.
          </p>
          <Button asChild size="sm" variant="focus">
            <Link href="/focus">Resume Focus Session</Link>
          </Button>
        </div>
      );
    }

    // Render Learning Log entry form
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Learning Session Log</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Transform deliberate focus into long-term retention through active recall reflection.
          </p>
        </div>

        <LearningLogPageClient
          taskId={session.learningTaskId}
          sessionId={session.id}
          taskTitle={session.task.title}
          taskCategory={session.task.category}
        />
      </div>
    );
  }

  // Scenario 2: No sessionId provided - check for unlogged completed sessions
  const pendingRes = await getUnloggedSessionsApi(token);
  const pendingSessions = pendingRes.success && pendingRes.data ? pendingRes.data : [];

  if (pendingSessions.length > 0) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Pending Learning Logs</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            You have completed focus sessions awaiting learning reflections.
          </p>
        </div>

        <div className="space-y-3">
          {pendingSessions.map((session) => (
            <Card key={session.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    {session.task.category && (
                      <span
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${session.task.category.color}15`,
                          color: session.task.category.color,
                        }}
                      >
                        {session.task.category.name}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground line-clamp-1">
                      {session.task.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Completed: {new Date(session.endedAt || session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Duration: {Math.round(session.actualDuration / 60)} min
                  </p>
                </div>

                <Button asChild size="sm" className="gap-1.5 shrink-0">
                  <Link href={`/learning-logs?sessionId=${session.id}`}>
                    <span>Log Learning</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Scenario 3: No pending sessions
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-4">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold">No Sessions Awaiting Learning Logs</h2>
        <p className="text-xs text-muted-foreground">
          Complete a 45-minute deliberate focus block to unlock your learning reflection.
        </p>
      </div>
      <Button asChild size="sm" variant="default" className="gap-2">
        <Link href="/planner">
          <Calendar className="h-4 w-4" />
          <span>Go to Daily Planner</span>
        </Link>
      </Button>
    </div>
  );
}
