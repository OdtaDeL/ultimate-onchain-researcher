"use client";

import { TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Card, Divider, Pill, Skeleton } from "@/components/ui";
import { CoinIcon, Percentage, ScoreCircle } from "@/components/shared";
import { motionPreset } from "@/lib/theme";
import type { FundingQuality, RiskLevel, ScoreGrade } from "./types";

export interface WeeklyPickCardProps {
  rank?: number;
  slug?: string;
  name: string;
  logoUrl?: string | null;
  score: number;
  grade: ScoreGrade;
  /** Absent for real-data rows (no backend source); card shows "—" when missing. */
  fundingQuality?: FundingQuality;
  /** Pre-computed by the caller — this component never decides "up" vs "down" trend math, only displays it. Null when project_metrics row is absent. */
  tvlChangePercent?: number | null;
  /** Absent for real-data rows (no backend threshold system); card shows "—" when missing. */
  unlockRiskLevel?: RiskLevel;
  /** Pre-formatted, e.g. "14 days" or "Low risk". Absent when unlockRiskLevel is absent. */
  unlockRiskLabel?: string;
  onPress?: () => void;
  onWhyPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

const fundingQualityLabel: Record<FundingQuality, string> = { strong: "Strong", moderate: "Moderate", weak: "Weak" };
const fundingQualityVariant: Record<FundingQuality, "success" | "neutral"> = { strong: "success", moderate: "neutral", weak: "neutral" };
const riskVariant: Record<RiskLevel, "success" | "warning" | "danger"> = { low: "success", moderate: "warning", high: "danger" };

/**
 * The Weekly Picks hero unit. HOME_SCREEN_SPEC.md Section 3.4: verdict
 * (Score+Grade) first, 3 supporting signals, then the "Why?" escape hatch
 * to full reasoning. Fixed 220x180 footprint — never a 5th metric.
 */
export function WeeklyPickCard({
  rank,
  name,
  logoUrl,
  score,
  grade,
  fundingQuality,
  tvlChangePercent,
  unlockRiskLevel,
  unlockRiskLabel,
  onPress,
  onWhyPress,
  isLoading,
  className,
}: WeeklyPickCardProps) {
  if (isLoading) {
    return (
      <Card className={`flex h-[180px] w-[220px] flex-col gap-2 ${className ?? ""}`}>
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="size-7" />
          <Skeleton variant="line" className="w-20" />
        </div>
        <Skeleton variant="circle" className="size-10 self-center" />
        <Skeleton variant="line" />
        <Skeleton variant="line" />
        <Skeleton variant="line" />
      </Card>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} className={`flex h-[180px] w-[220px] flex-col gap-2 ${className ?? ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CoinIcon src={logoUrl} symbol={name} size="sm" />
            <span className="line-clamp-1 text-[17px] font-semibold leading-[22px] text-foreground">{name}</span>
          </div>
          {rank ? <span className="shrink-0 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">#{rank}</span> : null}
        </div>

        <ScoreCircle score={score} grade={grade} size="compact" className="self-center" />

        <Divider variant="full" />

        <div className="flex items-center justify-between text-[13px] leading-[18px] tracking-[0.1px]">
          <span className="text-muted-foreground">Funding</span>
          <Pill variant={fundingQuality ? fundingQualityVariant[fundingQuality] : "neutral"}>
            {fundingQuality ? fundingQualityLabel[fundingQuality] : "—"}
          </Pill>
        </div>
        <div className="flex items-center justify-between text-[13px] leading-[18px] tracking-[0.1px]">
          <span className="text-muted-foreground">TVL</span>
          {tvlChangePercent != null ? (
            <Percentage value={tvlChangePercent} className="text-[13px]" />
          ) : (
            <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[13px] leading-[18px] tracking-[0.1px]">
          <span className="text-muted-foreground">Unlock</span>
          <Pill variant={unlockRiskLevel ? riskVariant[unlockRiskLevel] : "neutral"} className="inline-flex items-center gap-1">
            {unlockRiskLevel ? <TriangleAlert size={12} /> : null}
            {unlockRiskLabel ?? "—"}
          </Pill>
        </div>

        {onWhyPress ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWhyPress();
            }}
            className="mt-auto text-left text-[13px] font-semibold leading-[18px] text-accent"
          >
            Why this score? ›
          </button>
        ) : null}
      </Card>
    </motion.div>
  );
}
