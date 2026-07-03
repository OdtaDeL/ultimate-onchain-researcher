// Mapping layer: pure, 1:1 conversions from the ChainBroker client's
// Normalized* types (src/providers/chainbroker/types.ts) to the Draft*
// shapes this ingestion service upserts (types.ts in this folder). No
// deduplication here — that's normalize.ts — and no I/O.

import type {
  NormalizedFund,
  NormalizedFundingRound,
  NormalizedInvestor,
  NormalizedProjectRef,
  NormalizedUnlockEvent,
} from "../../providers/chainbroker/types";
import type { FundDraft, FundingRoundDraft, ProjectDraft, TokenUnlockEventDraft } from "./types";

export function mapProjectRef(ref: NormalizedProjectRef): ProjectDraft {
  return {
    slug: ref.slug,
    name: ref.name,
    ticker: ref.ticker,
    logoUrl: ref.logoUrl,
  };
}

export function mapFund(fund: NormalizedFund | NormalizedInvestor): FundDraft {
  return {
    slug: fund.slug,
    name: fund.name,
    logoUrl: fund.logoUrl,
  };
}

export function mapFundingRound(round: NormalizedFundingRound): FundingRoundDraft {
  return {
    projectSlug: round.projectSlug,
    roundType: round.roundType,
    amountRaisedUsd: round.amountRaisedUsd,
    announcedDate: round.announcedDate,
    fdvUsd: round.fdvUsd,
    investorFundSlugs: [...round.investors, ...round.leadInvestors].map((i) => i.slug),
  };
}

export function mapUnlockEvent(event: NormalizedUnlockEvent): TokenUnlockEventDraft {
  return {
    projectSlug: event.projectSlug,
    unlockDate: event.unlockDate,
    unlockType: event.roundName,
    amountTokens: event.amountTokens,
    amountUsd: event.amountUsd,
    percentOfSupply: event.percentOfSupply,
  };
}
