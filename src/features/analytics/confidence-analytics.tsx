"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Star } from "lucide-react";
import type { ConfidenceTrajectoryPoint } from "@/lib/analytics/analytics-types";

interface ConfidenceAnalyticsProps {
  data: ConfidenceTrajectoryPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ConfidenceTrajectoryPoint }>;
  label?: string;
}

function ConfidenceCustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background/95 p-2.5 shadow-md backdrop-blur-sm text-xs">
        <div className="font-semibold text-foreground mb-1">{item.stageLabel}</div>
        <div className="flex items-center gap-1.5 text-amber-600 font-medium">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>
            Avg Confidence: {item.averageConfidence !== null ? `${item.averageConfidence} / 5.0` : "No ratings yet"}
          </span>
        </div>
        <div className="text-muted-foreground mt-0.5">
          Based on {item.sampleCount} recorded {item.sampleCount === 1 ? "rating" : "ratings"}
        </div>
      </div>
    );
  }
  return null;
}

export function ConfidenceAnalytics({ data }: ConfidenceAnalyticsProps) {
  const hasAnyData = data.some((d) => d.averageConfidence !== null);

  // Filter or transform data for Recharts (connect nulls if needed)
  const chartData = data.map((d) => ({
    ...d,
    displayScore: d.averageConfidence ?? undefined,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>Confidence & Retention Progression Curve</span>
        </CardTitle>
        <CardDescription>
          Tracking self-rated confidence (1–5) from Initial Learning Log across Revisions 1 through 4
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[220px] w-full pt-2">
          {hasAnyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="stageLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <Tooltip content={<ConfidenceCustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="displayScore"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2, stroke: "#FFFFFF" }}
                  activeDot={{ r: 6, fill: "#D97706" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Submit learning logs and complete revisions to view your memory retention curve.
            </div>
          )}
        </div>

        {/* Stage Milestone Score Strip */}
        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t text-center text-xs">
          {data.map((point) => (
            <div key={point.stage} className="p-1.5 rounded bg-muted/40">
              <div className="text-[10px] text-muted-foreground font-medium truncate">
                {point.stage === 0 ? "Initial" : `Rev ${point.stage}`}
              </div>
              <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                {point.averageConfidence !== null ? `${point.averageConfidence}` : "—"}
              </div>
              <div className="text-[9px] text-muted-foreground">
                ({point.sampleCount})
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
