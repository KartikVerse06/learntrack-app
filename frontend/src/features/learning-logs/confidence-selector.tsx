"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const CONFIDENCE_LEVELS = [
  {
    value: 1,
    label: "Very Low",
    description: "Struggled with fundamentals; needs re-study",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/30",
    activeBg: "bg-rose-600 text-white",
  },
  {
    value: 2,
    label: "Low",
    description: "Understood basic concepts but cannot implement without assistance",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    activeBg: "bg-orange-600 text-white",
  },
  {
    value: 3,
    label: "Moderate",
    description: "Grasps core ideas; can apply with occasional reference",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    activeBg: "bg-amber-600 text-white",
  },
  {
    value: 4,
    label: "High",
    description: "Clear conceptual and practical mastery; minimal reference needed",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    activeBg: "bg-blue-600 text-white",
  },
  {
    value: 5,
    label: "Very High",
    description: "Complete intuitive command; able to teach or derive from first principles",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-600 text-white",
  },
];

interface ConfidenceSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ConfidenceSelector({
  value,
  onChange,
  disabled = false,
}: ConfidenceSelectorProps) {
  const current = CONFIDENCE_LEVELS.find((l) => l.value === value) || CONFIDENCE_LEVELS[2];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Confidence Rating</span>
        <span className={cn("font-bold", current.color)}>
          {current.value}/5 — {current.label}
        </span>
      </div>

      <div
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label="Confidence Level"
      >
        {CONFIDENCE_LEVELS.map((level) => {
          const isSelected = level.value === value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(level.value)}
              className={cn(
                "flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? cn(level.activeBg, "border-transparent shadow-sm scale-102")
                  : "bg-card hover:bg-muted/40 border-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-0.5 mb-1">
                <Star
                  className={cn(
                    "h-4 w-4",
                    isSelected
                      ? "fill-current text-white"
                      : "text-muted-foreground/60"
                  )}
                />
                <span className="font-bold text-xs sm:text-sm">{level.value}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium leading-tight line-clamp-1">
                {level.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-0.5">
        {current.description}
      </p>
    </div>
  );
}
