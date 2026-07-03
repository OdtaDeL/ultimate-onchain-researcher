import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type SkeletonVariant = "block" | "line" | "circle";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  ref?: React.Ref<HTMLDivElement>;
}

const variantRadius: Record<SkeletonVariant, string> = {
  block: radius.md,
  line: radius.sm,
  circle: radius.avatar,
};

/**
 * Loading placeholder matching the exact shape of pending content.
 * DESIGN_SYSTEM.md Section 9: width/height are always supplied by the
 * consumer via className/style to match the real content's footprint —
 * never a generic mismatched-size block. Marked as a loading region for
 * assistive technology (DESIGN_SYSTEM Section 12).
 */
export function Skeleton({ variant = "block", className, ref, ...props }: SkeletonProps) {
  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-shimmer bg-surface-elevated",
        variant !== "line" && variantRadius[variant],
        variant === "line" && cn(variantRadius.line, "h-3.5 w-full"),
        className,
      )}
      {...props}
    />
  );
}
