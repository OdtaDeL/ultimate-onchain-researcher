"use client";

import { motion } from "framer-motion";
import { Card, Pill, Skeleton } from "@/components/ui";
import { CoinIcon, NumberFormatter } from "@/components/shared";
import { motionPreset } from "@/lib/theme";
import { cn } from "@/lib/utils";

export interface InvestmentRowProps {
  projectName: string;
  projectLogoUrl?: string | null;
  round: string;
  /** Pre-formatted, e.g. "Mar 2024" — same convention as every other Home/Markets/Project Detail card. */
  dateLabel: string;
  /** Optional — "amount (if available)" per the Fund Detail brief; not every disclosed round has a public amount. */
  amountUsd?: number | null;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
  /** `list` = a plain Portfolio row (Card, no connector). `timeline` = a Recent Investments entry with a dot-and-line connector, matching Project Detail's FundingRoundRow visual. */
  variant?: "list" | "timeline";
  /** Timeline variant only — hides the connector line below the last entry. */
  isLast?: boolean;
}

/**
 * One row in Fund Detail's Portfolio list or Recent Investments timeline —
 * deliberately not ProjectRowCard. ProjectRowCard's emphasis (Score, TVL,
 * Market Cap, 24h) is exactly the token-market framing this screen is
 * told to avoid ("a fund is an investor, not an asset"); this row instead
 * emphasizes the investment itself — round, date, amount — which
 * ProjectRowCard's props don't even carry. Reuses CoinIcon/Pill/
 * NumberFormatter rather than duplicating their logic.
 */
export function InvestmentRow({ projectName, projectLogoUrl, round, dateLabel, amountUsd, onPress, isLoading, className, variant = "list", isLast }: InvestmentRowProps) {
  const content = isLoading ? (
    <div className="flex items-center gap-3 px-4 py-2">
      <Skeleton variant="circle" className="size-9" />
      <Skeleton variant="line" className="flex-1" />
    </div>
  ) : variant === "list" ? (
    <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
      <div className="flex items-center gap-3">
        <CoinIcon src={projectLogoUrl} symbol={projectName} size="md" />
        <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">{projectName}</span>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill variant="neutral">{round}</Pill>
          <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
            {dateLabel}
            {amountUsd ? (
              <>
                {" "}
                ·{" "}
                <span className="text-foreground">
                  $<NumberFormatter value={amountUsd} />
                </span>
              </>
            ) : null}
          </span>
        </div>
      </div>
    </Card>
  ) : (
    <div className={cn("flex gap-3", className)}>
      <div className="flex w-2 shrink-0 flex-col items-center pt-1.5">
        <span className="size-2 shrink-0 rounded-full bg-accent" />
        {isLast ? null : <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2">
          <CoinIcon src={projectLogoUrl} symbol={projectName} size="sm" />
          <span className="line-clamp-1 text-[15px] font-medium leading-5 text-foreground">{projectName}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Pill variant="neutral">{round}</Pill>
          <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{dateLabel}</span>
        </div>
        {amountUsd ? (
          <div className="mt-1 text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground">
            $<NumberFormatter value={amountUsd} />
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isLoading) return content;

  return <motion.div {...motionPreset.fadeIn}>{content}</motion.div>;
}
