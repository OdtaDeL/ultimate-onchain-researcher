/**
 * Elevation / shadow tokens — DESIGN_SYSTEM.md Section 7.
 * Dark theme (primary) leans on background-color contrast, not shadow, for most
 * surfaces — `flat` is the default there. Light theme (secondary, equally premium)
 * uses real shadows to lift cards off the page. Never stack both signals on the
 * same surface (Section 7 "When to avoid shadows").
 */
export const shadow = {
  /** Level 0 — default for most dark-theme surfaces. No shadow; separation via color contrast alone. */
  flat: "shadow-none",
  /** Level 1 — cards on light theme; subtle lift. */
  raised: "shadow-sm",
  /** Level 2 — sticky header once content scrolls beneath it (both themes). */
  floating: "shadow-md",
  /** Level 3 — Bottom Sheets, Modals, Toasts. Strongest in the system, overlays only. */
  overlay: "shadow-xl",
  /** Level 4 — Tooltips, small contextual popovers. Strong but small-radius. */
  popover: "shadow-lg",
} as const;

export type ShadowToken = keyof typeof shadow;

/**
 * Glass / blur effect — permitted in exactly two places: the sticky top header
 * once scrolled, and the bottom navigation bar. Never on cards or sheets.
 */
export const glass = "backdrop-blur-lg bg-surface/80";
