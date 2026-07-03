import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoadingVariant = "spinner" | "full-page";

interface LoadingProps {
  variant?: LoadingVariant;
  /** Spinner pixel size for the `spinner` variant. DESIGN_SYSTEM.md: 20-24px, centered within its container. */
  size?: 20 | 24;
  className?: string;
  /** Accessible label announced by screen readers while loading. */
  label?: string;
}

/**
 * DESIGN_SYSTEM.md Section 9 "Loading State": spinners are reserved for
 * full-page loads (Splash) and button-submission states only — everything
 * else uses Skeleton. Rotation: ~1 full turn per 1000ms, matching Tailwind's
 * built-in `animate-spin` (1s linear infinite) exactly, so no custom
 * keyframe is needed here.
 */
export function Loading({ variant = "spinner", size = 24, className, label = "Loading" }: LoadingProps) {
  const spinner = <Loader2 role="status" aria-label={label} size={size} className={cn("animate-spin text-muted-foreground", className)} />;

  if (variant === "full-page") {
    return <div className="flex min-h-dvh w-full items-center justify-center">{spinner}</div>;
  }

  return <div className="flex items-center justify-center">{spinner}</div>;
}
