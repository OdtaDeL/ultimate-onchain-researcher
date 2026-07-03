// Shared types for the Scoring Sync Pipeline. This pipeline wires the
// already-complete, unmodified scoring engine (src/scoring/) to the
// database — nothing here recomputes or duplicates any scoring logic.

import type { ScoreEngineResult } from "../scoring/types";

// ---------------------------------------------------------------------
// Raw data bundle — everything mapper.ts needs to build a
// ScoreEngineInput for one project. Assembled by scoring-sync.ts from
// project_metrics / funding_rounds / funding_investors / token_unlock_events;
// mapper.ts itself never touches Supabase (see mapper.ts header).
// ---------------------------------------------------------------------

export interface RawFundingRound {
  amountRaisedUsd: number | null;
  roundType: string | null;
  announcedDate: string | null;
}

export interface RawFundingInvestor {
  fundId: string;
  fundingRoundId: string;
}

export interface RawProjectMetrics {
  marketCapUsd: number | null;
  fullyDilutedValuationUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
  tvlUsd: number | null;
  tvlChange1dPercent: number | null;
  tvlChange7dPercent: number | null;
  revenue24hUsd: number | null;
  revenue30dUsd: number | null;
  fees24hUsd: number | null;
  fees30dUsd: number | null;
}

export interface RawUnlockEvent {
  unlockDate: string;
  percentOfSupply: number | null;
  amountUsd: number | null;
}

export interface ProjectScoringData {
  projectId: string;
  slug: string;
  metrics: RawProjectMetrics | null;
  fundingRounds: RawFundingRound[];
  fundingInvestors: RawFundingInvestor[];
  /** Only unlock events on or after `asOf` — see scoring-sync.ts's fetch query. */
  upcomingUnlockEvents: RawUnlockEvent[];
}

// ---------------------------------------------------------------------
// Upsert outcomes
// ---------------------------------------------------------------------

export type ScoreUpsertOutcome = "inserted" | "updated" | "unchanged";

export interface ProjectScoreUpsertResult {
  projectId: string;
  outcome: ScoreUpsertOutcome;
  result: ScoreEngineResult;
}

// ---------------------------------------------------------------------
// Sync report
// ---------------------------------------------------------------------

export const MATERIALIZED_VIEW_NAMES = [
  "weekly_rankings_mv",
  "monthly_rankings_mv",
  "top_projects",
  "top_funds",
  "fund_leaderboard",
] as const;

export type MaterializedViewName = (typeof MATERIALIZED_VIEW_NAMES)[number];

export interface ScoringSyncReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  projectsProcessed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
  materializedViewsRefreshed: MaterializedViewName[];
}

// ---------------------------------------------------------------------
// CLI option surface, shared between the CLI and scoring-sync.ts so the
// orchestrator's public API isn't string-flag-shaped.
// ---------------------------------------------------------------------

export interface ScoringSyncOptions {
  /** Score only this one project (by slug). Omit to score every project. */
  projectSlug?: string;
  /** The date this run's project_scores rows are stamped with — defaults to today. Explicit for deterministic testing. */
  asOf?: Date;
}
