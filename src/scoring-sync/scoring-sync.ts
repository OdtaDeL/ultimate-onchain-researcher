// Orchestrator for the Scoring Sync Pipeline — loads project data, calls
// the scoring engine once per project, upserts project_scores, and
// refreshes the materialized views. This file plays both the
// "ingestion-service" and "sync job" roles the metrics pipeline split
// across two files (src/ingestion/metrics/ingestion-service.ts +
// syncMetrics.ts) — the task's file list for src/scoring-sync/ has no
// separate service/sync split, so both responsibilities live here. If
// this pipeline grows additional jobs/variants, revisit splitting it the
// same way sync-metadata.ts was pulled out once it needed to be shared.
//
// The scoring engine itself (src/scoring/) is imported and called
// exactly as implemented — nothing here recomputes, wraps, or duplicates
// any scoring logic.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { runScoreEngine } from "../scoring/score-engine";
import { buildScoreEngineInput } from "./mapper";
import { buildSyncReport, emptyTally, tallyFailure, tallyUpsertResult, type ReportTally } from "./report";
import { refreshAllMaterializedViews } from "./refresh-materialized-views";
import { ScoringUpsertService } from "./upsert-service";
import type {
  ProjectScoringData,
  RawFundingInvestor,
  RawFundingRound,
  RawUnlockEvent,
  ScoringSyncOptions,
  ScoringSyncReport,
} from "./types";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface TargetProject {
  id: string;
  slug: string;
}

async function loadTargetProjects(
  supabase: SupabaseClient<Database>,
  projectSlug: string | undefined,
): Promise<TargetProject[]> {
  // Single-slug case: no pagination needed.
  if (projectSlug) {
    const { data, error } = await supabase.from("projects").select("id, slug").eq("slug", projectSlug);
    if (error) throw new Error(`Failed to load target projects: ${error.message}`);
    return data ?? [];
  }

  // Supabase enforces a server-side max_rows = 1,000 cap regardless of
  // any client-side .limit() call. Paginate with .range() to load the full
  // catalog — at 2,251 projects, 3 round-trips.
  const PAGE = 1_000;
  const all: TargetProject[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, slug")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to load target projects (offset ${from}): ${error.message}`);
    all.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
  }
  return all;
}

/**
 * Bulk-fetches every source table needed across all target projects and
 * groups the results in memory — one round trip per table rather than
 * one per project. Simple and sufficient at the current scale (low
 * thousands of projects, same reasoning as src/identity/IDENTITY.md's
 * "Known limitation: full-table fetch"); revisit with per-project
 * targeted queries if this pipeline ever needs to run incrementally
 * against a much larger catalog.
 */
