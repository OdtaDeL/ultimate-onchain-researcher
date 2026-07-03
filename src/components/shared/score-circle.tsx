"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, easing, scoreGradeColor, type ScoreGrade } from "@/lib/theme";
import { Pill } from "@/components/ui";

export type ScoreCircleSize = "full" | "compact";

interface ScoreCircleProps {
  /** 0-100. */
  score: number;
  grade: ScoreGrade;
  size?: ScoreCircleSize;
  className?: string;
}

const RING_DIAMETER: Record<ScoreCircleSize, number> = { full: 88, compact: 40 };

/**
 * The product's signature visual — DESIGN_SYSTEM.md Section 9 "Score
 * Circle"/Rule 33: a circular ring around the Score numeral. `full` =
 * 88px ring, 36px numeral, grade Pill beneath (Project Detail). `compact`
 * = 40px ring, 17px numeral only, no label (list/card contexts). The
 * numeral itself never appears without its ring, in either size.
 *
 * Ring fill uses Motion's `pathLength` (0-1) on `motion.circle` — verified
 * against https://motion.dev/docs/react-svg-animation, which documents
 * `pathLength` as a first-class SVG motion value on `circle` elements,
 * rather than hand-computing `stroke-dasharray`/`stroke-dashoffset`.
 */
export function ScoreCircle({ score, grade, size = "compact", className }: ScoreCircleProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const diameter = RING_DIAMETER[size];
  const colors = scoreGradeColor[grade];

  const ring = (
    <div className="relative shrink-0" style={{ width: diameter, height: diameter }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" style={{ width: diameter, height: diameter }}>
        <circle cx={50} cy={50} r={44} fill="none" strokeWidth={10} className="stroke-surface-elevated" />
        <motion.circle
          cx={50}
          cy={50}
          r={44}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          className={colors.ring}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: clamped / 100 }}
          transition={{ duration: duration.standard.s, ease: easing.easeInOut }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-foreground",
          size === "full" ? "text-[36px] font-bold leading-10 tracking-[-0.5px]" : "text-[17px] leading-[22px] tracking-[-0.1px]",
        )}
      >
        {Math.round(clamped)}
      </span>
    </div>
  );

  if (size === "compact") return <div className={className}>{ring}</div>;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {ring}
      <Pill variant="neutral" className={colors.text}>
        {grade}
      </Pill>
    </div>
  );
}
