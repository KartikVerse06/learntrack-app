"use client";

import * as React from "react";
import {
  Clock,
  Timer,
  BookOpen,
  Trophy,
  BrainCircuit,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsSummaryDTO } from "@/lib/analytics/analytics-types";

interface AnalyticsSummaryProps {
  summary: AnalyticsSummaryDTO;
}

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  const hours = Math.floor(summary.totalFocusMinutes / 60);
  const minutes = summary.totalFocusMinutes % 60;
  const formattedFocusTime =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Total Focus Time */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Focus
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground truncate">
            {formattedFocusTime}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {summary.completedFocusSessions} completed blocks
          </p>
        </CardContent>
      </Card>

      {/* 2. Completed 45m Sessions */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            45m Sessions
          </CardTitle>
          <Timer className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {summary.completedFocusSessions}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {summary.focusCompletionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      {/* 3. Topics Learned */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Topics Learned
          </CardTitle>
          <BookOpen className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {summary.topicsLearned}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Initial practice complete
          </p>
        </CardContent>
      </Card>

      {/* 4. Topics Fully Mastered */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Full Mastery
          </CardTitle>
          <Trophy className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {summary.topicsFullyCompleted}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            All 4 reviews completed
          </p>
        </CardContent>
      </Card>

      {/* 5. Revision Adherence */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adherence
          </CardTitle>
          <BrainCircuit className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {summary.revisionAdherenceRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {summary.completedRevisions} reviews on-time
          </p>
        </CardContent>
      </Card>

      {/* 6. Verified Practice Streak */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Streak
          </CardTitle>
          <Flame
            className={`h-4 w-4 ${
              summary.currentStreak > 0
                ? "text-amber-500 fill-amber-500 animate-pulse"
                : "text-muted-foreground"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.currentStreak}
            </span>
            <span className="text-xs text-muted-foreground">
              {summary.currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="mt-1">
            <Badge
              variant="outline"
              className="text-[10px] font-normal px-1.5 py-0 h-4 border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
            >
              Best: {summary.longestStreak}d
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
