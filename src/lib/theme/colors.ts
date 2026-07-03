/**
 * Color tokens — DESIGN_SYSTEM.md Section 5.
 * Actual color values (oklch) are defined once in `src/app/globals.css` under
 * `:root` / `.dark` and exposed to Tailwind via the `@theme inline` `--color-*`
 * namespace (see Tailwind v4 theme docs: https://tailwindcss.com/docs/theme).
 * This module is the TypeScript-side mirror of those token *names* — components
 * reference these instead of writing `bg-[#...]` or `text-[#...]` literals.
 *
 * One primary accent only. Never introduce a second accent hue (Rule: DESIGN_SYSTEM
 * Section 5 "Hard rule" + Anti-pattern 6). Never color-code by category (Rule 17).
 */
export const colorToken = {
  bg: "bg-bg",
  surface: "bg-surface",
  surfaceElevated: "bg-surface-elevated",
  border: "border-border",
  textPrimary: "text-foreground",
  textSecondary: "text-muted-foreground",
  textTertiary: "text-tertiary",
  accent: "text-accent",
  accentBg: "bg-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  bullish: "text-bullish",
  bearish: "text-bearish",
} as const;

export type ColorToken = keyof typeof colorToken;

import type { Grade } from "@/scoring/types";
/** Score grade -> color family. DESIGN_SYSTEM Section 5 "Score Colors". Never the score numeral itself — only grade badge/progress fill. */
export type ScoreGrade = Grade;

export const scoreGradeColor: Record<ScoreGrade, { text: string; bg: string; ring: string }> = {
  "A+": { text: "text-score-a", bg: "bg-score-a", ring: "stroke-score-a" },
  A: { text: "text-score-a", bg: "bg-score-a", ring: "stroke-score-a" },
  B: { text: "text-score-b", bg: "bg-score-b", ring: "stroke-score-b" },
  C: { text: "text-score-c", bg: "bg-score-c", ring: "stroke-score-c" },
  D: { text: "text-score-d", bg: "bg-score-d", ring: "stroke-score-d" },
};

/** Fear & Greed 5-band gradient. DESIGN_SYSTEM Section 5 "Fear & Greed Colors". */
export type FngBand = "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";

export const fngBandColor: Record<FngBand, string> = {
  "extreme-fear": "text-fng-1",
  fear: "text-fng-2",
  neutral: "text-fng-3",
  greed: "text-fng-4",
  "extreme-greed": "text-fng-5",
};

/** Pure classification helper — maps a 0-100 index value to its band. No I/O, no business logic. */
export function fngBandFromValue(value: number): FngBand {
  if (value <= 24) return "extreme-fear";
  if (value <= 44) return "fear";
  if (value <= 55) return "neutral";
  if (value <= 75) return "greed";
  return "extreme-greed";
}

export const fngBandLabel: Record<FngBand, string> = {
  "extreme-fear": "Extreme Fear",
  fear: "Fear",
  neutral: "Neutral",
  greed: "Greed",
  "extreme-greed": "Extreme Greed",
};
