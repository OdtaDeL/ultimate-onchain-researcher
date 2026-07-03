import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { glass, grid, zIndex } from "@/lib/theme";
import { StickyHeader } from "./sticky-header";

interface PageLayoutProps {
  /** Sticky Top App Bar content. Omit for screens with no header (none in this product per DESIGN_SYSTEM Section 11). */
  header?: ReactNode;
  /** Sticky Bottom Navigation. Hidden by the consumer during keyboard focus — this component only provides the slot and content inset. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The structural skeleton every Screen Template (DESIGN_SYSTEM.md Section
 * 11) is built from: sticky header, one scrollable body, sticky footer.
 * Reserves bottom padding equal to the Bottom Navigation's total height
 * (LAYOUT_SPEC.md Section 1 "Content inset rule") so the last item in any
 * list is never obscured — applied here once rather than per screen.
 */
export function PageLayout({ header, footer, children, className }: PageLayoutProps) {
  return (
    <div className="flex h-dvh w-full flex-col">
      {header ? <StickyHeader>{header}</StickyHeader> : null}

      <main
        className={cn("flex-1 overflow-y-auto overscroll-y-contain", className)}
        style={{ paddingBottom: footer ? grid.bottomNavTotalHeight : undefined }}
      >
        {children}
      </main>

      {footer ? (
        <div className={cn("fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] shrink-0", glass)} style={{ zIndex: zIndex.bottomNav }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
