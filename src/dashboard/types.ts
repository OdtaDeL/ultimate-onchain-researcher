// Shared DTOs for the Dashboard Query Layer. src/dashboard/ is the ONLY
// place allowed to aggregate data for frontend consumption (see each
// file's header) — every shape here is frontend-ready: camelCase,
// pre-joined, no raw Supabase row shapes leak past this module.

import { gradeFromScore, DEFAULT_SCORING_CONFIG } from "../scoring/config";
import type { Grade } from "../scoring/types";

export type { Grade };

// ---------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------

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
