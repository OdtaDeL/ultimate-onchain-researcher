"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";
import { HorizontalScroller } from "./horizontal-scroller";

export interface FilterBarFilter {
  key: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterBarFilter[];
  /** UI-only — no filtering logic lives here. The caller decides what (if anything) happens, e.g. opening a filter sheet in a future pass. */
  onFilterPress?: (key: string) => void;
  className?: string;
}

/**
 * Horizontal row of tap-only filter pills (Category/Chain/Stage/Score on
 * Markets). Reuses HorizontalScroller's scroll shell rather than
 * re-implementing the overflow-x styling — this is purely a row of buttons,
 * not a new scroll container. 44px touch target per pill, matching the
 * SegmentedControl fix from the Home interaction-polish pass.
 */
export function FilterBar({ filters, onFilterPress, className }: FilterBarProps) {
  return (
    <HorizontalScroller className={className}>
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onFilterPress?.(filter.key)}
          className={cn(
            "flex h-11 items-center gap-1 bg-surface-elevated px-3.5 text-[13px] font-medium leading-[18px] tracking-[0.1px] text-foreground",
            radius.pill,
          )}
        >
          {filter.label}
          <ChevronDown size={14} />
        </button>
      ))}
    </HorizontalScroller>
  );
}
