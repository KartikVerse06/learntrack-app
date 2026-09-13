"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LearningLogForm } from "./learning-log-form";
import type { LearningLogWithRelations } from "@/types";

interface LearningLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  sessionId: string;
  taskTitle: string;
  taskCategory?: { name: string; color: string } | null;
  onSuccess: (
    log: LearningLogWithRelations,
    nextAction: "return_planner" | "another_session" | "view_task"
  ) => void;
}

export function LearningLogModal({
  open,
  onOpenChange,
  taskId,
  sessionId,
  taskTitle,
  taskCategory,
  onSuccess,
}: LearningLogModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              45-Minute Focus Session Completed!
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Synthesize what you learned while it is fresh in your working memory.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <LearningLogForm
            taskId={taskId}
            sessionId={sessionId}
            taskTitle={taskTitle}
            taskCategory={taskCategory}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
