/**
 * 8pt spacing scale — DESIGN_SYSTEM.md Section 3.
 * Every value is a multiple of 4, base unit 8. Never use a value outside this scale.
 *
 * Tailwind v4's numeric spacing utilities (`p-4`, `gap-6`, ...) already compute as
 * `n * --spacing` (default `--spacing: 0.25rem` = 4px), so they natively express a
 * 4px-base scale. Rather than redefining `--spacing-*` CSS variables (which would
 * silently override Tailwind's own generated utilities for those same numeric
 * steps), this module exports the design system's *named* tokens as a lookup table
 * mapping each `space-N` name to its pixel value and the Tailwind numeric suffix
 * that already produces it. Components reference these names; Tailwind classes are
 * composed from `space.<token>.tw` rather than hardcoded numerals.
 */
export const space = {
  /** 4px — icon-to-label gap, divider insets. */
  space1: { px: 4, tw: "1" },
  /** 8px — stacked text line gap, dense list row gap. */
  space2: { px: 8, tw: "2" },
  /** 12px — compact component padding, carousel card gap. */
  space3: { px: 12, tw: "3" },
  /** 16px — the default: screen margins, card padding, inline element gaps. */
  space4: { px: 16, tw: "4" },
  /** 20px — section header to first content row, when extra room is needed. */
  space5: { px: 20, tw: "5" },
  /** 24px — gap between major sections. */
  space6: { px: 24, tw: "6" },
  /** 32px — hero element breathing room. */
  space7: { px: 32, tw: "8" },
  /** 40px — empty/splash vertical centering offsets. */
  space8: { px: 40, tw: "10" },
  /** 48px — large empty-state illustration spacing. */
  space9: { px: 48, tw: "12" },
  /** 64px — splash-only top breathing room. */
  space10: { px: 64, tw: "16" },
} as const;

export type SpaceToken = keyof typeof space;

/** Screen-level grid constants — DESIGN_SYSTEM.md Section 2. */
export const grid = {
  referenceWidth: 390,
  minWidth: 360,
  screenMargin: space.space4.px,
  safeAreaTopMin: 44,
  safeAreaTopMax: 54,
  safeAreaBottom: 34,
  headerHeight: 56,
  headerCollapsedHeight: 44,
  bottomNavBarHeight: 56,
  bottomNavTotalHeight: 90,
} as const;
