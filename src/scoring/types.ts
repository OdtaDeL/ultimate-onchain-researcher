// Shared types for the scoring engine. Every input type here is a plain
// DTO — src/scoring/ has no Supabase/provider import anywhere, and never
// will (see score-engine.ts header). Assembling these DTOs from real
// database rows is a future scoring sync job's responsibility, not this
// module's. Several fields are accepted here because the spec requires
// them even though no current ingestion code populates them yet — each
// is flagged at its declaration with a safe default a caller can use.

import type { Signal } from "./signal";

// ---------------------------------------------------------------------
// Funding Score
// ---------------------------------------------------------------------

/**
 * ChainBroker's funding-round data has no clean stage classification
 * (see src/providers/chainbroker/types.ts RawFundraise — `round_type` is
 * free text, usually just "Funding Round"). Classifying free text into
 * this enum is a future mapping concern; "unknown" is the safe default.
 */
export type FundingStage =
  | "pre_seed"
  | "seed"
  | "private"
  | "strategic"
  | "series_a"
  | "series_b"
  | "series_c_plus"
  | "ido"
  | "unknown";

export interface FundingScoreInput {
  /** Total USD raised across all known rounds. */
  totalFundingUsd: number | null;
  /** Stage of the most recent round. */
  latestStage: FundingStage;
  /** Days since the most recently announced round. Null if no dated round exists. */
  daysSinceLastRound: number | null;
  numberOfRounds: number;
  numberOfUniqueInvestors: number;
}

// ---------------------------------------------------------------------
// Investor Score
// ---------------------------------------------------------------------

/**
 * Tiers are a curated classification of fund quality with no database
 * column today (`funds` has no tier column — see DEVELOPER_GUIDE.md Do &
 * Don't). A caller without tier data passes `tier: null` for every
 * investor; investor-score.ts treats that as the lowest, "untiered"
 * weighting rather than erroring or guessing.
 */
export type FundTier = "tier_1" | "tier_2" | "tier_3";

export interface InvestorParticipation {
  fundId: string;
  tier: FundTier | null;
  /** `funding_investors` has no `is_lead` column today (see DEVELOPER_GUIDE.md Do & Don't) — defaults to false when unknown. */
  isLead: boolean;
  /** How many distinct rounds (for this project) this fund participated in. */
  roundsParticipated: number;
}

export interface InvestorScoreInput {
  investors: InvestorParticipation[];
}

// ---------------------------------------------------------------------
// Market Score
// ---------------------------------------------------------------------

export interface MarketScoreInput {
  marketCapUsd: number | null;
  fullyDilutedValuationUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
}

// ---------------------------------------------------------------------
// TVL Score
// ---------------------------------------------------------------------

export interface TvlScoreInput {
  tvlUsd: number | null;
  tvlChange1dPercent: number | null;
  tvlChange7dPercent: number | null;
  /**
   * `project_metrics` stores one aggregate row per project — no
   * per-chain breakdown column exists today (DefiLlama's provider *does*
   * expose this via getProtocolTvlByChain, but nothing persists a count
   * from it yet). Defaults to 1 (single-chain assumption) when unknown,
   * which never inflates the score for unverified diversity.
   */
  chainCount: number;
}

// ---------------------------------------------------------------------
// Revenue Score
// ---------------------------------------------------------------------

export interface RevenueScoreInput {
  revenue24hUsd: number | null;
  revenue30dUsd: number | null;
  fees24hUsd: number | null;
  fees30dUsd: number | null;
}

// ---------------------------------------------------------------------
// Unlock Score (named "Unlock Risk" in the spec — see unlock-score.ts
// header for why the returned number is a safety score, not a risk score)
// ---------------------------------------------------------------------

export interface UnlockScoreInput {
  /** ISO date of the next scheduled unlock. Null if none scheduled. */
  nextUnlockDate: string | null;
  /** Percent of total supply released in that event, 0-100. */
  unlockPercentOfSupply: number | null;
  unlockValueUsd: number | null;
  /** The date to evaluate "days until unlock" against — defaults to `new Date()` if omitted (kept explicit for deterministic testing). */
  asOf?: Date;
}

// ---------------------------------------------------------------------
// Momentum Score
// ---------------------------------------------------------------------

export interface MomentumScoreInput {
  daysSinceLastRound: number | null;
  priceChange24hPercent: number | null;
  tvlChange1dPercent: number | null;
  /** Computed as (revenue24hUsd - revenue30dUsd / 30) / (revenue30dUsd / 30), i.e. today's revenue vs. its trailing 30-day daily average. Null if insufficient data. */
  revenueMomentumPercent: number | null;
}

// ---------------------------------------------------------------------
// Weighted Score — internal sub-signal values feeding each pillar.
// Renamed in meaning, not shape: these are no longer the engine's
// top-level output (see "Research Pillars" below) — they're what each
// pillar's Signal.normalizedScore is computed from, one call each into
// the corresponding calculate*Score function.
// ---------------------------------------------------------------------

export interface ScoreBreakdown {
  funding: number | null;
  investor: number | null;
  market: number | null;
  tvl: number | null;
  revenue: number | null;
  unlock: number | null;
  momentum: number | null;
}

export interface ScoreWeights {
  funding: number;
  investor: number;
  market: number;
  tvl: number;
  revenue: number;
  unlock: number;
  momentum: number;
}

export type Grade = "A+" | "A" | "B" | "C" | "D";

// ---------------------------------------------------------------------
// Score Engine — sub-signal input (per pillar's leaf calculators)
// ---------------------------------------------------------------------

export interface ScoreEngineInput {
  funding: FundingScoreInput;
  investor: InvestorScoreInput;
  market: MarketScoreInput;
  tvl: TvlScoreInput;
  revenue: RevenueScoreInput;
  unlock: UnlockScoreInput;
  momentum: MomentumScoreInput;
}

// ---------------------------------------------------------------------
// Research Pillars — the engine's actual top-level output. See
// src/scoring/signal.ts for Signal/SignalState/SignalSource and the full
// Provider -> Signal -> Pillar -> Overall hierarchy this is built around.
// ---------------------------------------------------------------------

export type PillarKey = "vc_market_makers" | "business_model" | "tokenomics" | "chart" | "team" | "community";

export type Confidence = "high" | "medium" | "low";

export interface PillarResult {
  key: PillarKey;
  value: number | null;
  completenessPercent: number;
  /** Derived from this pillar's own present signals — never a single opaque aggregate with no traceable origin. Null when no present signals exist. */
  freshnessScore: number | null;
  /** Weakest-link(completeness tier, freshness tier) — never completeness alone. See config.ts confidenceFrom(). */
  confidence: Confidence;
  /** The full, untouched signal list that fed this pillar — including any not_applicable/not_implemented ones, which are excluded from value/completenessPercent math but never hidden from this list. */
  signals: Signal[];
}

export interface ScoreEngineResult {
  overallScore: number | null;
  overallGrade: Grade | null;
  overallCompletenessPercent: number;
  overallFreshnessScore: number | null;
  overallConfidence: Confidence;
  /** Always exactly 6, stable order — see signal.ts's SignalKey doc comment for how new signals extend a pillar without changing this list. */
  pillars: PillarResult[];
}
