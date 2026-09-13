"use client";

import Link from "next/link";
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
import {
  BookOpen,
  BrainCircuit,
  Timer,
  Clock,
  Calendar as CalendarIcon,
  Tag,
  Star,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import type { CalendarEventDTO } from "@/lib/calendar/calendar-event-mapper";
import { formatDisplayDate, formatDateToISO } from "@/lib/date-utils";

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEventDTO | null;
}

export function EventDetailsDialog({
  open,
  onOpenChange,
  event,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const { type, taskId, taskTitle, status, categoryName, categoryColor, priority, revisionNumber, durationMinutes, notes, confidence } = event.extendedProps;

  const typeConfig = {
    TASK: {
      label: "Planned Learning Task",
      icon: BookOpen,
      variant: "default" as const,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    REVISION: {
      label: `Spaced Revision Milestone ${revisionNumber ? `#${revisionNumber}` : ""}`,
      icon: BrainCircuit,
      variant: "revision" as const,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    FOCUS_SESSION: {
      label: "Completed Focus Block",
      icon: Timer,
      variant: "focus" as const,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  }[type];

  const Icon = typeConfig.icon;

  const formattedDate = event.allDay
    ? formatDisplayDate(event.start.slice(0, 10))
    : new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(event.start));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-2 border-b pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant={typeConfig.variant} className="gap-1.5 py-0.5 text-xs font-semibold">
              <Icon className="h-3.5 w-3.5" />
              <span>{typeConfig.label}</span>
            </Badge>

            {categoryName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                  borderColor: `${categoryColor}40`,
                }}
              >
                <Tag className="h-3 w-3" />
                <span>{categoryName}</span>
              </span>
            )}
          </div>

          <DialogTitle className="text-lg font-bold text-foreground break-words pt-1">
            {event.title}
          </DialogTitle>

          <DialogDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Status & Properties Strip */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/20">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current Status
              </p>
              <p className="font-semibold text-foreground mt-0.5 capitalize">
                {String(status).replace(/_/g, " ").toLowerCase()}
              </p>
            </div>

            {priority && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </p>
                <p className="font-semibold text-foreground mt-0.5">{priority}</p>
              </div>
            )}

            {durationMinutes !== undefined && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration
                </p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {durationMinutes} minutes
                </p>
              </div>
            )}

            {revisionNumber !== undefined && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Checkpoint
                </p>
                <p className="font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                  Revision {revisionNumber} of 4
                </p>
              </div>
            )}
          </div>

          {/* Notes or Confidence if applicable */}
          {confidence && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
              <span className="font-medium text-muted-foreground">Recorded Confidence:</span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      confidence >= s ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {notes && (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Reflection Notes:</p>
              <p className="p-2.5 rounded-lg bg-muted/30 border text-muted-foreground italic text-[11px] whitespace-pre-wrap">
                &ldquo;{notes}&rdquo;
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs min-h-[40px] w-full sm:w-auto"
          >
            Close
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {type === "TASK" && (
              <Button asChild size="sm" variant="focus" className="text-xs gap-1.5 min-h-[40px] justify-center">
                <Link href={`/focus?taskId=${taskId}`}>
                  <Timer className="h-3.5 w-3.5" />
                  <span>Start 45m Focus</span>
                </Link>
              </Button>
            )}

            {type === "REVISION" && (
              <Button asChild size="sm" className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white min-h-[40px] justify-center">
                <Link href="/revisions">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Open Revision Center</span>
                </Link>
              </Button>
            )}

            <Button asChild size="sm" variant="default" className="text-xs gap-1.5 min-h-[40px] justify-center">
              <Link href={`/tasks/${taskId}`}>
                <span>View Task</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
