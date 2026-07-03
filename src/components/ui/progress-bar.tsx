"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, easing } from "@/lib/theme";

export type ProgressBarVariant = "linear" | "segmented";

interface ProgressBarProps {
  /** 0-100. Reserved for genuinely bounded values only — never an unbounded percentage. */
  value: number;
  variant?: ProgressBarVariant;
  /** Tailwind background color class for the filled portion, e.g. "bg-score-a". Defaults to the accent. */
  fillClassName?: string;
  /** Number of dots for the `segmented` variant. */
  segments?: number;
  className?: string;
}

/**
 * Visualizes a bounded value (Score out of 100, supply-unlocked %).
 * DESIGN_SYSTEM.md Section 9 "Progress Bar": never use for anything
 * unbounded. Fill animates via `scaleX` (transform), not `width`, so the
 * fill-in never triggers layout reflow (`transform-performance` rule).
 */
export function ProgressBar({ value, variant = "linear", fillClassName = "bg-accent", segments = 10, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  if (variant === "segmented") {
    const filledCount = Math.round((clamped / 100) * segments);
    return (
      <div role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} className={cn("flex items-center gap-1", className)}>
        {Array.from({ length: segments }).map((_, i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i < filledCount ? fillClassName : "bg-surface-elevated")} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-elevated", className)}
    >
      <motion.div
        className={cn("absolute inset-y-0 left-0 w-full origin-left rounded-full", fillClassName)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: duration.standard.s, ease: easing.easeInOut }}
      />
    </div>
  );
}
