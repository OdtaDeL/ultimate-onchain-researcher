import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/format";

interface PercentageProps {
  value: number;
  /** Below this absolute value, render as flat/neutral rather than up/down. DESIGN_SYSTEM.md "Trend Arrow" Flat variant. */
  flatThreshold?: number;
  /** Hide the directional arrow icon (rare — DESIGN_SYSTEM Anti-pattern: never show a Trend Arrow without its paired %, but the inverse is allowed if space-constrained and another cue exists). */
  hideIcon?: boolean;
  className?: string;
}

/**
 * Directional percentage change. Color is never the sole signal
 * (`color-not-only` a11y guideline / DESIGN_SYSTEM Section 12): the arrow
 * icon and the explicit +/- sign both carry the same meaning the color
 * reinforces. `bullish`/`bearish` map 1:1 to `success`/`danger` and are
 * used exclusively for directional price/score deltas.
 */
export function Percentage({ value, flatThreshold = 0.05, hideIcon = false, className }: PercentageProps) {
  const isFlat = Math.abs(value) < flatThreshold;
  const isUp = !isFlat && value > 0;
  const colorClass = isFlat ? "text-muted-foreground" : isUp ? "text-bullish" : "text-bearish";
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <span className={cn("inline-flex items-center gap-0.5 tabular-nums", colorClass, className)}>
      {!hideIcon ? <Icon size={16} /> : null}
      {formatPercentage(value)}
    </span>
  );
}
