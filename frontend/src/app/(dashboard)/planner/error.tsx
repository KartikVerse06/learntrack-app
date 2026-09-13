"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Daily Planner error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center border rounded-2xl bg-card/40 backdrop-blur">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4 shadow-sm">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-primary" />
        <span>Unable to load daily agenda</span>
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        There was an issue synchronizing your daily learning tasks. This may be due to a network interruption or session refresh.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gap-2 font-semibold">
          <RotateCcw className="h-4 w-4" />
          <span>Retry Agenda</span>
        </Button>
      </div>
    </div>
  );
}
