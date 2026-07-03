// Shared types for the scoring engine. Every input type here is a plain
// DTO — src/scoring/ has no Supabase/provider import anywhere, and never
// will (see score-engine.ts header). Assembling these DTOs from real
// database rows is a future scoring sync job's responsibility, not this
// module's. Several fields are accepted here because the spec requires
// them even though no current ingestion code populates them yet — each
// is flagged at its declaration with a safe default a caller can use.

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
// Weighted Score
// ---------------------------------------------------------------------

export interface ScoreBreakdown {
  funding: number;
  investor: number;
  market: number;
  tvl: number;
  revenue: number;
  unlock: number;
  momentum: number;
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
// Score Explanation — structured, for a future AI Summary feature to
// consume (see score-engine.ts). Plain phrases, no scoring logic lives
// here; generated strictly from already-computed scores/inputs.
// ---------------------------------------------------------------------

export interface ScoreExplanation {
  funding: string;
  investor: string;
  market: string;
  tvl: string;
  revenue: string;
  unlock: string;
  momentum: string;
  /** Ordered, most-notable-first. A short highlight reel, not a repeat of the 7 fields above verbatim. */
  highlights: string[];
}

// ---------------------------------------------------------------------
// Score Engine — top-level input/output
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

export interface ScoreEngineResult {
  overallScore: number;
  grade: Grade;
  scoreBreakdown: ScoreBreakdown;
  explanation: ScoreExplanation;
}
