/**
 * Border radius tokens — DESIGN_SYSTEM.md Section 6.
 * Radius scales with a component's visual "weight." Never mix radius tokens
 * within the same component family (e.g. every card in one carousel shares a radius).
 */
export const radius = {
  /** 8px — chips, small inline tags, text-line skeletons. */
  sm: "rounded-[8px]",
  /** 12px — buttons, compact-density list-row cards, inputs. */
  md: "rounded-[12px]",
  /** 16px — standard cards. */
  lg: "rounded-[16px]",
  /** 20px — hero-level cards, the Score card specifically. */
  xl: "rounded-[20px]",
  /** 24px, top corners only — Bottom Sheets. */
  sheet: "rounded-t-[24px]",
  /** 50% — avatars and entity logos. No exceptions. */
  avatar: "rounded-full",
  /** 6px — notification badges, small status indicators. */
  badge: "rounded-[6px]",
  /** 999px — segmented controls, filter chips, grade badges. */
  pill: "rounded-full",
} as const;

export type RadiusToken = keyof typeof radius;
