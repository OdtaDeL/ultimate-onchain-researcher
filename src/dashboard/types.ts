// Shared DTOs for the Dashboard Query Layer. src/dashboard/ is the ONLY
// place allowed to aggregate data for frontend consumption (see each
// file's header) — every shape here is frontend-ready: camelCase,
// pre-joined, no raw Supabase row shapes leak past this module.

import { gradeFromScore, DEFAULT_SCORING_CONFIG } from "../scoring/config";
import type { Confidence, Grade, PillarKey } from "../scoring/types";
import type { SignalKey, SignalState } from "../scoring/signal";

export type { Confidence, Grade, PillarKey, SignalKey, SignalState };

// ---------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------

/**
 * One signal as stored in a pillar's cached breakdown (see
 * src/scoring/signal.ts's Signal — this is its frontend-ready shape).
 * `state` is preserved as its own field rather than collapsed into a
 * null score, so the API/UI can distinguish "missing" from
 * "not_applicable" from "not_implemented" from "provider_error" — never
 * a bare null. `rawValue`/`normalizedScore` both survive the same way:
 * scoring math only ever used `normalizedScore`, but the UI, AI
 * explanations, and debugging need `rawValue` too.
 */
export interface SignalSummaryDto {
  key: SignalKey;
  state: SignalState;
  rawValue: unknown | null;
  normalizedScore: number | null;
  providerId: string | null;
  providerName: string | null;
  asOfDate: string | null;
}

/**
 * One research pillar's aggregated result (see src/scoring/types.ts's
 * PillarResult) — a DERIVED, deterministic aggregation of `signals`,
 * never canonical itself. `value`/`completenessPercent`/`freshnessScore`/
 * `confidence` are exactly what the engine computed at sync time; this
 * DTO never recomputes them.
 */
export interface PillarSummaryDto {
  key: PillarKey;
  value: number | null;
  completenessPercent: number;
  freshnessScore: number | null;
  confidence: Confidence;
  signals: SignalSummaryDto[];
}

export interface ScoreSummaryDto {
  totalScore: number | null;
  fundingScore: number | null;
  investorScore: number | null;
  marketScore: number | null;
  tvlScore: number | null;
  revenueScore: number | null;
  unlockScore: number | null;
  momentumScore: number | null;
  /** Derived from `totalScore` via the scoring engine's own `gradeFromScore` (src/scoring/config.ts) — never recomputed differently here. Null whenever `totalScore` is null (not yet scored). */
  grade: Grade | null;
  scoreDate: string | null;
  /**
   * The 6 research pillars (VC & Market Makers, Business Model,
   * Tokenomics, Chart, Team, Community), each with its own signals —
   * read from project_scores.pillar_breakdown, a deterministic CACHE the
   * scoring-sync pipeline recomputes from signals every run (see
   * supabase/migrations/014_scoring_pillars.sql). Empty array if the
   * project hasn't been scored since this column existed.
   */
  pillars: PillarSummaryDto[];
  /** Overall (pillars-combined) completeness, 0-100. Null alongside `pillars: []`. */
  completenessPercent: number | null;
  /** Overall (pillars-combined) freshness, 0-100. Null when no present signal anywhere has a timestamp. */
  freshnessScore: number | null;
  /** Weakest-link(completeness tier, freshness tier) — never completeness alone. Null alongside `pillars: []`. */
  confidence: Confidence | null;
}

/** Strips characters with special meaning in PostgREST filter strings (`,` separates `.or()` conditions; `(`/`)` group them) so free-text search input can never inject extra filter clauses. */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[,()]/g, "");
}

/**
 * The one place every DTO below computes a letter grade from a numeric
 * score — reuses the scoring engine's existing, unmodified
 * `gradeFromScore`/`DEFAULT_SCORING_CONFIG` (src/scoring/config.ts) rather
 * than re-deriving thresholds here. Never invents a grade for a project
 * that hasn't been scored yet.
 */
export function deriveGrade(totalScore: number | null): Grade | null {
  return totalScore === null ? null : gradeFromScore(totalScore, DEFAULT_SCORING_CONFIG.grade);
}

// ---------------------------------------------------------------------
// home.ts
// ---------------------------------------------------------------------

export interface WeeklyPickDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  rank: number;
  totalScore: number | null;
  /** Derived via deriveGrade() — see that function's doc comment. */
  grade: Grade | null;
  /** From project_metrics.tvl — the project's current TVL, not specific to this week. */
  tvlUsd: number | null;
  /** From project_metrics.market_cap. */
  marketCapUsd: number | null;
  /** From project_metrics.price_change_24h. */
  priceChange24hPercent: number | null;
  /** From project_metrics.tvl_change_7d — paired with "weekly" picks rather than the 1d figure. */
  tvlChangePercent: number | null;
  weekStart: string;
}

export interface MonthlyPickDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  rank: number;
  totalScore: number | null;
  /** Derived via deriveGrade() — see that function's doc comment. */
  grade: Grade | null;
  /** From project_metrics.tvl — the project's current TVL, not specific to this month. */
  tvlUsd: number | null;
  /** From project_metrics.market_cap. */
  marketCapUsd: number | null;
  /** From project_metrics.price_change_24h. */
  priceChange24hPercent: number | null;
  /** From project_metrics.tvl_change_7d — same field as WeeklyPickDto; project_metrics has no 30d TVL-change column. */
  tvlChangePercent: number | null;
  monthStart: string;
}

export interface TopFundDto {
  fundId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  portfolioProjectCount: number;
  avgInvestorScore: number | null;
  rank: number;
}

