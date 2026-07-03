import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>;
}

/**
 * A named, vertically-stacked content block within a Page (e.g. "WEEKLY
 * PICKS", "MARKET FEED"). COMPONENT_SPEC.md Section 2: a Section never
 * contains another Section — it stacks Cards, a List, or a Carousel.
 * Carries the standard 24px gap from the previous section
 * (DESIGN_SYSTEM.md Section 3 `space-6`) via margin so screens compose
 * sections by simply listing them in order.
 */
export function Section({ className, ref, ...props }: SectionProps) {
  return <section ref={ref} className={cn("mt-6 first:mt-0", className)} {...props} />;
}
