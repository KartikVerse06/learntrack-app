export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading calendar">
      {/* Header & Filter Controls Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div className="space-y-1.5">
          <div className="h-7 w-44 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-muted rounded-md" />
          <div className="h-9 w-24 bg-muted rounded-md" />
          <div className="h-9 w-28 bg-muted rounded-md" />
        </div>
      </div>

      {/* Calendar Grid Card Skeleton */}
      <div className="p-4 sm:p-6 rounded-xl border bg-card/60 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-8 w-40 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2 pt-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-6 bg-muted/50 rounded text-center" />
          ))}
          {[...Array(28)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-muted/20 border border-border/40 rounded-lg p-1.5 space-y-1">
              <div className="h-3 w-4 bg-muted/50 rounded" />
              {i % 4 === 0 && <div className="h-3.5 w-full bg-primary/20 rounded" />}
              {i % 5 === 0 && <div className="h-3.5 w-3/4 bg-purple-500/20 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
