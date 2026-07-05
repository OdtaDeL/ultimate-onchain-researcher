"use client";

import { motion } from "framer-motion";
import { Card, Pill, Skeleton } from "@/components/ui";
import { CoinIcon, NumberFormatter, Percentage, ScoreCircle } from "@/components/shared";
import { motionPreset, scoreGradeColor, type ScoreGrade } from "@/lib/theme";

export interface ProjectRowCardProps {
  /** Backend slug used for navigation — present on real API data, absent on mock placeholders. */
  slug?: string;
  name: string;
  logoUrl?: string | null;
  score: number;
  grade: ScoreGrade;
  /** Null when no project_metrics row provides this field yet (e.g. not a TVL-bearing protocol, or DefiLlama/CoinGecko hasn't synced it) — renders "—". */
  tvl: number | null;
  marketCap: number | null;
  changePercent24h: number | null;
  /** Pre-formatted by the caller, e.g. "Seed", "Series A", "Public" — same convention as WeeklyPickCard's unlockRiskLabel. */
  fundingStage?: string | null;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Markets "Projects" list. Denser than any Home card — TVL,
 * Market Cap, 24h and Funding Stage all sit alongside the Score — so unlike
 * ScoreCircle's own `full` composition (ring + Pill, used at hero scale),
 * this row pairs the `compact` ring with an explicit grade Pill placed
 * outside it, keeping both the score numeral and the letter grade visible
 * without needing the 88px hero footprint.
 */
export function ProjectRowCard({ name, logoUrl, score, grade, tvl, marketCap, changePercent24h, fundingStage, onPress, isLoading, className }: ProjectRowCardProps) {
  if (isLoading) {
    return (
      <Card variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="size-8" />
          <div className="min-w-0 flex-1">
            <Skeleton variant="line" className="w-24" />
            <Skeleton variant="line" className="mt-1.5 w-32" />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <Skeleton variant="circle" className="size-10" />
            <Skeleton variant="line" className="h-3.5 w-6" />
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

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>
              {changePercent24h !== null ? (
                <Percentage value={changePercent24h} className="text-[13px]" />
              ) : (
                <span className="text-[13px] text-muted-foreground">—</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
              <span>TVL {tvl !== null ? <>$<NumberFormatter value={tvl} /></> : "—"}</span>
              <span>MCap {marketCap !== null ? <>$<NumberFormatter value={marketCap} /></> : "—"}</span>
              {fundingStage ? <Pill variant="neutral">{fundingStage}</Pill> : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <ScoreCircle score={score} grade={grade} size="compact" />
            <Pill variant="neutral" className={scoreGradeColor[grade].text}>
              {grade}
            </Pill>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
