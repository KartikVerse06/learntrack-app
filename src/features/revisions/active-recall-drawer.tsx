"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  BookOpen,
  Loader2,
  Calendar,
  Award,
} from "lucide-react";
import {
  getRevisionDetailsAction,
  completeRevisionAction,
} from "@/server/actions/revision-actions";
import type { RevisionWithDetails } from "@/server/repositories/revision-repository";

interface ActiveRecallDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId: string | null;
  onSuccess?: (isTopicMastered: boolean) => void;
}

export function ActiveRecallDrawer({
  open,
  onOpenChange,
  revisionId,
  onSuccess,
}: ActiveRecallDrawerProps) {
  const [revision, setRevision] = useState<RevisionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealNotes, setRevealNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState<number>(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [masteryCelebration, setMasteryCelebration] = useState(false);

  useEffect(() => {
    if (open && revisionId) {
      setIsLoading(true);
      setRevealNotes(false);
      setNotes("");
      setConfidence(3);
      setErrorMessage(null);
      setMasteryCelebration(false);

      getRevisionDetailsAction(revisionId)
        .then((res) => {
          if (res.success) {
            setRevision(res.data);
            if (res.data.notes) setNotes(res.data.notes);
            if (res.data.confidence) setConfidence(res.data.confidence);
          } else {
            setErrorMessage(res.error.message);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setRevision(null);
    }
  }, [open, revisionId]);

  const handleComplete = async () => {
    if (!revisionId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await completeRevisionAction({
      revisionId,
      notes: notes.trim() || undefined,
      confidence,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error.message);
      return;
    }

    if (res.data.isTopicMastered) {
      setMasteryCelebration(true);
      setTimeout(() => {
        onSuccess?.(true);
        onOpenChange(false);
      }, 2500);
    } else {
      onSuccess?.(false);
      onOpenChange(false);
    }
  };

  const confidenceDescriptions: Record<number, { label: string; desc: string }> = {
    1: { label: "1 — Very Low", desc: "Forgot key concepts; struggled to recall fundamentals." },
    2: { label: "2 — Low", desc: "Vague recall; needed significant reference to remember." },
    3: { label: "3 — Moderate", desc: "Solid recall with occasional gaps or hesitation." },
    4: { label: "4 — High", desc: "Fluent, effortless recall of core concepts and mechanics." },
    5: { label: "5 — Very High", desc: "Mastered; complete intuitive command and synthesis." },
  };

  const milestoneNames: Record<number, string> = {
    1: "Revision 1 (Day 0 — Same Day)",
    2: "Revision 2 (Day +3)",
    3: "Revision 3 (Day +15)",
    4: "Revision 4 (Day +30 — Final Mastery)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm">Loading active recall session...</p>
          </div>
        ) : errorMessage && !revision ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-destructive font-semibold">{errorMessage}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : revision ? (
          <>
            {masteryCelebration ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-600">
                  <Award className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-foreground">
                    🎉 Topic Fully Mastered!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    All 4 spaced repetition checkpoints completed. You have successfully defeated the forgetting curve for{" "}
                    <span className="font-semibold text-foreground">{revision.task.title}</span>!
                  </p>
                </div>
                <Badge variant="focus" className="text-xs px-3 py-1 mt-2">
                  Topic State: FULLY_COMPLETED
                </Badge>
              </div>
            ) : (
              <>
                <DialogHeader className="space-y-2 border-b pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-600">
                        <BrainCircuit className="h-5 w-5" />
                      </span>
                      <DialogTitle className="text-lg font-bold">Active Recall Review</DialogTitle>
                    </div>
                    <Badge variant="revision" className="text-xs">
                      {milestoneNames[revision.revisionNumber] || `Revision ${revision.revisionNumber}`}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Topic:{" "}
                    <strong className="text-foreground font-semibold">
                      {revision.task.title}
                    </strong>
                    {revision.task.category && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                        style={{
                          backgroundColor: `${revision.task.category.color}15`,
                          color: revision.task.category.color,
                          borderColor: `${revision.task.category.color}40`,
                        }}
                      >
                        {revision.task.category.name}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* STEP 1: PROMPT */}
                  <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>Step 1: Unassisted Retrieval</span>
                    </div>
                    <p className="text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                      Before revealing your previous notes, take 60 seconds to retrieve the core concepts, syntax, or mental models from memory. Active retrieval forces synaptogenesis and long-term consolidation.
                    </p>
                  </div>

                  {/* STEP 2: ACCORDION FOR PAST LEARNING LOGS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Past Learning Logs ({revision.task.learningLogs.length})</span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRevealNotes(!revealNotes)}
                        className="h-7 text-xs gap-1.5"
                      >
                        {revealNotes ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Hide Reference Material</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-purple-600" />
                            <span>Reveal Past Notes & Doubts</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {revealNotes && (
                      <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3 animate-in fade-in-50 duration-200 text-xs">
                        {revision.task.learningLogs.length === 0 ? (
                          <p className="text-muted-foreground italic text-center py-2">
                            No learning log reflections recorded yet for this topic.
                          </p>
                        ) : (
                          revision.task.learningLogs.map((log, index) => (
                            <div key={log.id} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                <span>Log #{revision.task.learningLogs.length - index}</span>
                                <span>Confidence: {log.confidence}/5</span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground mb-0.5">What Was Learned:</p>
                                <p className="p-2 rounded bg-background border text-muted-foreground whitespace-pre-wrap">
                                  {log.whatLearned}
                                </p>
                              </div>
                              {log.doubts && (
                                <div>
                                  <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                                    <HelpCircle className="h-3 w-3" />
                                    <span>Prior Doubts & Questions:</span>
                                  </p>
                                  <p className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                                    {log.doubts}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 3: REVISION REFLECTION NOTES */}
                  <div className="space-y-2">
                    <Label htmlFor="rev-notes" className="text-xs font-semibold">
                      Step 2: Retrieval Notes & Knowledge Gaps (Optional)
                    </Label>
                    <Textarea
                      id="rev-notes"
                      rows={3}
                      placeholder="What did you recall accurately? Were there specific formulas, edge cases, or nuances you had forgotten?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>

                  {/* STEP 4: CONFIDENCE RATING */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Step 3: Current Retention Confidence
                    </Label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setConfidence(lvl)}
                          className={`p-2 rounded-md border text-center transition-all ${
                            confidence === lvl
                              ? "bg-purple-600 text-white border-purple-600 font-bold shadow-sm"
                              : "bg-background hover:bg-muted/40 border-input text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <Star
                              className={`h-3.5 w-3.5 ${
                                confidence >= lvl
                                  ? confidence === lvl
                                    ? "fill-white text-white"
                                    : "fill-purple-400 text-purple-400"
                                  : "text-muted-foreground/40"
                              }`}
                            />
                          </div>
                          <span className="text-xs">{lvl}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      <strong>{confidenceDescriptions[confidence].label}:</strong>{" "}
                      {confidenceDescriptions[confidence].desc}
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
                      {errorMessage}
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Mastery...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete Revision {revision.revisionNumber}</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
