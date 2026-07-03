import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "dot" | "counter";

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  /** Omit for `dot`. For `counter`, a value of 0 renders nothing (DESIGN_SYSTEM: never show an empty/zero badge). */
  count?: number;
  ref?: React.Ref<HTMLSpanElement>;
}

/**
 * Small numeric/status indicator overlaid on a host element (bell icon,
 * bottom-nav icon, Watchlist row trailing dot). DESIGN_SYSTEM.md Section 9
 * "Badge": positioned top-right of its host, overlapping ~25% of its own
 * size. Wrap the host in a `relative` container; Badge supplies its own
 * absolute offset.
 */
export function Badge({ variant = "dot", count, className, ref, ...props }: BadgeProps) {
  if (variant === "counter" && (count === undefined || count <= 0)) return null;

  return (
    <span
      ref={ref}
      aria-hidden={variant === "dot" ? true : undefined}
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center bg-danger text-[10px] font-semibold text-white",
        variant === "dot" ? "size-2 rounded-full" : "h-4 min-w-4 rounded-full px-1",
        className,
      )}
      {...props}
    >
      {variant === "counter" ? (count! > 9 ? "9+" : count) : null}
    </span>
  );
}
