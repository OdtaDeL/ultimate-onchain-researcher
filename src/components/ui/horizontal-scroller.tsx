import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollerProps {
  children: ReactNode;
  /** Snap-to-card on scroll release — the primary/hero carousel pattern (Weekly Picks). Free-scroll (default) for lower-emphasis rows. */
  snap?: boolean;
  className?: string;
}

/**
 * Extracted from the Home implementation: every horizontally-scrolling
 * carousel in this product (Weekly Picks, Related Projects, Markets
 * trending rows) shares the same shell — 16px edge insets, 12px gaps
 * between cards, no scrollbar, optional scroll-snap. DESIGN_SYSTEM.md Rule
 * 44: never combine a Carousel with visible pagination dots — the
 * partially-cut-off next card (achieved simply by not constraining the
 * container's width) is the only "more exists" affordance.
 *
 * Telegram Mini App touch tuning, applied when `snap`: `scroll-pl-4` aligns
 * the snap origin with the same 16px inset the cards start at (otherwise the
 * first card would be the only one not flush against the edge after a
 * snap); `touch-pan-x` scopes this element's gesture handling to the
 * horizontal axis only, so the surrounding page's vertical scroll is never
 * contested; `-webkit-overflow-scrolling: touch` keeps iOS momentum/inertia
 * scrolling enabled (it is opt-in, not default, in WKWebView — the Telegram
 * iOS client's renderer).
 */
export function HorizontalScroller({ children, snap = false, className }: HorizontalScrollerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto px-4 [-webkit-overflow-scrolling:touch] touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        snap && "snap-x snap-mandatory scroll-pl-4",
        className,
      )}
    >
      {Children.map(children, (child, index) => (
        <div key={index} className={cn("shrink-0", snap && "snap-start")}>
          {child}
        </div>
      ))}
    </div>
  );
}
