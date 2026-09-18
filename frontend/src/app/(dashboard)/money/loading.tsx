export default function MoneyLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading money tracker">
      {/* Header */}
      <div className="pb-2 border-b space-y-1.5">
        <div className="h-7 w-52 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted/60 rounded" />
      </div>

      {/* Budget Input & Overview */}
      <div className="p-5 rounded-xl border bg-card/60 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted/50 rounded" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg" />
        </div>
      </div>

      {/* 50/20/20/10 4-Card Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted/80 rounded" />
            <div className="h-2 w-full bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>

      {/* 2-Column Split: Expenses & History */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 p-5 rounded-xl border bg-card/60 space-y-3">
          <div className="h-5 w-36 bg-muted rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/30 rounded-lg" />
          ))}
        </div>
        <div className="lg:col-span-3 p-5 rounded-xl border bg-card/60 space-y-3">
          <div className="h-5 w-36 bg-muted rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
