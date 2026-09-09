import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/common/user-menu";

interface HeaderProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 md:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
          Learning Workspace
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Learning Streak Indicator */}
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 py-1 px-3 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-medium"
        >
          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Consistency Streak: 0 Days</span>
        </Badge>

        {/* Authenticated User Menu */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
