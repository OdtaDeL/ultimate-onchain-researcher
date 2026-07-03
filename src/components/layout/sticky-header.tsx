import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { glass, zIndex } from "@/lib/theme";

interface StickyHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * The sticky-within-scroll-container header recipe — `sticky top-0` +
 * glass + the header z-index — used by every tab page that needs its own
 * per-page header content (Markets, Search, Watchlist, Profile) now that
 * `BottomNavigation` lives in the shared `(tabs)` layout and `PageLayout`'s
 * own `header` slot is only used by Project/Fund Detail, which sit outside
 * that route group. Extracted because this exact 3-class recipe was
 * duplicated verbatim across 4 page files plus `PageLayout` itself.
 */
export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <div className={cn("sticky top-0 shrink-0", glass, className)} style={{ zIndex: zIndex.header }}>
      {children}
    </div>
  );
}
