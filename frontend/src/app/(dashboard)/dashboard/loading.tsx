export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* Welcome Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted rounded-md" />
          <div className="h-4 w-80 bg-muted/60 rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="h-10 w-36 bg-muted rounded-md" />
          <div className="h-10 w-36 bg-muted rounded-md" />
        </div>
      </div>

      {/* 4-Card Metrics Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-2.5 shadow-2xs">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded-full" />
            </div>
            <div className="h-8 w-20 bg-muted/80 rounded" />
            <div className="h-3 w-36 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      {/* Minimal Money Bar */}
      <div className="h-16 rounded-xl border bg-card/40" />

      {/* Main Two-Column Split */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 p-5 rounded-xl border bg-card/60 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/40 rounded-lg border border-border/40" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 p-5 rounded-xl border bg-card/60 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/40 rounded-lg border border-border/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
