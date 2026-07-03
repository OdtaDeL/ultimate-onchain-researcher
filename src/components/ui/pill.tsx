import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type PillVariant = "neutral" | "accent" | "success" | "warning" | "danger";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  ref?: React.Ref<HTMLSpanElement>;
}

const variantClass: Record<PillVariant, string> = {
  neutral: "bg-surface-elevated text-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

/**
 * Compact, fully-rounded static label (Score grade badge, "Academy Member"
 * tag). DESIGN_SYSTEM.md Section 9: never put more than 2 words inside a
 * Pill; never make it interactive — that's Chip's job (out of scope for
 * this UI Foundation pass).
 */
export function Pill({ variant = "neutral", className, ref, ...props }: PillProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold leading-[14px] tracking-[0.2px]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
