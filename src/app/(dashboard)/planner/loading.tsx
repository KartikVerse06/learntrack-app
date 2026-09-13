export default function PlannerLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-muted/40 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Date Navigator Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/40 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted/60 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-muted/60 rounded animate-pulse" />
          <div className="h-9 w-16 bg-muted/60 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/60 rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted/40 rounded animate-pulse" />
        </div>
      </div>

      {/* Agenda Header & Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-card/40">
        <div className="h-5 w-40 bg-muted/60 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-48 bg-muted/40 rounded-md animate-pulse" />
          <div className="h-8 w-32 bg-muted/40 rounded-md animate-pulse" />
          <div className="h-8 w-36 bg-muted/60 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Task Cards Skeletons */}
      <div className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-l-4 border-l-muted bg-card p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-muted/70 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/40 rounded animate-pulse" />
              </div>
              <div className="h-8 w-8 bg-muted/50 rounded-md animate-pulse" />
            </div>
            <div className="pt-3 border-t flex items-center justify-between">
              <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
              <div className="h-8 w-24 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
