"use client";

import Link from "next/link";
import { formatDisplayDate, formatDateToISO } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Star,
  ArrowRight,
} from "lucide-react";
import type { RevisionWithTask } from "@/types";

interface RevisionCardProps {
  revision: RevisionWithTask;
  onReview: (revisionId: string) => void;
}

export function RevisionCard({ revision, onReview }: RevisionCardProps) {
  const milestoneIntervals: Record<number, { name: string; interval: string }> = {
    1: { name: "Revision 1", interval: "Day 0 (Same Day)" },
    2: { name: "Revision 2", interval: "Day +3" },
    3: { name: "Revision 3", interval: "Day +15" },
    4: { name: "Revision 4", interval: "Day +30 (Final)" },
  };

  const info = milestoneIntervals[revision.revisionNumber] || {
    name: `Revision ${revision.revisionNumber}`,
    interval: "Milestone",
  };

  const isCompleted = revision.status === "COMPLETED";
  const schedDateStr = formatDateToISO(new Date(revision.scheduledDate));

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-3 ${
        isCompleted
          ? "bg-emerald-500/5 border-emerald-500/20"
          : revision.isOverdue
          ? "bg-destructive/5 border-destructive/30 shadow-sm"
          : revision.isDueToday
          ? "bg-purple-500/5 border-purple-500/30 shadow-sm"
          : "bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div className="space-y-2">
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {revision.task.category && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${revision.task.category.color}15`,
                  color: revision.task.category.color,
                  borderColor: `${revision.task.category.color}40`,
                }}
              >
                {revision.task.category.name}
              </span>
            )}
            <span className="text-[11px] font-mono font-medium text-muted-foreground">
              {info.name} • {info.interval}
            </span>
          </div>

          {/* Status Badge */}
          {isCompleted ? (
            <Badge variant="focus" className="text-[10px] gap-1 py-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>Completed</span>
            </Badge>
          ) : revision.isOverdue ? (
            <Badge variant="destructive" className="text-[10px] gap-1 py-0.5 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span>{revision.dueLabel || "Overdue"}</span>
            </Badge>
          ) : revision.isDueToday ? (
            <Badge variant="revision" className="text-[10px] gap-1 py-0.5">
              <Clock className="h-3 w-3" />
              <span>Due Today</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {revision.dueLabel || "Scheduled"}
            </Badge>
          )}
        </div>

        {/* Task Title */}
        <div>
          <Link
            href={`/tasks/${revision.task.id}`}
            className="text-base font-semibold text-foreground hover:text-purple-600 transition-colors line-clamp-1"
          >
            {revision.task.title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Scheduled: {formatDisplayDate(schedDateStr)}</span>
          </div>
        </div>

        {/* If completed, show reflection snippet and confidence rating */}
        {isCompleted && (
          <div className="pt-1 text-xs text-muted-foreground space-y-1 border-t mt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Recall Confidence:</span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${
                      (revision.confidence ?? 0) >= s
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            {revision.notes && (
              <p className="line-clamp-2 italic text-[11px] bg-muted/20 p-2 rounded border">
                &ldquo;{revision.notes}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 pt-2.5 border-t mt-1">
        <Button asChild variant="ghost" size="sm" className="h-9 min-h-[38px] text-xs text-muted-foreground hover:text-foreground justify-center xs:justify-start">
          <Link href={`/tasks/${revision.task.id}`} className="gap-1">
            <span>Task Roadmap</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>

        {/* Review Action CTA */}
        <div className="flex items-center justify-end w-full xs:w-auto">
          {isCompleted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReview(revision.id)}
              className="text-xs h-10 min-h-[40px] w-full xs:w-auto gap-1 text-muted-foreground hover:text-foreground justify-center"
            >
              <span>View Review Notes</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onReview(revision.id)}
              className="text-xs h-10 min-h-[42px] w-full xs:w-auto font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs justify-center"
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Start Active Recall</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
