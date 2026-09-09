"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getRelativeDateISO,
  getTodayISO,
  formatDisplayDate,
  isToday,
} from "@/lib/date-utils";

interface DateNavigatorProps {
  currentDate: string;
}

export function DateNavigator({ currentDate }: DateNavigatorProps) {
  const router = useRouter();

  const handleNavigate = (dateStr: string) => {
    router.push(`/planner?date=${dateStr}`);
  };

  const handlePrev = () => {
    handleNavigate(getRelativeDateISO(currentDate, -1));
  };

  const handleNext = () => {
    handleNavigate(getRelativeDateISO(currentDate, 1));
  };

  const handleToday = () => {
    handleNavigate(getTodayISO());
  };

  const todayActive = isToday(currentDate);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-lg">
              {formatDisplayDate(currentDate)}
            </h3>
            {todayActive && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/15 text-primary">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Planned daily deliberate study agenda
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          title="Previous Day"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Day</span>
        </Button>

        <Button
          variant={todayActive ? "default" : "outline"}
          size="sm"
          onClick={handleToday}
          className="h-9 px-3 text-xs font-medium"
        >
          Today
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          title="Next Day"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Day</span>
        </Button>

        <div className="relative ml-1">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => {
              if (e.target.value) handleNavigate(e.target.value);
            }}
            className="h-9 px-2.5 text-xs rounded-md border border-input bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            title="Jump to date"
          />
        </div>
      </div>
    </div>
  );
}
