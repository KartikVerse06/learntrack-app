export default function FocusLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-xl mx-auto py-6 px-4 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading focus timer">
      {/* Session Title & Badge Skeleton */}
      <div className="flex flex-col items-center space-y-2">
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-3.5 w-36 bg-muted/60 rounded" />
      </div>

      {/* Progress Clock Skeleton */}
      <div className="h-56 w-56 sm:h-64 sm:w-64 rounded-full border-8 border-muted/50 flex flex-col items-center justify-center space-y-2">
        <div className="h-12 w-32 bg-muted rounded-md" />
        <div className="h-3 w-20 bg-muted/60 rounded" />
      </div>

      {/* Controls Skeleton */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
        <div className="h-12 flex-1 w-full bg-muted rounded-lg" />
        <div className="h-10 w-28 bg-muted/80 rounded-lg" />
      </div>
    </div>
  );
}
