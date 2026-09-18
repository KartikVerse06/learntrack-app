export default function PlannerLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading planner">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b">
        <div className="space-y-1.5">
          <div className="h-7 w-52 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted/60 rounded" />
        </div>
      </div>

      {/* Date Navigator Bar Skeleton */}
      <div className="h-16 rounded-xl border bg-card/60 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-lg" />
          <div className="space-y-1">
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/50 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-muted rounded" />
          <div className="h-9 w-16 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded" />
        </div>
      </div>

      {/* Task List Skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-20 bg-muted/70 rounded" />
              <div className="h-5 w-64 bg-muted rounded" />
              <div className="h-3 w-40 bg-muted/50 rounded" />
            </div>
            <div className="h-9 w-24 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
