import { LearnTrackLogo } from "@/components/common/logo";

export default function Loading() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <LearnTrackLogo variant="auth" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground animate-pulse">
            Loading learning workspace...
          </p>
        </div>
      </div>
    </div>
  );
}
