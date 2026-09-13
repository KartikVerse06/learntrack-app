"use client";

import { useState, useTransition } from "react";
import { Sparkles, Play, ArrowRight, BookOpen, HelpCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfidenceSelector } from "./confidence-selector";
import { createLearningLogAction } from "@/server/actions/learning-log-actions";
import type { LearningLogWithRelations } from "@/server/repositories/learning-log-repository";

interface LearningLogFormProps {
  taskId: string;
  sessionId: string;
  taskTitle: string;
  taskCategory?: { name: string; color: string } | null;
  onSuccess: (
    log: LearningLogWithRelations,
    nextAction: "return_planner" | "another_session" | "view_task"
  ) => void;
  onCancel?: () => void;
}

export function LearningLogForm({
  taskId,
  sessionId,
  taskTitle,
  taskCategory,
  onSuccess,
  onCancel,
}: LearningLogFormProps) {
  const [isPending, startTransition] = useTransition();

  const [whatLearned, setWhatLearned] = useState("");
  const [whatCompleted, setWhatCompleted] = useState("");
  const [doubts, setDoubts] = useState("");
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState(3);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (nextAction: "return_planner" | "another_session" | "view_task") => {
    setErrors({});
    setErrorMessage(null);

    // Client-side minimum length validation
    if (whatLearned.trim().length < 10) {
      setErrors({
        whatLearned: ["What you learned must be at least 10 characters."],
      });
      return;
    }

    startTransition(async () => {
      const res = await createLearningLogAction({
        taskId,
        sessionId,
        whatLearned: whatLearned.trim(),
        whatCompleted: whatCompleted.trim() || undefined,
        doubts: doubts.trim() || undefined,
        notes: notes.trim() || undefined,
        confidence,
      });

      if (res.success) {
        onSuccess(res.data, nextAction);
      } else {
        if (res.error.details) {
          setErrors(res.error.details);
        }
        setErrorMessage(res.error.message);
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Task Context Strip */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="space-y-0.5 pr-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Reflecting On Topic
          </span>
          <h3 className="text-base font-bold text-foreground line-clamp-1">{taskTitle}</h3>
        </div>
        {taskCategory && (
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            style={{
              backgroundColor: `${taskCategory.color}15`,
              color: taskCategory.color,
            }}
          >
            {taskCategory.name}
          </Badge>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Field 1: What did I learn? (Required) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="whatLearned" className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>What did I learn? *</span>
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {whatLearned.length}/5000 (Min 10 chars)
          </span>
        </div>
        <Textarea
          id="whatLearned"
          value={whatLearned}
          onChange={(e) => setWhatLearned(e.target.value)}
          placeholder="Summarize core concepts, principles, mental models, or key takeaways..."
          rows={4}
          className="resize-none text-xs leading-relaxed"
          disabled={isPending}
          required
        />
        {errors.whatLearned && (
          <p className="text-[11px] font-medium text-destructive">{errors.whatLearned[0]}</p>
        )}
      </div>

      {/* Field 2: What did I complete? (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="whatCompleted" className="text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>What practical outputs did I complete? (Optional)</span>
        </Label>
        <Input
          id="whatCompleted"
          value={whatCompleted}
          onChange={(e) => setWhatCompleted(e.target.value)}
          placeholder="e.g., Implemented binary search tree, solved 3 LeetCode problems..."
          className="text-xs h-9"
          disabled={isPending}
          maxLength={255}
        />
      </div>

      {/* Field 3: What are my doubts? (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="doubts" className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>What are my open doubts / questions? (Optional)</span>
        </Label>
        <Textarea
          id="doubts"
          value={doubts}
          onChange={(e) => setDoubts(e.target.value)}
          placeholder="Unresolved questions or confusions to revisit during spaced revisions..."
          rows={2}
          className="resize-none text-xs leading-relaxed border-amber-500/20 focus-visible:ring-amber-500"
          disabled={isPending}
        />
      </div>

      {/* Field 4: Reference Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Reference Notes & Links (Optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Book pages, documentation URLs, or code snippet references..."
          rows={2}
          className="resize-none text-xs leading-relaxed"
          disabled={isPending}
        />
      </div>

      {/* Field 5: Confidence Selector */}
      <div className="pt-1 pb-2">
        <ConfidenceSelector
          value={confidence}
          onChange={setConfidence}
          disabled={isPending}
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="w-full sm:w-auto text-xs min-h-[40px]"
          >
            Skip for now
          </Button>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit("another_session")}
            disabled={isPending}
            className="w-full sm:w-auto gap-1.5 text-xs min-h-[42px] font-semibold"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Save & Start Another</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSubmit("return_planner")}
            disabled={isPending}
            className="w-full sm:w-auto gap-1.5 text-xs min-h-[42px] font-semibold shadow-xs"
          >
            <span>Save & Return to Planner</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
