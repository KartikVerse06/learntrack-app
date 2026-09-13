"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Timer,
  CheckCircle2,
  BookOpen,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate, formatDateToISO } from "@/lib/date-utils";
import type { TaskWithCategory } from "@/types";

interface TaskDetailsDialogProps {
  task: TaskWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: TaskWithCategory) => void;
  onDelete?: (task: TaskWithCategory) => void;
}

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TaskDetailsDialogProps) {
  if (!task) return null;

  const plannedDateStr = formatDateToISO(new Date(task.plannedDate));
  const formattedDate = formatDisplayDate(plannedDateStr);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border ${currentPriority.border} ${currentPriority.color}`}
            >
              {currentPriority.label}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold leading-snug text-foreground">
            {task.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Scheduled for {formattedDate}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-4 py-3 text-sm">
          {/* 45-Minute Focus Block Progress Banner */}
          <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>45-Minute Focus Blocks</span>
              </span>
              <span className="font-mono text-foreground">
                {task.completedSessions} of {task.estimatedSessions} Completed ({task.completedSessions * 45} / {task.estimatedSessions * 45} min)
              </span>
            </div>

            {/* Block circles */}
            <div className="flex items-center gap-2 pt-1">
              {Array.from({ length: task.estimatedSessions }).map((_, index) => {
                const isDone = index < task.completedSessions;
                return (
                  <div
                    key={index}
                    className={`h-4 w-4 rounded-full transition-all ${
                      isDone
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                        : "border-2 border-muted-foreground/30 bg-muted/50"
                    }`}
                    title={`Session block ${index + 1}: ${isDone ? "Completed" : "Pending"}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Description & Study Notes */}
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Study Notes & Resources</span>
            </h5>
            {task.description ? (
              <div className="p-3.5 rounded-xl border bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {task.description}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed bg-muted/10 text-xs text-muted-foreground italic flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground/60" />
                <span>No study notes or resource links attached to this topic.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t">
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(task);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(task);
                }}
                className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {task.status !== "FULLY_COMPLETED" && (
              <Button asChild size="sm" variant="focus" className="gap-1.5 text-xs">
                <Link href={`/focus?taskId=${task.id}`}>
                  <Timer className="h-3.5 w-3.5" />
                  <span>{task.status === "IN_PROGRESS" ? "Resume Focus" : "Start Focus"}</span>
                </Link>
              </Button>
            )}
            {task.status === "FULLY_COMPLETED" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Mastered</span>
              </span>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
