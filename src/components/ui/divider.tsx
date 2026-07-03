import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type DividerVariant = "inset" | "full";

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DividerVariant;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Hairline separator. DESIGN_SYSTEM.md Section 9: reserved for dense list
 * contexts (between List Item rows) — general layout separation should use
 * whitespace (space-6/space-7), not a Divider. `inset` is the default,
 * matching list-row usage; `full` is for rare full-bleed section breaks.
 */
export function Divider({ variant = "inset", className, ref, ...props }: DividerProps) {
  return (
    <div
      ref={ref}
      role="separator"
      className={cn("h-px bg-border", variant === "inset" && "ml-4", className)}
      {...props}
    />
  );
}
