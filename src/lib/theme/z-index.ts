/**
 * Z-index scale — LAYOUT_SPEC.md / UX guideline `z-index-management`.
 * A flat, named stacking order prevents ad hoc `z-50`-vs-`z-[9999]` guessing as
 * overlay components are added. Use via Tailwind arbitrary values, e.g.
 * `className={`z-[${zIndex.bottomNav}]`}` or inline `style={{ zIndex: zIndex.modal }}`.
 */
export const zIndex = {
  base: 0,
  /** Sticky top header. */
  header: 10,
  /** Sticky filter/segment row beneath the header (Markets-style screens). */
  stickyFilter: 15,
  /** Bottom Navigation bar. */
  bottomNav: 20,
  /** Scrim behind a Modal or Bottom Sheet. */
  scrim: 40,
  /** Bottom Sheet content. */
  sheet: 45,
  /** Modal content — above sheets, decisions take precedence. */
  modal: 50,
  /** Toast — must float above any open overlay to confirm an action. */
  toast: 60,
  /** Tooltip / popover — highest, transient, dismiss-on-outside-tap. */
  popover: 70,
} as const;

export type ZIndexToken = keyof typeof zIndex;
