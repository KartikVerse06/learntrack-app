import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Timer,
  Star,
} from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getLearningLogByIdForUser } from "@/server/repositories/learning-log-repository";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONFIDENCE_LEVELS } from "@/features/learning-logs/confidence-selector";

interface LearningLogDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Learning Log Details — LearnTrack",
  description: "Review your post-focus learning reflection and insights",
};

export default async function LearningLogDetailPage({
  params,
}: LearningLogDetailPageProps) {
  const { userId } = await requireAuth();
  const log = await getLearningLogByIdForUser(userId, params.id);

  if (!log) {
    notFound();
  }

  const confidenceInfo =
    CONFIDENCE_LEVELS.find((l) => l.value === log.confidence) || CONFIDENCE_LEVELS[2];

  const formattedDate = new Date(log.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Link href={`/tasks/${log.learningTaskId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Task Details</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
          <Link href="/planner">Daily Planner</Link>
        </Button>
      </div>

      {/* Main Detail Card */}
      <Card className="shadow-md">
        <CardHeader className="border-b pb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {log.task.category && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${log.task.category.color}15`,
                    color: log.task.category.color,
                  }}
                >
                  {log.task.category.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </span>
            </div>

            {/* Confidence Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${confidenceInfo.bgColor}`}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>
                Confidence: {log.confidence}/5 ({confidenceInfo.label})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
              Topic
            </span>
            <Link
              href={`/tasks/${log.learningTaskId}`}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors inline-block"
            >
              {log.task.title}
            </Link>
          </div>

          {/* Session Duration Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono pt-1">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Focus Duration: <strong>{Math.round(log.focusSession.actualDuration / 60)} minutes</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Started: {new Date(log.focusSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-left">
          {/* Section 1: What Did I Learn? */}
          <div className="space-y-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>What Did I Learn?</span>
            </CardTitle>
            <div className="p-4 rounded-lg bg-muted/20 border text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {log.whatLearned}
            </div>
          </div>

          {/* Section 2: What Did I Complete? */}
          {log.whatCompleted && (
            <div className="space-y-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>What Practical Outputs Did I Complete?</span>
              </CardTitle>
              <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs sm:text-sm text-foreground">
                {log.whatCompleted}
              </div>
            </div>
          )}

          {/* Section 3: Open Doubts & Questions */}
          {log.doubts && (
            <div className="space-y-2">
              <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Unresolved Doubts & Questions</span>
              </CardTitle>
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                {log.doubts}
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                These doubts will be highlighted during your upcoming spaced revisions.
              </p>
            </div>
          )}

          {/* Section 4: Reference Notes */}
          {log.notes && (
            <div className="space-y-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Reference Notes & Resources</span>
              </CardTitle>
              <div className="p-3.5 rounded-lg bg-muted/10 border text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {log.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
