"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Repeat,
  ShieldCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevisionCard } from "./revision-card";
import { ActiveRecallDrawer } from "./active-recall-drawer";
import type { RevisionWithTask, RevisionMetrics } from "@/server/repositories/revision-repository";
import type { Category } from "@/types";

interface RevisionListClientProps {
  initialRevisions: RevisionWithTask[];
  categories: Category[];
  metrics: RevisionMetrics;
  userTimezone?: string;
}

export function RevisionListClient({
  initialRevisions,
  categories,
  metrics,
}: RevisionListClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"due" | "upcoming" | "completed">("due");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Group revisions according to tabs
  const dueRevisions = initialRevisions.filter(
    (r) => (r.dynamicStatus === "DUE" || r.dynamicStatus === "OVERDUE") && r.status !== "COMPLETED"
  );

  const upcomingRevisions = initialRevisions.filter(
    (r) => r.dynamicStatus === "PENDING" && r.status !== "COMPLETED"
  );

  const completedRevisions = initialRevisions.filter((r) => r.status === "COMPLETED");

  const currentList =
    activeTab === "due"
      ? dueRevisions
      : activeTab === "upcoming"
      ? upcomingRevisions
      : completedRevisions;

  const filteredList =
    selectedCategoryId === "ALL"
      ? currentList
      : currentList.filter((r) => r.task.categoryId === selectedCategoryId);

  const handleOpenReview = (revisionId: string) => {
    setSelectedRevisionId(revisionId);
    setIsDrawerOpen(true);
  };

  const handleReviewSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-6 w-6 text-purple-600" />
            <span>Spaced Revision Center</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defeat the forgetting curve via 4 automated retention milestones: Day 0, +3, +15, and +30.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 py-1 px-3 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-medium"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Mastery: All 4 Checkpoints Required</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-purple-50/30 dark:bg-purple-950/10 border-purple-200/50 dark:border-purple-900/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Due Today
              </p>
              <div className="text-2xl font-bold text-foreground font-mono mt-0.5">
                {metrics.dueToday}
              </div>
            </div>
            <Clock className="h-5 w-5 text-purple-600" />
          </CardContent>
        </Card>

        <Card className={metrics.overdue > 0 ? "bg-destructive/5 border-destructive/30" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Overdue
              </p>
              <div
                className={`text-2xl font-bold font-mono mt-0.5 ${
                  metrics.overdue > 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {metrics.overdue}
              </div>
            </div>
            <AlertCircle
              className={`h-5 w-5 ${metrics.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming (30 Days)
              </p>
              <div className="text-2xl font-bold text-foreground font-mono mt-0.5">
                {metrics.upcoming}
              </div>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Topics Mastered
              </p>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {metrics.masteredTopicsCount}
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Category Filter - Scrollable on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Segmented Control Tabs */}
        <div className="inline-flex p-1 bg-muted rounded-xl gap-1 text-xs font-semibold max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("due")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[34px] ${
              activeTab === "due"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Due & Overdue</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                dueRevisions.length > 0
                  ? "bg-purple-600 text-white"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {dueRevisions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[34px] ${
              activeTab === "upcoming"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Upcoming (30 Days)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-muted-foreground/20 text-muted-foreground">
              {upcomingRevisions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[34px] ${
              activeTab === "completed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed Archive</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-muted-foreground/20 text-muted-foreground">
              {completedRevisions.length}
            </span>
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              aria-label="Filter revisions by category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div>
        {filteredList.length === 0 ? (
          <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10 space-y-3 px-4">
            <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
              {activeTab === "due" ? (
                <Sparkles className="h-6 w-6 text-purple-600" />
              ) : activeTab === "upcoming" ? (
                <Calendar className="h-6 w-6" />
              ) : (
                <BookOpen className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-semibold text-foreground">
                {activeTab === "due"
                  ? "All caught up! No revisions due today."
                  : activeTab === "upcoming"
                  ? "No upcoming revisions scheduled."
                  : "No completed revisions archived yet."}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {activeTab === "due"
                  ? "Great job! Check upcoming retention milestones or plan new learning tasks."
                  : "When you mark deliberate learning tasks as completed, their automated 30-day revision schedule appears here."}
              </p>
            </div>

            <div className="pt-2">
              <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
                <Link href="/planner">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Go to Daily Planner</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredList.map((revision) => (
              <RevisionCard
                key={revision.id}
                revision={revision}
                onReview={handleOpenReview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active Recall Review Drawer */}
      <ActiveRecallDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        revisionId={selectedRevisionId}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
