import Link from "next/link";
import { LearnTrackLogo } from "@/components/common/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-card/40 backdrop-blur-xs text-xs text-muted-foreground pb-20 lg:pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Learning Invariant */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <LearnTrackLogo variant="icon" size={28} priority={false} />
            <div>
              <p className="font-semibold text-foreground text-sm">
                LearnTrack <span className="font-normal text-xs text-muted-foreground">— Deliberate Practice</span>
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                45-minute focus blocks • 4-stage automated spaced revisions (Day 0, +3, +15, +30).
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center"
            >
              Dashboard
            </Link>
            <Link
              href="/planner"
              className="hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center"
            >
              Planner
            </Link>
            <Link
              href="/focus"
              className="hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center"
            >
              Focus
            </Link>
            <Link
              href="/revisions"
              className="hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center"
            >
              Revisions
            </Link>
            <Link
              href="/settings"
              className="hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/70">
          <p>© {currentYear} LearnTrack. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Secure production environment</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
