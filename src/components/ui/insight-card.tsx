import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

export interface InsightCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/**
 * One labeled insight tile (e.g. "Most active this month" → "3 deals").
 * Generic and entity-agnostic — composed from the existing Card primitive
 * (`compact` density) rather than a one-off layout, so any future detail
 * screen needing a small "here's something noteworthy" tile reuses this
 * instead of inventing another stat-tile shape.
 */
export function InsightCard({ icon, label, value, isLoading, className }: InsightCardProps) {
  return (
    <Card variant="compact" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[13px] leading-[18px] tracking-[0.1px]">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton variant="line" className="w-16" />
      ) : (
        <span className="line-clamp-1 text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground">{value}</span>
      )}
    </Card>
  );
}
