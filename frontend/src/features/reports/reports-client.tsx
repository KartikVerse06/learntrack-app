"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  TrendingUp,
  Wallet,
  BookOpen,
  Repeat,
  Award,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ReportType,
  ReportFormat,
  ReportDateRangePreset,
  ReportOverviewStats,
} from "@/lib/reports/report-types";

interface ReportsClientProps {
  initialStats: ReportOverviewStats | null;
  userName: string;
  userEmail: string;
}

interface ReportCardConfig {
  type: ReportType;
  title: string;
  badge: string;
  badgeVariant?: "default" | "secondary" | "outline";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  formats: ReportFormat[];
}

const REPORT_MODULES: ReportCardConfig[] = [
  {
    type: "learning-progress",
    title: "Learning Progress & Tasks",
    badge: "Core Learning",
    description:
      "Full catalog of your planned, in-progress, and completed topics, priority breakdowns, and category distribution.",
    icon: BookOpen,
    highlights: ["Completion rates", "Category volume", "Session estimates"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "focus-time",
    title: "Focus Time & Deep Work",
    badge: "Focus Engine",
    description:
      "Detailed audit of completed 45-minute focus blocks, interrupted sessions, average session duration, and daily work distribution.",
    icon: Clock,
    highlights: ["45-min blocks", "Daily timeline", "Category focus share"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "learning-logs",
    title: "Learning Logs & Reflections",
    badge: "Reflective Log",
    description:
      "Comprehensive record of your post-session reflections, self-assessed confidence scores (1-5), and recorded doubts.",
    icon: Layers,
    highlights: ["Confidence index", "Doubts register", "What learned notes"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "revisions",
    title: "Spaced Revision Schedule",
    badge: "Forgetting Curve",
    description:
      "Automated Day 0, Day 3, Day 15, and Day 30 spaced retention tracking with adherence statistics and overdue queues.",
    icon: Repeat,
    highlights: ["R1–R4 progression", "Adherence rate", "Overdue queue"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "mastery",
    title: "Topic Mastery & Retention",
    badge: "Mastery Audit",
    description:
      "Verification report for topics achieving FULLY_COMPLETED status upon finishing all 4 spaced retention stages.",
    icon: Award,
    highlights: ["4/4 stage completion", "Category mastery", "Mastery dates"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "calendar",
    title: "Calendar & Activity Feed",
    badge: "Chronology",
    description:
      "Chronological schedule of all planned tasks, logged focus sessions, and upcoming spaced revisions across time.",
    icon: Calendar,
    highlights: ["Combined feed", "Planned tasks", "Revision milestones"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "analytics",
    title: "Performance Analytics & Streaks",
    badge: "Long-Term Analytics",
    description:
      "Analytical summary of learning consistency, daily focus trajectories, streak counters, and automated habit insights.",
    icon: TrendingUp,
    highlights: ["Daily trajectories", "Streak records", "Algorithmic insights"],
    formats: ["pdf", "csv", "json"],
  },
  {
    type: "money",
    title: "Financial History & 50/20/20/10",
    badge: "Financial Engine",
    description:
      "Monthly income history with automated 50% Needs, 20% Savings, 20% Growth/Learning, and 10% Wants formula verification.",
    icon: Wallet,
    highlights: ["50/20/20/10 math", "Monthly net balance", "Growth allocation"],
    formats: ["pdf", "csv", "json"],
  },
];

const PRESETS: Array<{ id: ReportDateRangePreset; label: string }> = [
  { id: "30d", label: "Last 30 Days" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This Week" },
  { id: "this-month", label: "This Month" },
  { id: "90d", label: "Last 90 Days" },
  { id: "this-year", label: "This Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Range" },
];

export function ReportsClient({ initialStats, userName, userEmail }: ReportsClientProps) {
  const [rangePreset, setRangePreset] = useState<ReportDateRangePreset>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [loadingState, setLoadingState] = useState<{
    type: ReportType;
    format: ReportFormat;
  } | null>(null);

  const handleDownload = async (type: ReportType, format: ReportFormat) => {
    setLoadingState({ type, format });
    try {
      const url = new URL("/api/reports/download", window.location.origin);
      url.searchParams.set("type", type);
      url.searchParams.set("format", format);
      url.searchParams.set("range", rangePreset);

      if (rangePreset === "custom") {
        if (customFrom) url.searchParams.set("from", customFrom);
        if (customTo) url.searchParams.set("to", customTo);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errorData.error || `Failed to download ${format.toUpperCase()} report`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;

      // Extract filename from header or fallback
      const disposition = res.headers.get("content-disposition");
      let filename = `learntrack-${type}-${new Date().toISOString().split("T")[0]}.${format}`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred during download.");
    } finally {
      setLoadingState(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Reports & Data Export Center
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Tenant Verified
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Generate and download comprehensive, printable records of your learning trajectory, focus
            sessions, and financial habits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 shadow-sm text-xs sm:text-sm"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span>Print View</span>
          </Button>
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <Card className="bg-card/70 backdrop-blur-sm border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              <span>Reporting Window:</span>
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {PRESETS.map((preset) => {
                const isActive = rangePreset === preset.id;
                return (
                  <Button
                    key={preset.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRangePreset(preset.id)}
                    className={`h-8 text-xs font-medium transition-all ${
                      isActive ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Picker Fields (Collapsible) */}
          {rangePreset === "custom" && (
            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <label htmlFor="custom-from" className="font-medium text-muted-foreground">
                  From:
                </label>
                <input
                  id="custom-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="custom-to" className="font-medium text-muted-foreground">
                  To:
                </label>
                <input
                  id="custom-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <span className="text-muted-foreground italic text-[11px]">
                Filter will apply to all generated PDF, CSV, and JSON exports.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hero Card: Complete LearnTrack Archive */}
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">
                  Complete LearnTrack Portfolio Dossier
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Unified master export incorporating all 8 operational domains into a single archive.
                </CardDescription>
              </div>
            </div>
            <Badge className="w-fit bg-primary text-primary-foreground font-semibold px-2.5 py-0.5 text-xs">
              All-In-One Archive
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-background/80 border p-2.5">
              <span className="text-muted-foreground text-[11px] block">Learning Tasks</span>
              <span className="font-bold text-sm sm:text-base text-foreground">
                {initialStats ? initialStats.learningTasks : "—"}
              </span>
            </div>
            <div className="rounded-lg bg-background/80 border p-2.5">
              <span className="text-muted-foreground text-[11px] block">Total Focus Time</span>
              <span className="font-bold text-sm sm:text-base text-foreground">
                {initialStats ? `${(initialStats.focusMinutes / 60).toFixed(1)} hrs` : "—"}
              </span>
            </div>
            <div className="rounded-lg bg-background/80 border p-2.5">
              <span className="text-muted-foreground text-[11px] block">Revisions Due</span>
              <span className="font-bold text-sm sm:text-base text-foreground">
                {initialStats ? initialStats.revisionsDue : "—"}
              </span>
            </div>
            <div className="rounded-lg bg-background/80 border p-2.5">
              <span className="text-muted-foreground text-[11px] block">Active Streak</span>
              <span className="font-bold text-sm sm:text-base text-foreground">
                {initialStats ? `${initialStats.currentStreak} days` : "—"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="truncate">Encrypted tenant isolation • Confidential & User-Specific</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => handleDownload("complete", "pdf")}
              disabled={loadingState?.type === "complete"}
              className="h-8 gap-1.5 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex-1 sm:flex-initial"
            >
              {loadingState?.type === "complete" && loadingState?.format === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>Master PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("complete", "csv")}
              disabled={loadingState?.type === "complete"}
              className="h-8 gap-1.5 text-xs shadow-sm font-medium flex-1 sm:flex-initial"
            >
              {loadingState?.type === "complete" && loadingState?.format === "csv" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>Unified CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("complete", "json")}
              disabled={loadingState?.type === "complete"}
              className="h-8 gap-1.5 text-xs shadow-sm font-medium flex-1 sm:flex-initial"
            >
              {loadingState?.type === "complete" && loadingState?.format === "json" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>Full JSON</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 8 Granular Module Reports Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Module Specific Reports
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Export granular records for any specific subsystem in your preferred file format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {REPORT_MODULES.map((module) => {
            const Icon = module.icon;
            const isLoading = loadingState?.type === module.type;

            return (
              <Card
                key={module.type}
                className="flex flex-col justify-between hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-lg bg-muted text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2.5">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {module.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary/70" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-muted/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Download:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(module.type, "pdf")}
                      disabled={isLoading}
                      className="h-7 px-2.5 text-xs gap-1 hover:text-primary hover:border-primary/50"
                      title="Download PDF"
                    >
                      {isLoading && loadingState?.format === "pdf" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span>PDF</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(module.type, "csv")}
                      disabled={isLoading}
                      className="h-7 px-2.5 text-xs gap-1 hover:text-emerald-600 hover:border-emerald-500/50"
                      title="Download CSV for Excel/Sheets"
                    >
                      {isLoading && loadingState?.format === "csv" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span>CSV</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(module.type, "json")}
                      disabled={isLoading}
                      className="h-7 px-2.5 text-xs gap-1 hover:text-blue-600 hover:border-blue-500/50"
                      title="Download Raw JSON"
                    >
                      {isLoading && loadingState?.format === "json" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileCode className="h-3.5 w-3.5 text-blue-600" />
                      )}
                      <span>JSON</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security & Multi-tenant Privacy Assurance Card */}
      <Card className="bg-muted/30 border-dashed border">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-foreground">
              Zero-Trust Multi-Tenant Isolation Guarantee
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Reports are scoped strictly to the authenticated account (<span className="font-mono text-foreground">{userEmail}</span>).
              Every database query enforces explicit tenant boundary constraints on MySQL. Security credentials, passwords,
              and internal session tokens are permanently excluded from all exported files.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
