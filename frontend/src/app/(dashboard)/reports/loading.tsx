export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reports">
      {/* Header */}
      <div className="pb-2 border-b space-y-1.5">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>

      {/* Date & Preset Bar */}
      <div className="h-14 rounded-xl border bg-card/60 flex items-center justify-between px-4">
        <div className="h-8 w-36 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      </div>

      {/* Report Module Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl border bg-card/60 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="h-10 w-full bg-muted/40 rounded" />
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="h-7 w-20 bg-muted rounded" />
              <div className="h-7 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
