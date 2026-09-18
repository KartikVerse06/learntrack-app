import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/common/user-menu";
import { LearnTrackLogo } from "@/components/common/logo";

interface HeaderProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-3 sm:px-6 md:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center shrink-0">
          <LearnTrackLogo variant="icon" href="/dashboard" size={32} priority />
        </div>
        <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-foreground truncate">
          Learning Workspace
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Learning Streak Indicator */}
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 py-1 px-2.5 sm:px-3 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-medium text-xs shadow-2xs"
          title="Daily Learning Consistency Streak: 0 Days"
        >
          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="hidden sm:inline">Consistency Streak: </span>
          <span className="font-semibold font-mono">0 Days</span>
        </Badge>

        {/* Authenticated User Menu */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
