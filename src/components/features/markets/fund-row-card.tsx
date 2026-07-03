"use client";

import { motion } from "framer-motion";
import { Card, Skeleton } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { motionPreset } from "@/lib/theme";

export interface FundRowCardProps {
  slug?: string;
  name: string;
  logoUrl?: string | null;
  portfolioProjectCount: number;
  /** Absent when the backend provides no "recent" time-window count; card shows "—" when missing. */
  recentInvestmentCount?: number;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Markets "Funds" list. Same fund-row shape as
 * WatchlistSummaryCard's fund branch (logo, name, portfolio count), plus
 * a second metric — recent investment count — that the Watchlist context
 * doesn't need. Kept as its own component rather than widening
 * WatchlistSummaryCard, since "browse all funds" and "my watchlist" are
 * different screens with genuinely different at-a-glance questions.
 */
export function FundRowCard({ name, logoUrl, portfolioProjectCount, recentInvestmentCount, onPress, isLoading, className }: FundRowCardProps) {
  if (isLoading) {
    return (
      <Card variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="size-8" />
          <Skeleton variant="line" className="flex-1" />
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skeleton variant="line" className="w-16" />
            <Skeleton variant="line" className="w-12" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <CoinIcon src={logoUrl} symbol={name} size="md" />
          <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-[13px] leading-[18px] tracking-[0.1px]">
            <span className="text-foreground">{portfolioProjectCount} projects</span>
            <span className="text-muted-foreground">{recentInvestmentCount !== undefined ? `${recentInvestmentCount} recent` : "—"}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
