"use client";

import { Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card, ProgressBar, Skeleton } from "@/components/ui";
import { fngBandFromValue, fngBandColor, fngBandLabel, motionPreset, duration, easing } from "@/lib/theme";

export interface FearGreedCardProps {
  /** 0-100 index value. */
  value: number;
  /** Optional context label, e.g. "Updated today". */
  asOfLabel?: string;
  onInfoPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

// `--color-fng-1..5` are registered under `@theme inline` in globals.css,
// so Tailwind generates the full bg/text/border utility set for them
// (verified against Tailwind's theme docs: each `--color-*` namespace
// entry produces bg-*/text-*/border-* utilities). `colorToken`/`fngBandColor`
// in src/lib/theme only export the `text-*` form; the `bg-*` form below is
// the same generated utility, just not pre-exported there.
const fngBandBgClass = {
  "extreme-fear": "bg-fng-1",
  fear: "bg-fng-2",
  neutral: "bg-fng-3",
  greed: "bg-fng-4",
  "extreme-greed": "bg-fng-5",
} as const;

/**
 * Market sentiment gauge. DESIGN_SYSTEM.md Section 5 "Fear & Greed Colors":
 * a 5-band gradient, value + explicit band label together (color is
 * reinforcement, never the sole signal — `color-not-only`).
 */
export function FearGreedCard({ value, asOfLabel, onInfoPress, isLoading, className }: FearGreedCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <Skeleton variant="line" className="w-24" />
        <Skeleton variant="line" className="mt-3 w-16" />
        <Skeleton variant="block" className="mt-3 h-2 w-full" />
      </Card>
    );
  }

  const clamped = Math.min(100, Math.max(0, value));
  const band = fngBandFromValue(clamped);

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card className={className}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Fear &amp; Greed</span>
          {onInfoPress ? (
            <button type="button" onClick={onInfoPress} aria-label="What is Fear &amp; Greed?" className="flex size-11 items-center justify-center text-muted-foreground">
              <Info size={16} />
            </button>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.quick.s, ease: easing.easeOut }}
          className={`mt-1 text-[17px] font-semibold leading-[22px] tracking-[-0.1px] ${fngBandColor[band]}`}
        >
          {Math.round(clamped)} · {fngBandLabel[band]}
        </motion.div>

        <ProgressBar value={clamped} fillClassName={fngBandBgClass[band]} className="mt-3" />

        {asOfLabel ? <p className="mt-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{asOfLabel}</p> : null}
      </Card>
    </motion.div>
  );
}
