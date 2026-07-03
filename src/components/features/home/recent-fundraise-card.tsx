"use client";

import { motion } from "framer-motion";
import { Card, Skeleton } from "@/components/ui";
import { CoinIcon, NumberFormatter } from "@/components/shared";
import { motionPreset } from "@/lib/theme";

export interface RecentFundraiseCardProps {
  name: string;
  /** DB slug for navigation (e.g. "aave-v3") — optional for backward-compat with mock/skeleton entries that have no real slug. Callers fall back to toSlug(name) when absent. */
  slug?: string;
  logoUrl?: string | null;
  /** Null when the raise amount was not disclosed. */
  amountUsd: number | null;
  roundType?: string | null;
  /** Pre-formatted relative date (e.g. "2d ago") — computing "now - announcedAt" is the caller's concern, not this presentational component's. */
  announcedLabel: string;
  /** Caller passes the already-summarized list (DESIGN_SYSTEM Rule 35: "led by X, Y +2 more"), not the full investor roster. */
  investorNames: string[];
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

function summarizeInvestors(names: string[]): string | null {
  if (names.length === 0) return null;
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  return rest > 0 ? `${shown} +${rest} more` : shown;
}

/**
 * One row in the Recent Fundraises feed. HOME_SCREEN_SPEC.md Section 3.8:
 * glance-level only — full investor detail lives one tap deeper on Project
 * Detail, never inline here.
 */
export function RecentFundraiseCard({ name, logoUrl, amountUsd, roundType, announcedLabel, investorNames, onPress, isLoading, className }: RecentFundraiseCardProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2 ${className ?? ""}`}>
        <Skeleton variant="circle" className="size-7" />
        <Skeleton variant="line" className="flex-1" />
      </div>
    );
  }

  const investorSummary = summarizeInvestors(investorNames);

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <CoinIcon src={logoUrl} symbol={name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>
              <span className="shrink-0 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{announcedLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
              <span className="text-foreground">
                {amountUsd !== null ? <>$<NumberFormatter value={amountUsd} /></> : "Undisclosed"}
              </span>
              {roundType ? <span>{roundType}</span> : null}
              {investorSummary ? <span className="line-clamp-1">· {investorSummary}</span> : null}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