async function loadProjectScoringData(
  supabase: SupabaseClient<Database>,
  targets: TargetProject[],
  asOf: Date,
): Promise<Map<string, ProjectScoringData>> {
  const asOfIso = toIsoDate(asOf);

  // Full table scans — `.in()` with thousands of UUIDs exceeds PostgREST's
  // GET URL length limit (~8 KB). project_metrics and token_unlock_events
  // are small enough for a full scan; funding_rounds turned out not to be
  // (ChainBroker's global feed alone is ~3,900 rounds — see
  // src/providers/chainbroker/SOURCE.md), so the funding_investors lookup
  // below batches its own `.in()` call instead. The in-memory Map below
  // filters results to only the requested targets.
  const [metricsResult, fundingRoundsResult, unlockEventsResult] = await Promise.all([
    supabase
      .from("project_metrics")
      .select(
        "project_id, market_cap, fdv, volume_24h, price_change_24h, price_change_7d, price_change_30d, tvl, tvl_change_1d, tvl_change_7d, revenue_24h, revenue_30d, fees_24h, fees_30d",
      )
      .limit(10_000),
    supabase
      .from("funding_rounds")
      .select("id, project_id, amount_raised, round_type, announced_date")
      .limit(10_000),
    supabase
      .from("token_unlock_events")
      .select("project_id, unlock_date, percent_of_supply, amount_usd")
      .gte("unlock_date", asOfIso)
      .limit(10_000),
  ]);

  if (metricsResult.error) throw new Error(`Failed to load project_metrics: ${metricsResult.error.message}`);
  if (fundingRoundsResult.error)
    throw new Error(`Failed to load funding_rounds: ${fundingRoundsResult.error.message}`);
  if (unlockEventsResult.error)
    throw new Error(`Failed to load token_unlock_events: ${unlockEventsResult.error.message}`);

  const fundingRoundIds = fundingRoundsResult.data.map((r) => r.id);
  // Batched to stay under PostgREST's ~8 KB GET URL length limit — a UUID
  // is 36 chars, so 200 IDs per `.in()` call stays comfortably inside it.
  const FUNDING_ROUND_ID_BATCH_SIZE = 200;
  const fundingInvestorsData: { funding_round_id: string; fund_id: string }[] = [];
  for (let i = 0; i < fundingRoundIds.length; i += FUNDING_ROUND_ID_BATCH_SIZE) {
    const batch = fundingRoundIds.slice(i, i + FUNDING_ROUND_ID_BATCH_SIZE);
    const { data, error } = await supabase
      .from("funding_investors")
      .select("funding_round_id, fund_id")
      .in("funding_round_id", batch);
    if (error) throw new Error(`Failed to load funding_investors (batch starting at ${i}): ${error.message}`);
    fundingInvestorsData.push(...data);
  }

  const fundingRoundProjectById = new Map(fundingRoundsResult.data.map((r) => [r.id, r.project_id]));

  const metricsByProject = new Map(metricsResult.data.map((m) => [m.project_id, m]));
  const fundingRoundsByProject = new Map<string, RawFundingRound[]>();
  for (const r of fundingRoundsResult.data) {
    const list = fundingRoundsByProject.get(r.project_id) ?? [];
    list.push({ amountRaisedUsd: r.amount_raised, roundType: r.round_type, announcedDate: r.announced_date });
    fundingRoundsByProject.set(r.project_id, list);
  }
  const fundingInvestorsByProject = new Map<string, RawFundingInvestor[]>();
  for (const fi of fundingInvestorsData) {
    const projectId = fundingRoundProjectById.get(fi.funding_round_id);
    if (!projectId) continue;
    const list = fundingInvestorsByProject.get(projectId) ?? [];
    list.push({ fundId: fi.fund_id, fundingRoundId: fi.funding_round_id });
    fundingInvestorsByProject.set(projectId, list);
  }
  const unlockEventsByProject = new Map<string, RawUnlockEvent[]>();
  for (const e of unlockEventsResult.data) {
    const list = unlockEventsByProject.get(e.project_id) ?? [];
    list.push({ unlockDate: e.unlock_date, percentOfSupply: e.percent_of_supply, amountUsd: e.amount_usd });
    unlockEventsByProject.set(e.project_id, list);
  }

  const byProjectId = new Map<string, ProjectScoringData>();
  for (const target of targets) {
    const m = metricsByProject.get(target.id);
    byProjectId.set(target.id, {
      projectId: target.id,
      slug: target.slug,
      metrics: m
        ? {
            marketCapUsd: m.market_cap,
            fullyDilutedValuationUsd: m.fdv,
            volume24hUsd: m.volume_24h,
            priceChange24hPercent: m.price_change_24h,
            priceChange7dPercent: m.price_change_7d,
            priceChange30dPercent: m.price_change_30d,
            tvlUsd: m.tvl,
            tvlChange1dPercent: m.tvl_change_1d,
            tvlChange7dPercent: m.tvl_change_7d,
            revenue24hUsd: m.revenue_24h,
            revenue30dUsd: m.revenue_30d,
            fees24hUsd: m.fees_24h,
            fees30dUsd: m.fees_30d,
          }
        : null,
      fundingRounds: fundingRoundsByProject.get(target.id) ?? [],
      fundingInvestors: fundingInvestorsByProject.get(target.id) ?? [],
      upcomingUnlockEvents: unlockEventsByProject.get(target.id) ?? [],
    });
  }
  return byProjectId;
}

/**
 * Runs the scoring sync: load data -> score engine (called exactly as
 * implemented, once per project) -> upsert project_scores -> refresh
 * materialized views (only if at least one project was processed).
 */
export async function runScoringSync(
  supabase: SupabaseClient<Database>,
  options: ScoringSyncOptions = {},
): Promise<ScoringSyncReport> {
  const startedAt = new Date();
  const asOf = options.asOf ?? startedAt;
  const scoreDate = toIsoDate(asOf);

  const targets = await loadTargetProjects(supabase, options.projectSlug);
  const dataByProjectId = await loadProjectScoringData(supabase, targets, asOf);

  const upsertService = new ScoringUpsertService(supabase);
  let tally: ReportTally = emptyTally();

  for (const target of targets) {
    const data = dataByProjectId.get(target.id);
    if (!data) {
      tally = tallyFailure(tally);
      continue;
    }
    try {
      const input = buildScoreEngineInput(data, asOf);
      const result = runScoreEngine(input);
      const outcome = await upsertService.upsertProjectScore(target.id, scoreDate, result);
      tally = tallyUpsertResult(tally, outcome);
    } catch {
      // One project's failure must not abort the rest of the run — same
      // resilience policy as src/ingestion/metrics/ingestion-service.ts.
      tally = tallyFailure(tally);
    }
  }

  const materializedViewsRefreshed =
    tally.projectsProcessed > 0 ? await refreshAllMaterializedViews(supabase) : [];

  return buildSyncReport(startedAt, new Date(), tally, materializedViewsRefreshed);
}

/** `--refresh-only`: skips scoring entirely, just refreshes the 4 materialized views. */
export async function runRefreshOnly(supabase: SupabaseClient<Database>): Promise<ScoringSyncReport> {
  const startedAt = new Date();
  const materializedViewsRefreshed = await refreshAllMaterializedViews(supabase);
  return buildSyncReport(startedAt, new Date(), emptyTally(), materializedViewsRefreshed);
}
