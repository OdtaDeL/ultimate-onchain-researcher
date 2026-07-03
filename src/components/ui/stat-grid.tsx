import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface StatGridItem {
  label: string;
  value: ReactNode;
}

interface StatGridProps {
  stats: StatGridItem[];
  isLoading?: boolean;
  className?: string;
}

/**
 * DESIGN_SYSTEM.md "Stat Card" (Grid variant): label in Caption above value
 * in Numeric, 16px gutters, 2 columns. Hard rule: never exceed 4 stats in a
 * single grid — callers split into two `StatGrid`s with their own Section
 * headers (e.g. Project Detail's "Market Metrics" / "Tokenomics") rather
 * than passing more than 4 items here.
 */
export function StatGrid({ stats, isLoading, className }: StatGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="flex flex-col gap-1">
          <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{stat.label}</span>
          {isLoading ? (
            <Skeleton variant="line" className="w-16" />
          ) : (
            <span className="truncate text-[17px] font-semibold leading-[22px] tracking-[-0.1px] tabular-nums text-foreground">{stat.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
