import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LearnTrackLogoProps {
  variant?: "icon" | "full" | "auth";
  size?: number;
  className?: string;
  priority?: boolean;
  href?: string;
  showTagline?: boolean;
}

export function LearnTrackLogo({
  variant = "full",
  size,
  className,
  priority = false,
  href,
  showTagline = true,
}: LearnTrackLogoProps) {
  // Determine dimensions based on variant
  const dimension = size || (variant === "auth" ? 64 : variant === "icon" ? 36 : 40);

  const iconMarkup = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden shrink-0 border border-border/50 bg-white shadow-xs",
        variant === "auth" && "h-16 w-16 rounded-2xl border-border/60 shadow-md",
        variant === "icon" && "h-9 w-9",
        variant === "full" && "h-10 w-10",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src="/logo.png"
        alt="LearnTrack Logo"
        width={dimension}
        height={dimension}
        className="h-full w-full object-contain p-0.5"
        priority={priority}
      />
    </div>
  );

  if (variant === "icon" || variant === "auth") {
    if (href) {
      return (
        <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
          {iconMarkup}
        </Link>
      );
    }
    return iconMarkup;
  }

  // "full" variant includes Brand Text
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      {iconMarkup}
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-base tracking-tight text-foreground truncate">
          LearnTrack
        </span>
        {showTagline && (
          <span className="text-[11px] font-medium text-muted-foreground truncate">
            Deliberate Practice
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
