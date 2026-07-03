"use client";

import { motion } from "framer-motion";
import { Badge, Card, Skeleton } from "@/components/ui";
import { CoinIcon, Percentage, PriceFormatter, ScoreCircle } from "@/components/shared";
import { motionPreset } from "@/lib/theme";
import type { ScoreGrade } from "./types";

export type WatchlistEntityKind = "project" | "fund";

export interface WatchlistSummaryCardProps {
  kind: WatchlistEntityKind;
  name: string;
  logoUrl?: string | null;
  /** Project rows only. */
  score?: number;
  grade?: ScoreGrade;
  price?: number;
  changePercent24h?: number;
  /** Fund rows only. */
  portfolioProjectCount?: number;
  /** Notification Dot — DESIGN_SYSTEM.md Section 9: shown only when a qualifying alert exists, never as a permanent decoration. */
  hasAlert?: boolean;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Watchlist Summary (Home) / Watchlist tab.
 * HOME_SCREEN_SPEC.md Section 3.6 / DESIGN_SYSTEM Rule 16: Fund rows never
 * show a Score Circle — they show portfolio size instead. The two entity
 * shapes are genuinely different, not a missing-field variant of the same row.
 */
export function WatchlistSummaryCard({
  kind,
  name,
  logoUrl,
  score,
  grade,
  price,
  changePercent24h,
  portfolioProjectCount,
  hasAlert,
  onPress,
  isLoading,
  className,
}: WatchlistSummaryCardProps) {
  if (isLoading) {
    return (
      <div className={`flex h-16 items-center gap-3 px-4 ${className ?? ""}`}>
        <Skeleton variant="circle" className="size-7" />
        <Skeleton variant="line" className="flex-1" />
      </div>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <CoinIcon src={logoUrl} symbol={name} size="sm" />
            {hasAlert ? <Badge variant="dot" /> : null}
          </div>

          <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>

          {kind === "project" ? (
            <>
              {score !== undefined && grade ? <ScoreCircle score={score} grade={grade} size="compact" /> : null}
              {price !== undefined ? <PriceFormatter value={price} className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground" /> : null}
              {changePercent24h !== undefined ? <Percentage value={changePercent24h} /> : null}
            </>
          ) : (
            <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{portfolioProjectCount ?? 0} projects</span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