export interface TopGainerDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  /** From project_metrics.price_change_24h — always non-null (rows without a value are excluded by getTopGainers). */
  priceChange24hPercent: number;
}

export interface MarketOverviewAssetDto {
  symbol: string;
  logoUrl: string | null;
  priceUsd: number;
  changePercent24h: number;
}

export interface MarketOverviewDto {
  assets: MarketOverviewAssetDto[];
  totalMarketCapUsd: number;
  totalMarketCapChangePercent24h: number;
}

export interface RecentlyAddedDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  category: string | null;
  /** ISO-8601 timestamp from projects.created_at. */
  createdAt: string;
}

export interface NewFundingDto {
  fundingRoundId: string;
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  roundType: string | null;
  amountRaisedUsd: number | null;
  fdvUsd: number | null;
  announcedDate: string | null;
  investorNames: string[];
}

export interface UnlockAlertDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  unlockDate: string;
  unlockType: string | null;
  amountTokens: number | null;
  amountUsd: number | null;
  percentOfSupply: number | null;
}

// ---------------------------------------------------------------------
// project.ts
// ---------------------------------------------------------------------

export interface ProjectOverviewDto {
  projectId: string;
  slug: string;
  name: string;
  ticker: string | null;
  category: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  twitter: string | null;
  score: ScoreSummaryDto | null;
  /** Current rank from top_projects, if the project has been scored at all. */
  rank: number | null;
}

export interface ProjectFundingInvestorDto {
  fundId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface ProjectFundingRoundDto {
  fundingRoundId: string;
  roundType: string | null;
  amountRaisedUsd: number | null;
  fdvUsd: number | null;
  announcedDate: string | null;
  /** No "lead investor" designation exists anywhere in the schema (funding_investors has no is_lead flag) — this is every investor in the round, in no particular order. A future "lead" concept needs a schema column, not a frontend-side guess at array order. */
  investors: ProjectFundingInvestorDto[];
}

export interface ProjectFundingDto {
  projectId: string;
  slug: string;
  totalRaisedUsd: number | null;
  rounds: ProjectFundingRoundDto[];
}

export interface ProjectMetricsDto {
  projectId: string;
  slug: string;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  price: number | null;
  volume24hUsd: number | null;
  marketCapRank: number | null;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
  ath: number | null;
  atl: number | null;
  tvlUsd: number | null;
  tvlChange1dPercent: number | null;
  tvlChange7dPercent: number | null;
  revenue24hUsd: number | null;
  revenue30dUsd: number | null;
  fees24hUsd: number | null;
  fees30dUsd: number | null;
  /** From project_metrics.circulating_supply. */
  circulatingSupply: number | null;
  /** From project_metrics.total_supply. */
  totalSupply: number | null;
  updatedAt: string | null;
}

export interface ProjectUnlockEventDto {
  unlockDate: string;
  unlockType: string | null;
  amountTokens: number | null;
  amountUsd: number | null;
  percentOfSupply: number | null;
}

export interface ProjectUnlocksDto {
  projectId: string;
  slug: string;
  unlocks: ProjectUnlockEventDto[];
}

// ---------------------------------------------------------------------
// fund.ts
// ---------------------------------------------------------------------

export interface FundOverviewDto {
  fundId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  twitter: string | null;
  description: string | null;
  portfolioProjectCount: number | null;
  avgInvestorScore: number | null;
  rank: number | null;
  /** From the fund_leaderboard view's last_investment_date — the most recent funding_rounds.announced_date among this fund's investments. Raw ISO date; relative-label formatting ("2w ago") is a frontend concern, same convention as every other date in these DTOs. */
  lastInvestmentDate: string | null;
}

/**
 * Aggregates over a fund's own funding_rounds/portfolio — every field is a
 * real count/max/mode over rows already attributable to this fund, never
 * an invented value. No "active investments" or "lead investments" count
 * exists here: the schema has no active/exited status and no is_lead flag
 * on funding_investors, so those stay unrepresented rather than guessed.
 */
export interface FundInsightsDto {
  fundId: string;
  slug: string;
  /** Portfolio projects' `category` values, most frequent first. Empty if the fund has no portfolio or no project has a category set. */
  topCategories: string[];
  /** Mode of `round_type` across this fund's funding_rounds. Null if there are no rounds or all have a null round_type. */
  mostCommonRoundType: string | null;
  /** max(amount_raised) across this fund's funding_rounds. Null if no round has a disclosed amount. */
  largestInvestmentUsd: number | null;
  /** Count of this fund's funding_rounds with announced_date in the current calendar month (server clock, UTC). */
  dealsThisMonthCount: number;
}

export interface FundPortfolioProjectDto {
  projectId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  roundType: string | null;
  announcedDate: string | null;
  totalScore: number | null;
}

export interface FundPortfolioDto {
  fundId: string;
  slug: string;
  projects: FundPortfolioProjectDto[];
}

// ---------------------------------------------------------------------
// search.ts
// ---------------------------------------------------------------------

export interface ProjectSearchResultDto {
  projectId: string;
  slug: string;
  name: string;
  ticker: string | null;
  logoUrl: string | null;
  totalScore: number | null;
  /** Derived via deriveGrade() — see that function's doc comment. */
  grade: Grade | null;
  /** From project_metrics.tvl. */
  tvlUsd: number | null;
  /** From project_metrics.market_cap. */
  marketCapUsd: number | null;
  /** From project_metrics.price_change_24h. */
  priceChange24hPercent: number | null;
}

export interface FundSearchResultDto {
  fundId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  /** From the top_funds view's portfolio_project_count. Null if the fund has no top_funds row yet (e.g. zero scored portfolio companies). */
  portfolioProjectCount: number | null;
}
