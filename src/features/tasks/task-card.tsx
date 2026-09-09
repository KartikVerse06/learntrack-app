"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Calendar,
  Edit2,
  Trash2,
  Timer,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { moveTaskToTomorrowAction } from "@/server/actions/task-actions";
import { formatDateToISO } from "@/lib/date-utils";
import type { TaskWithCategory } from "@/server/repositories/learning-task-repository";

interface TaskCardProps {
  task: TaskWithCategory;
  onEdit: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [isMoving, setIsMoving] = useState(false);

  const priorityBorders = {
    HIGH: "border-l-4 border-l-red-500",
    MEDIUM: "border-l-4 border-l-amber-500",
    LOW: "border-l-4 border-l-slate-400",
  };

  const priorityLabels = {
    HIGH: "High Priority",
    MEDIUM: "Medium Priority",
    LOW: "Low Priority",
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

  const handleMoveTomorrow = async () => {
    try {
      setIsMoving(true);
      const plannedDateStr = formatDateToISO(new Date(task.plannedDate));
      await moveTaskToTomorrowAction(task.id, plannedDateStr);
    } catch (error) {
      console.error("Failed to move task:", error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div
      className={`group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
        priorityBorders[task.priority]
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {task.category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
                style={{
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                  borderColor: `${task.category.color}40`,
                }}
              >
                {task.category.name}
              </span>
            )}
            <Badge
              variant={statusVariantMap[task.status] || "outline"}
              className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5"
            >
              {task.status.replace("_", " ")}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {priorityLabels[task.priority]}
            </span>
          </div>

          <h4 className="text-base font-semibold text-foreground tracking-tight leading-snug break-words">
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 cursor-pointer">
              <Edit2 className="h-4 w-4 text-muted-foreground" />
              <span>Edit Task</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleMoveTomorrow}
              disabled={isMoving}
              className="gap-2 cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{isMoving ? "Rescheduling..." : "Move to Tomorrow"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task)}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Task</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer Strip: Focus Block Visual Tracker & Start Action */}
      <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3">
        {/* Estimated 45m Focus Session Circles */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>45m blocks:</span>
          </span>
          <div
            className="flex items-center gap-1.5"
            title={`${task.completedSessions} of ${task.estimatedSessions} sessions completed`}
          >
            {Array.from({ length: task.estimatedSessions }).map((_, index) => {
              const isCompleted = index < task.completedSessions;
              return (
                <div
                  key={index}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    isCompleted
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                      : "border-2 border-muted-foreground/30 bg-muted/40"
                  }`}
                />
              );
            })}
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-1">
            ({task.completedSessions}/{task.estimatedSessions})
          </span>
        </div>

        {/* Start Focus / Resume CTA */}
        {task.status !== "FULLY_COMPLETED" && (
          <Button asChild size="sm" variant="focus" className="h-8 gap-1.5 text-xs">
            <Link href={`/focus?taskId=${task.id}`}>
              <Timer className="h-3.5 w-3.5" />
              <span>{task.status === "IN_PROGRESS" ? "Resume Focus" : "Start Focus"}</span>
            </Link>
          </Button>
        )}

        {task.status === "FULLY_COMPLETED" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mastered</span>
          </span>
        )}
      </div>
    </div>
  );
}
