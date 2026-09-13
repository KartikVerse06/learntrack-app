import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TaskDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/planner"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Daily Planner</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </div>

      {/* Header card skeleton */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
          </div>
          <div className="h-9 w-32 bg-muted rounded" />
        </div>

        <div className="h-8 w-3/4 bg-muted rounded" />

        <div className="flex items-center gap-6 pt-2 border-t">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
      </div>

      {/* Tabs bar skeleton */}
      <div className="flex items-center border-b space-x-4 pb-2">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded" />
      </div>

      {/* Content panel skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 h-64 rounded-xl border bg-card/60 p-6 space-y-4">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
        <div className="h-64 rounded-xl border bg-card/60 p-6 space-y-4">
          <div className="h-5 w-36 bg-muted rounded" />
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
