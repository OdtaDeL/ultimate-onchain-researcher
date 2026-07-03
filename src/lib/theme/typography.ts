/**
 * Typography system — DESIGN_SYSTEM.md Section 4.
 * Exactly 10 styles exist in this product. Never invent an 11th in implementation —
 * extend this file first. Each entry composes Tailwind utility classes directly so
 * components never hand-roll a `text-[15px]` arbitrary value.
 */
export const typography = {
  /** 700/28px/34px/-0.2px — Splash tagline, large empty-state headlines only. Rare, ceremonial. */
  display: {
    className: "text-[28px] font-bold leading-[34px] tracking-[-0.2px]",
    size: 28,
    lineHeight: 34,
    weight: 700,
    letterSpacing: -0.2,
  },
  /** 700/20px/26px/-0.1px — Screen titles, project/fund name on Hero. */
  heading: {
    className: "text-xl font-bold leading-[26px] tracking-[-0.1px]",
    size: 20,
    lineHeight: 26,
    weight: 700,
    letterSpacing: -0.1,
  },
  /** 600/17px/22px/0 — Section headers, card titles. */
  title: {
    className: "text-[17px] font-semibold leading-[22px]",
    size: 17,
    lineHeight: 22,
    weight: 600,
    letterSpacing: 0,
  },
  /** 500/15px/20px/0 — Section subtitles, list item primary text. */
  subtitle: {
    className: "text-[15px] font-medium leading-5",
    size: 15,
    lineHeight: 20,
    weight: 500,
    letterSpacing: 0,
  },
  /** 400/15px/22px/0 — Paragraph text, descriptions. */
  body: {
    className: "text-[15px] font-normal leading-[22px]",
    size: 15,
    lineHeight: 22,
    weight: 400,
    letterSpacing: 0,
  },
  /** 400/13px/18px/0.1px — Labels above values, timestamps, muted helper text. */
  caption: {
    className: "text-[13px] font-normal leading-[18px] tracking-[0.1px]",
    size: 13,
    lineHeight: 18,
    weight: 400,
    letterSpacing: 0.1,
  },
  /** 600/11px/14px/0.2px — Grade letters, status pills, membership tag text. */
  badge: {
    className: "text-[11px] font-semibold leading-[14px] tracking-[0.2px]",
    size: 11,
    lineHeight: 14,
    weight: 600,
    letterSpacing: 0.2,
  },
  /** 600/15px/20px/0 — Button labels, text-links. */
  button: {
    className: "text-[15px] font-semibold leading-5",
    size: 15,
    lineHeight: 20,
    weight: 600,
    letterSpacing: 0,
  },
  /** 600/17px/22px/-0.1px — Prices, percentages, stat values. Tabular figures to prevent jitter. */
  numeric: {
    className: "text-[17px] font-semibold leading-[22px] tracking-[-0.1px] tabular-nums",
    size: 17,
    lineHeight: 22,
    weight: 600,
    letterSpacing: -0.1,
  },
  /** 700/36px/40px/-0.5px — The Score number only. Reserved exclusively for this purpose. */
  score: {
    className: "text-[36px] font-bold leading-10 tracking-[-0.5px] tabular-nums",
    size: 36,
    lineHeight: 40,
    weight: 700,
    letterSpacing: -0.5,
  },
} as const;

export type TypographyToken = keyof typeof typography;
