"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Timer,
  Repeat,
  CalendarDays,
  BarChart3,
  Settings,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Planner", href: "/planner", icon: CalendarRange },
  { name: "Focus Timer", href: "/focus", icon: Timer },
  { name: "Revision Center", href: "/revisions", icon: Repeat },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card/60 backdrop-blur-sm select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BookOpenCheck className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-foreground">
            LearnTrack
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Deliberate Practice
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4" aria-label="Main Navigation">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Learning Invariant Footer Strip */}
      <div className="p-4 border-t border-border/70 m-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Learning Invariant</p>
        <p className="text-[11px] leading-relaxed">
          45m Focus Blocks • Automated 4-Interval Spaced Revisions (Day 0, +3, +15, +30).
        </p>
      </div>
    </aside>
  );
}
