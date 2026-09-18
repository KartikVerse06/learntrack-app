export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading analytics">
      {/* Header */}
      <div className="pb-2 border-b space-y-1.5">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>

      {/* 4 Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-2.5 shadow-2xs">
            <div className="h-3.5 w-24 bg-muted rounded" />
            <div className="h-8 w-20 bg-muted/80 rounded" />
            <div className="h-3 w-32 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      {/* 2 Big Chart Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-5 rounded-xl border bg-card/60 space-y-4">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-64 bg-muted/20 rounded-lg flex items-end justify-around p-4 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-8 bg-primary/20 rounded-t" style={{ height: `${20 + (i * 12) % 70}%` }} />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border bg-card/60 space-y-4">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="h-40 w-40 rounded-full border-12 border-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
