"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Trophy, Layers, Clock } from "lucide-react";
import type {
  TopicStatusDistribution,
  CategoryDistributionItem,
} from "@/lib/analytics/analytics-types";

interface LearningAnalyticsProps {
  topicStatus: TopicStatusDistribution;
  categories: CategoryDistributionItem[];
}

export function LearningAnalytics({
  topicStatus,
  categories,
}: LearningAnalyticsProps) {
  const masteryRate =
    topicStatus.total > 0
      ? Math.round((topicStatus.fullyCompleted / topicStatus.total) * 100)
      : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 1. Topic Lifecycle Velocity */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>Topic Mastery Velocity</span>
          </CardTitle>
          <CardDescription>
            Lifecycle progression from initial planning to verified 4-stage completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Strip */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-muted-foreground">Full Mastery Rate</span>
              <span className="text-foreground font-mono font-bold">{masteryRate}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                style={{ width: `${masteryRate}%` }}
                className="bg-amber-500 h-full transition-all duration-500 rounded-full"
              />
            </div>
          </div>

          {/* 4 Status Blocks */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-muted-foreground font-medium mb-1">1. Planned</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {topicStatus.planned}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Topics scheduled for study
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <div className="text-muted-foreground font-medium mb-1">2. In Progress</div>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {topicStatus.inProgress}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Active focus block underway
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <div className="text-muted-foreground font-medium mb-1">3. Revision Pending</div>
              <div className="text-2xl font-bold font-mono text-purple-600">
                {topicStatus.revisionPending}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Learned, undergoing reviews
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium mb-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>4. Fully Mastered</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-300">
                {topicStatus.fullyCompleted}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Completed all 4 revisions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Category Time Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            <span>Study Time by Category</span>
          </CardTitle>
          <CardDescription>
            Partition of completed 45-minute focus blocks across learning subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.slice(0, 5).map((cat) => {
                const hours = (cat.totalMinutes / 60).toFixed(1);
                return (
                  <div key={cat.categoryId ?? "uncat"} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate max-w-[160px] sm:max-w-[220px]">
                          {cat.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-mono">
                        <span>{hours}h</span>
                        <span className="text-foreground font-semibold">
                          ({Math.round(cat.percentage)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(cat.percentage, 3)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Categorize learning tasks and log focus sessions to view subject distribution.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
