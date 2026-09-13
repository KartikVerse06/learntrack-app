"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import type { RevisionAdherenceDTO } from "@/lib/analytics/analytics-types";

interface RevisionAnalyticsProps {
  adherence: RevisionAdherenceDTO;
}

export function RevisionAnalytics({ adherence }: RevisionAnalyticsProps) {
  const chartData = [
    { name: "On-Time Completed", value: adherence.onTime, color: "#10B981" },
    { name: "Late Completed", value: adherence.late, color: "#F59E0B" },
    { name: "Pending", value: adherence.pending, color: "#3B82F6" },
    { name: "Overdue", value: adherence.overdue, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const totalRevisions =
    adherence.onTime + adherence.late + adherence.pending + adherence.overdue;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-purple-600" />
          <span>Spaced Revision Adherence</span>
        </CardTitle>
        <CardDescription>
          Tracking review execution against 4-stage forgetting curve intervals (Day 0, +3d, +15d, +30d)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[220px] w-full relative">
          {totalRevisions > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    `${Number(value || 0)} (${totalRevisions > 0 ? Math.round((Number(value || 0) / totalRevisions) * 100) : 0}%)`,
                    String(name || ""),
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No revisions scheduled yet. Mark a topic as learned to generate 4 milestones.
            </div>
          )}

          {/* Center Rate Badge */}
          {totalRevisions > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-foreground">
                {adherence.adherenceRate}%
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                On-Time
              </span>
            </div>
          )}
        </div>

        {/* 4-State Metric Breakdown List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
          <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>On-Time</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
              {adherence.onTime}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Late</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
              {adherence.late}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Pending</span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-800 dark:text-blue-300">
              {adherence.pending}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold mb-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Overdue</span>
            </div>
            <div className="text-xl font-bold font-mono text-red-800 dark:text-red-300">
              {adherence.overdue}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
