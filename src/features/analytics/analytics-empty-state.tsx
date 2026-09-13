"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Timer, ArrowRight, BrainCircuit } from "lucide-react";

export function AnalyticsEmptyState() {
  return (
    <Card className="border-dashed border-2 shadow-sm">
      <CardContent className="py-16 text-center max-w-lg mx-auto space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <BarChart3 className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            No Learning Analytics Yet
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            LearnTrack generates real retention metrics as you complete 45-minute focus sessions, submit reflective logs, and execute spaced revisions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild variant="default" className="w-full sm:w-auto gap-2">
            <Link href="/planner">
              <Plus className="h-4 w-4" />
              <span>Plan Topics in Planner</span>
            </Link>
          </Button>
          <Button asChild variant="focus" className="w-full sm:w-auto gap-2">
            <Link href="/focus">
              <Timer className="h-4 w-4" />
              <span>Start 45m Focus Session</span>
            </Link>
          </Button>
        </div>

        <div className="pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <div className="font-semibold text-foreground">1. Focus</div>
            <div>45m uninterrupted study</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-foreground">2. Log</div>
            <div>Reflect on what was learned</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-foreground">3. Revise</div>
            <div>Spaced review intervals</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
