"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Timer, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import type { DailyFocusDataPoint, AnalyticsSummaryDTO } from "@/lib/analytics/analytics-types";

interface FocusAnalyticsProps {
  data: DailyFocusDataPoint[];
  summary: AnalyticsSummaryDTO;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DailyFocusDataPoint }>;
  label?: string;
}

function FocusCustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    const hrs = Math.floor(item.focusMinutes / 60);
    const mins = item.focusMinutes % 60;
    const formatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    return (
      <div className="rounded-lg border bg-background/95 p-2.5 shadow-md backdrop-blur-sm text-xs">
        <div className="font-semibold text-foreground mb-1">{item.date}</div>
        <div className="flex items-center gap-2 text-primary font-medium">
          <Timer className="h-3.5 w-3.5" />
          <span>Focus Time: {formatted} ({item.focusMinutes} min)</span>
        </div>
        <div className="text-muted-foreground mt-0.5">
          {item.sessionCount} {item.sessionCount === 1 ? "session" : "sessions"} completed
        </div>
      </div>
    );
  }
  return null;
}

export function FocusAnalytics({ data, summary }: FocusAnalyticsProps) {
  const maxMinutes = Math.max(...data.map((d) => d.focusMinutes), 120);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-600" />
            <span>Focus Time Trajectory</span>
          </CardTitle>
          <CardDescription>
            Daily completed focus minutes with 90-minute benchmark line (two 45m sessions)
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-600" />
            <span>Actual Minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-emerald-500" />
            <span>90m Target</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[220px] xs:h-[250px] sm:h-[280px] w-full pt-2">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={data.length > 14 ? Math.ceil(data.length / 7) : 0}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, Math.ceil(maxMinutes / 30) * 30]}
                  unit="m"
                />
                <Tooltip content={<FocusCustomTooltip />} />
                <ReferenceLine
                  y={90}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="focusMinutes"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No focus sessions recorded in this time interval.
            </div>
          )}
        </div>

        {/* Focus Quality & Completion Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">
                {summary.completedFocusSessions} Completed Blocks
              </div>
              <div className="text-muted-foreground">
                Avg: {summary.averageSessionMinutes} min / session
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
            {summary.interruptedFocusSessions > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-foreground">
                {summary.focusCompletionRate}% Completion Rate
              </div>
              <div className="text-muted-foreground">
                {summary.interruptedFocusSessions} cancelled / stopped
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-foreground">
                {(summary.totalFocusMinutes / 60).toFixed(1)} Total Hours
              </div>
              <div className="text-muted-foreground">
                Across selected range
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
