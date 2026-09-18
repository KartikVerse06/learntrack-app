export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse" aria-busy="true" aria-label="Loading settings">
      {/* Header */}
      <div className="pb-2 border-b space-y-1.5">
        <div className="h-7 w-36 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted/60 rounded" />
      </div>

      {/* Settings Card Skeletons */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card/60 space-y-4">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
            </div>
            <div className="pt-2">
              <div className="h-9 w-24 bg-muted rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
