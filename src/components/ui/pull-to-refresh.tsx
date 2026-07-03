"use client";

import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Extracted from the Home implementation. This is deliberately a
 * tap-triggered placeholder, not a gesture-drag implementation: a real
 * elastic pull gesture would share the same vertical pointer axis as the
 * page's own scroll container, which is exactly the gesture-conflict
 * INTERACTION_SPEC.md Section 1.1 warns against ("avoid nested scroll
 * regions / gesture conflicts"). Wiring genuine drag physics is real
 * follow-up work, not something to fake here. Meets the 44px touch-target
 * minimum either way.
 */
export function PullToRefresh({ onRefresh, isRefreshing = false, className }: PullToRefreshProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-label="Refresh"
      className={cn("flex h-11 w-full items-center justify-center gap-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground", className)}
    >
      <RotateCw size={16} className={cn(isRefreshing && "animate-spin")} />
      {isRefreshing ? "Refreshing…" : "Pull to refresh"}
    </button>
  );
}
