/**
 * Animation tokens — DESIGN_SYSTEM.md Section 10.
 * Motion is functional, not decorative: every animation maintains spatial
 * continuity or confirms an action registered. These are exported as plain JS
 * values (seconds + easing arrays) because Framer Motion's `transition` prop
 * consumes JS, not CSS custom properties. Verified against the Motion docs
 * (https://motion.dev/docs/react-transitions): `duration` is in seconds
 * (default 0.3), `ease` accepts a 4-number cubic-bezier array.
 */

/** Duration tokens, in seconds (Framer Motion's unit) and milliseconds (for CSS-driven cases). */
export const duration = {
  /** 0-50ms — state changes with no perceptible transition needed. */
  instant: { s: 0.05, ms: 50 },
  /** 150-200ms — micro-interactions, button presses, toggles. */
  quick: { s: 0.18, ms: 180 },
  /** 250-300ms — page transitions, sheet/modal entrances. */
  standard: { s: 0.28, ms: 280 },
  /** 350-450ms — hero moments: Splash exit, Score reveal. */
  deliberate: { s: 0.4, ms: 400 },
} as const;

export type DurationToken = keyof typeof duration;

/** Cubic-bezier easing curves matching DESIGN_SYSTEM's named curves. */
export const easing = {
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeIn: [0.7, 0, 0.84, 0] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  linear: [0, 0, 1, 1] as const,
} as const;

/** Ready-to-spread Framer Motion transition presets for the most common interactions. */
export const motionPreset = {
  /** Button/card press feedback: scale 1 -> 0.97, quick, ease-out. */
  press: {
    whileTap: { scale: 0.97, opacity: 0.95 },
    transition: { duration: duration.instant.s, ease: easing.easeOut },
  },
  /** Skeleton -> content cross-fade, zero layout shift. */
  skeletonFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.quick.s, ease: easing.easeInOut },
  },
  /** Generic fade-in entrance for cards appearing in a list/carousel. */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: duration.quick.s, ease: easing.easeOut },
  },
  /** Bottom Sheet / modal-adjacent slide-up entrance. */
  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { duration: duration.standard.s, ease: easing.easeOut },
  },
} as const;

/** Per-item stagger delay for list/carousel entrance animations (max ~5 items staggered). */
export const staggerDelay = 0.03;

/** Shimmer sweep duration for Skeleton components (continuous loop, not a one-shot transition). */
export const shimmerDurationMs = 1200;
