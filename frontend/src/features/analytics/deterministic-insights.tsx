"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info, Sparkles } from "lucide-react";
import type { DeterministicInsight } from "@/lib/analytics/analytics-types";

interface DeterministicInsightsProps {
  insights: DeterministicInsight[];
}

export function DeterministicInsights({ insights }: DeterministicInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Performance Insights</span>
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((item) => {
          let borderStyle = "border-border";
          let icon = <Info className="h-4 w-4 text-blue-600 shrink-0" />;
          let bgStyle = "bg-card";

          if (item.type === "positive") {
            borderStyle = "border-emerald-200 dark:border-emerald-800/40";
            bgStyle = "bg-emerald-50/20 dark:bg-emerald-950/10";
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
          } else if (item.type === "warning") {
            borderStyle = "border-amber-200 dark:border-amber-800/40";
            bgStyle = "bg-amber-50/20 dark:bg-amber-950/10";
            icon = <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
          }

          return (
            <Card key={item.id} className={`shadow-sm ${borderStyle} ${bgStyle}`}>
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  {icon}
                  <span className="truncate">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
