"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Loader2, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { logoutApi } from "@/lib/api/auth";
import { usePwa } from "@/components/pwa/pwa-provider";

interface UserMenuProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { isInstallable, installApp } = usePwa();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logoutApi();
    } catch {
      // Handled: logoutApi cleans up client auth tokens
    } finally {
      // Replace browser history so Back button does not restore authenticated UI
      window.location.replace("/login");
    }
  };

  const displayName = user?.name || "Learner";
  const displayEmail = user?.email || "Signed In";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs transition-all hover:bg-primary/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User profile and settings"
        >
          {initials ? <span>{initials}</span> : <User className="h-4 w-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isInstallable && (
          <>
            <DropdownMenuItem
              onClick={installApp}
              className="flex items-center gap-2 text-primary font-medium cursor-pointer"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Install App</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          {isSigningOut ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </div>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
