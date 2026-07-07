// Raw DB rows -> leaf-calculator input structs (FundingScoreInput,
// MarketScoreInput, etc). Pure functions only — no Supabase import, no
// I/O. This is the only place in src/scoring-sync/ that knows how to
// translate this platform's schema into the scoring engine's input
// contracts; the engine itself (src/scoring/) is never modified or
// duplicated here.
//
// These functions are consumed by signal-source.ts, which calls the
// corresponding leaf calculator on each one and wraps the result into a
// Signal (rawValue/normalizedScore/metadata) — this file only builds the
// calculator inputs, it never touches Signal/SignalState itself.

import type {
  FundingScoreInput,
  FundingStage,
  InvestorParticipation,
  InvestorScoreInput,
  MarketScoreInput,
  MomentumScoreInput,
  RevenueScoreInput,
  TvlScoreInput,
  UnlockScoreInput,
} from "../scoring/types";
import type { ProjectScoringData, RawFundingRound } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(earlier: Date, later: Date): number {
  return Math.max(0, (later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

/**
 * ChainBroker's funding-round data has no clean stage field (see
 * src/providers/chainbroker/types.ts RawFundraise) — `round_type` is
 * almost always the literal "Funding Round." This is a best-effort
 * keyword classification, not a reliable signal; "unknown" (the scoring
 * engine's own documented safe default — see src/scoring/types.ts
 * FundingStage) is the expected, common outcome today.
 */
export function classifyFundingStage(roundType: string | null): FundingStage {
  if (roundType === null) return "unknown";
  const normalized = roundType.toLowerCase();
  if (normalized.includes("pre-seed") || normalized.includes("pre seed")) return "pre_seed";
  if (normalized.includes("seed")) return "seed";
  if (normalized.includes("series a")) return "series_a";
  if (normalized.includes("series b")) return "series_b";
  if (normalized.includes("series c") || normalized.includes("series d")) return "series_c_plus";
  if (normalized.includes("strategic")) return "strategic";
  if (normalized.includes("private")) return "private";
  if (normalized.includes("ido") || normalized.includes("ico")) return "ido";
  return "unknown";
}

export function latestFundingRound(rounds: RawFundingRound[]): RawFundingRound | null {
  const dated = rounds.filter((r) => r.announcedDate !== null);
  if (dated.length === 0) return null;
  return dated.reduce((latest, r) => (r.announcedDate! > latest.announcedDate! ? r : latest));
}

/** Most-recently-ingested funding round by `createdAt` (not `announcedDate` — see RawFundingRound's doc comment) — the funding/investor signals' freshness timestamp. Null when there are no rounds at all. */
export function mostRecentlyCreatedFundingRound(rounds: RawFundingRound[]): RawFundingRound | null {
  if (rounds.length === 0) return null;
  return rounds.reduce((latest, r) => (r.createdAt > latest.createdAt ? r : latest));
}

export function buildFundingInput(data: ProjectScoringData, asOf: Date): FundingScoreInput {
  const totalFundingUsd = data.fundingRounds.reduce(
    (sum, r) => (r.amountRaisedUsd !== null ? sum + r.amountRaisedUsd : sum),
    0,
  );
  const hasAnyAmount = data.fundingRounds.some((r) => r.amountRaisedUsd !== null);

  const latest = latestFundingRound(data.fundingRounds);
  const daysSinceLastRound = latest ? daysBetween(new Date(latest.announcedDate!), asOf) : null;

  const uniqueFundIds = new Set(data.fundingInvestors.map((fi) => fi.fundId));

  return {
    totalFundingUsd: hasAnyAmount ? totalFundingUsd : null,
    latestStage: classifyFundingStage(latest?.roundType ?? null),
    daysSinceLastRound,
    numberOfRounds: data.fundingRounds.length,
    numberOfUniqueInvestors: uniqueFundIds.size,
  };
}

/**
 * `funds` has no tier column and `funding_investors` has no `is_lead`
 * column today (see DEVELOPER_GUIDE.md Do & Don't) — every participation
 * is built with `tier: null, isLead: false`, the exact neutral defaults
 * investor-score.ts already documents and expects for this gap.
 */
export function buildInvestorInput(data: ProjectScoringData): InvestorScoreInput {
  const roundsByFund = new Map<string, Set<string>>();
  for (const fi of data.fundingInvestors) {
    const rounds = roundsByFund.get(fi.fundId) ?? new Set<string>();
    rounds.add(fi.fundingRoundId);
    roundsByFund.set(fi.fundId, rounds);
  }

  const investors: InvestorParticipation[] = [...roundsByFund.entries()].map(([fundId, rounds]) => ({
    fundId,
    tier: null,
    isLead: false,
    roundsParticipated: rounds.size,
  }));

  return { investors };
}

export function buildMarketInput(data: ProjectScoringData): MarketScoreInput {
  const m = data.metrics;
  return {
    marketCapUsd: m?.marketCapUsd ?? null,
    fullyDilutedValuationUsd: m?.fullyDilutedValuationUsd ?? null,
    volume24hUsd: m?.volume24hUsd ?? null,
    priceChange24hPercent: m?.priceChange24hPercent ?? null,
    priceChange7dPercent: m?.priceChange7dPercent ?? null,
    priceChange30dPercent: m?.priceChange30dPercent ?? null,
  };
}

export function buildTvlInput(data: ProjectScoringData): TvlScoreInput {
  const m = data.metrics;
  return {
    tvlUsd: m?.tvlUsd ?? null,
    tvlChange1dPercent: m?.tvlChange1dPercent ?? null,
    tvlChange7dPercent: m?.tvlChange7dPercent ?? null,
    // No per-project chain-count column exists yet (DefiLlama's provider
    // exposes per-chain breakdown, but nothing persists a count from it
    // — see src/ingestion/metrics/). 1 is tvl-score.ts's own documented
    // conservative default.
    chainCount: 1,
  };
}

export function buildRevenueInput(data: ProjectScoringData): RevenueScoreInput {
  const m = data.metrics;
  return {
    revenue24hUsd: m?.revenue24hUsd ?? null,
    revenue30dUsd: m?.revenue30dUsd ?? null,
    fees24hUsd: m?.fees24hUsd ?? null,
    fees30dUsd: m?.fees30dUsd ?? null,
  };
}

/** The soonest upcoming unlock event, or null if none is scheduled. Exposed separately (not just folded into buildUnlockInput) so signal-source.ts can read its `createdAt` for the unlock signal's freshness timestamp. */
export function nextUnlockEvent(data: ProjectScoringData): ProjectScoringData["upcomingUnlockEvents"][number] | null {
  if (data.upcomingUnlockEvents.length === 0) return null;
  return data.upcomingUnlockEvents.reduce((earliest, e) => (e.unlockDate < earliest.unlockDate ? e : earliest));
}

export function buildUnlockInput(data: ProjectScoringData, asOf: Date): UnlockScoreInput {
  const next = nextUnlockEvent(data);
  if (!next) {
    return { nextUnlockDate: null, unlockPercentOfSupply: null, unlockValueUsd: null, asOf };
  }
  return {
    nextUnlockDate: next.unlockDate,
    unlockPercentOfSupply: next.percentOfSupply,
    unlockValueUsd: next.amountUsd,
    asOf,
  };
}

/** Same formula revenue-score.ts documents on MomentumScoreInput.revenueMomentumPercent — replicated here, not imported, since it's a raw-fact derivation, not a call into another score. */
export function computeRevenueMomentumPercent(data: ProjectScoringData): number | null {
  const m = data.metrics;
  if (!m || m.revenue24hUsd === null || m.revenue30dUsd === null || m.revenue30dUsd <= 0) {
    return null;
  }
  const dailyAverage = m.revenue30dUsd / 30;
  return ((m.revenue24hUsd - dailyAverage) / dailyAverage) * 100;
}

export function buildMomentumInput(
  data: ProjectScoringData,
  fundingInput: FundingScoreInput,
): MomentumScoreInput {
  return {
    daysSinceLastRound: fundingInput.daysSinceLastRound,
    priceChange24hPercent: data.metrics?.priceChange24hPercent ?? null,
    tvlChange1dPercent: data.metrics?.tvlChange1dPercent ?? null,
    revenueMomentumPercent: computeRevenueMomentumPercent(data),
  };
}

// buildScoreEngineInput (the old top-level export) is superseded by
// signal-source.ts's buildSignals — which calls each build*Input helper
// above, same as this used to, but wraps each result into a Signal
// (rawValue/normalizedScore/state/metadata) instead of assembling a flat
// ScoreEngineInput. The individual helpers above are unchanged and still
// do 100% of the schema-translation work; only the top-level assembly
// moved.
