import { Pill, Skeleton } from "@/components/ui";
import { NumberFormatter } from "@/components/shared";
import { cn } from "@/lib/utils";

export interface FundingRoundRowProps {
  round: string;
  /** Pre-formatted, e.g. "Mar 2024" — same "caller formats dates" convention as every other Home/Markets card. */
  dateLabel: string;
  /** Null when the raise amount was not disclosed. */
  amountUsd: number | null;
  /** Absent when the backend provides no is_lead flag on investors. */
  leadInvestor?: string;
  /** Pre-summarized by the caller, e.g. "Polychain, 1kx +4 more" — DESIGN_SYSTEM Rule 35, never a full investor roster inline. */
  otherInvestorsSummary?: string | null;
  /** Hides the connecting line below the last entry in the timeline. */
  isLast?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * One entry in the Project Detail Funding timeline. Genuinely different
 * shape from Home's RecentFundraiseCard — that card identifies *which
 * project* raised (for a cross-project feed) and so leads with a logo;
 * here we're already on that project's own page, so the round itself
 * (type, amount, lead investor) is the lead information, and a
 * dot-and-line timeline connector replaces the per-row entity logo.
 */
export function FundingRoundRow({ round, dateLabel, amountUsd, leadInvestor, otherInvestorsSummary, isLast, isLoading, className }: FundingRoundRowProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <div className="flex w-2 shrink-0 flex-col items-center pt-1.5">
        <span className="size-2 shrink-0 rounded-full bg-accent" />
        {isLast ? null : <span className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {isLoading ? (
        <div className="flex-1 pb-5">
          <Skeleton variant="line" className="w-20" />
          <Skeleton variant="line" className="mt-2 w-28" />
        </div>
      ) : (
        <div className="flex-1 pb-5">
          <div className="flex items-center justify-between gap-2">
            <Pill variant="neutral">{round}</Pill>
            <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{dateLabel}</span>
          </div>
          <div className="mt-1.5 text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground">
            {amountUsd !== null ? <>$<NumberFormatter value={amountUsd} /></> : "Undisclosed"}
          </div>
          {(leadInvestor || otherInvestorsSummary) ? (
            <div className="mt-1 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
              {leadInvestor ? <>Led by <span className="text-foreground">{leadInvestor}</span></> : null}
              {leadInvestor && otherInvestorsSummary ? <> · </> : null}
              {otherInvestorsSummary ?? null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
