"use client";

import { useState } from "react";
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
  MoreHorizontal,
  X,
  Wallet,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planner", href: "/planner", icon: CalendarRange },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Revisions", href: "/revisions", icon: Repeat },
];

const secondaryNavItems = [
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Money", href: "/money", icon: Wallet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = secondaryNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <>
      {/* Mobile "More" Drawer / Backdrop */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in-0 duration-150"
          onClick={() => setIsMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMoreOpen && (
        <div
          className="fixed bottom-16 left-0 right-0 z-45 mx-3 mb-2 rounded-2xl border bg-card/95 backdrop-blur-md p-4 shadow-2xl lg:hidden animate-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Additional Navigation Options"
        >
          <div className="flex items-center justify-between pb-3 border-b mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              More Workspaces
            </span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[68px] active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-muted/30 text-foreground hover:bg-accent border-border/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-1.5", isActive ? "text-primary-foreground" : "text-primary")} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t bg-background/95 px-1 backdrop-blur shadow-lg lg:hidden select-none safe-area-pb"
        aria-label="Mobile Navigation"
      >
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMoreOpen(false)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors min-h-[48px] min-w-[48px] rounded-lg",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary stroke-[2.5]" : "text-muted-foreground")} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* More Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors min-h-[48px] min-w-[48px] rounded-lg",
            isMoreActive || isMoreOpen
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground active:scale-95"
          )}
          aria-expanded={isMoreOpen}
          aria-label="More navigation links"
        >
          <MoreHorizontal className={cn("h-5 w-5 mb-0.5", isMoreActive || isMoreOpen ? "text-primary stroke-[2.5]" : "text-muted-foreground")} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
