"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, easing, shadow } from "@/lib/theme";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Generic tab switcher — DESIGN_SYSTEM.md radius.pill is documented for
 * exactly this component. The active indicator is a single shared-layoutId
 * element that Framer Motion slides between tabs, rather than each tab
 * independently animating its own background (avoids the "two pills
 * cross-fading" look). Not tied to Trending — any screen needing a 2-5 way
 * single-select tab switch can reuse this.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div role="tablist" className={cn("flex gap-1 rounded-full bg-surface-elevated p-1", className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className="relative flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-[13px] font-semibold leading-[18px] tracking-[0.1px] outline-none"
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className={cn("absolute inset-0 rounded-full bg-bg", shadow.raised)}
                transition={{ duration: duration.quick.s, ease: easing.easeInOut }}
              />
            ) : null}
            <span className={cn("relative z-10", isActive ? "text-foreground" : "text-muted-foreground")}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
