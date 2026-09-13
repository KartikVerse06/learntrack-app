"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  Flame,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAnalyticsDataAction } from "@/server/actions/analytics-actions";
import { AnalyticsSummary } from "./analytics-summary";
import { FocusAnalytics } from "./focus-analytics";
import { RevisionAnalytics } from "./revision-analytics";
import { ConfidenceAnalytics } from "./confidence-analytics";
import { LearningAnalytics } from "./learning-analytics";
import { DeterministicInsights } from "./deterministic-insights";
import { AnalyticsEmptyState } from "./analytics-empty-state";
import type {
  AnalyticsPayloadDTO,
  AnalyticsDateRange,
} from "@/lib/analytics/analytics-types";

interface AnalyticsClientProps {
  initialPayload: AnalyticsPayloadDTO;
  userTimezone?: string;
}

export function AnalyticsClient({
  initialPayload,
  userTimezone = "UTC",
}: AnalyticsClientProps) {
  const [payload, setPayload] = useState<AnalyticsPayloadDTO>(initialPayload);
  const [activeRange, setActiveRange] = useState<AnalyticsDateRange>(initialPayload.dateRange);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rangeButtons: { id: AnalyticsDateRange; label: string }[] = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "90d", label: "Last 90 Days" },
    { id: "all", label: "All Time" },
  ];

  const handleRangeChange = (range: AnalyticsDateRange) => {
    setActiveRange(range);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await getAnalyticsDataAction(range, userTimezone);
      if (res.success) {
        setPayload(res.data);
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleRefresh = () => {
    handleRangeChange(activeRange);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header Banner & Date Range Strip */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2 border-b">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span className="truncate">Learning Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Empirical metrics on deliberate focus, forgetting-curve revision adherence, and verified practice streaks.
          </p>
        </div>

        {/* Range Selector Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-hidden">
          <div className="inline-flex max-w-full overflow-x-auto rounded-lg border bg-muted/30 p-0.5 no-scrollbar">
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleRangeChange(btn.id)}
                disabled={isPending}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all shrink-0 ${
                  activeRange === btn.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-8 w-8 p-0 shrink-0"
            title="Refresh Analytics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 px-2.5 text-xs gap-1.5 shrink-0 hidden sm:inline-flex"
            title="Export Report"
          >
            <Link href="/reports">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Export</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 flex items-center gap-2 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Content: Empty State vs Analytics Dashboard */}
      {!payload.hasActivity ? (
        <AnalyticsEmptyState />
      ) : (
        <div className={`space-y-8 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
          {/* 1. KPI Summary Cards */}
          <AnalyticsSummary summary={payload.summary} />

          {/* 2. Deterministic Rule-Based Insights */}
          <DeterministicInsights insights={payload.insights} />

          {/* 3. Focus Histogram */}
          <FocusAnalytics
            data={payload.dailyFocus}
            summary={payload.summary}
          />

          {/* 4. Spaced Revision Adherence & Confidence Curve */}
          <div className="grid gap-6 md:grid-cols-2">
            <RevisionAnalytics adherence={payload.revisionAdherence} />
            <ConfidenceAnalytics data={payload.confidenceTrajectory} />
          </div>

          {/* 5. Topic Mastery Velocity & Category Breakdown */}
          <LearningAnalytics
            topicStatus={payload.topicStatusDistribution}
            categories={payload.categoryDistribution}
          />
        </div>
      )}
    </div>
  );
}
