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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border bg-card/60 backdrop-blur shadow-sm">
      {/* Date Display */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
              {formatDisplayDate(currentDate)}
            </h3>
            {todayActive && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/15 text-primary">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Planned daily deliberate study agenda
          </p>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            title="Previous Day"
            className="h-10 w-10 min-h-[40px] min-w-[40px]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Day</span>
          </Button>

          <Button
            variant={todayActive ? "default" : "outline"}
            size="sm"
            onClick={handleToday}
            className="h-10 min-h-[40px] px-3.5 text-xs font-semibold"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            title="Next Day"
            className="h-10 w-10 min-h-[40px] min-w-[40px]"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Day</span>
          </Button>
        </div>

        <div className="relative">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => {
              if (e.target.value) handleNavigate(e.target.value);
            }}
            aria-label="Select specific date"
            className="h-10 min-h-[40px] px-2.5 text-xs rounded-md border border-input bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
      </div>
    </div>
  );
}
