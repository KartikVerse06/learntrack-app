export default function RevisionsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading revisions">
      {/* Header */}
      <div className="pb-2 border-b space-y-1.5">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>

      {/* 4-Card Spaced Repetition Metrics Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-2.5 shadow-2xs">
            <div className="h-3.5 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted/80 rounded" />
            <div className="h-3 w-32 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      {/* Revision Queue List Skeleton */}
      <div className="p-5 rounded-xl border bg-card/60 space-y-3">
        <div className="h-5 w-36 bg-muted rounded pb-2 border-b" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3.5 rounded-lg border bg-card/40 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-16 bg-muted rounded" />
              <div className="h-5 w-56 bg-muted rounded" />
            </div>
            <div className="h-8 w-20 bg-muted rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
