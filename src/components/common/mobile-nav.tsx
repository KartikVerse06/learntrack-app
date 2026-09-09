"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Timer,
  Repeat,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planner", href: "/planner", icon: CalendarRange },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Revisions", href: "/revisions", icon: Repeat },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t bg-background/95 px-2 backdrop-blur lg:hidden"
      aria-label="Mobile Navigation"
    >
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
