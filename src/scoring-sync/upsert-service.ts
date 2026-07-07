// Upsert service: the only file in this module (besides
// refresh-materialized-views.ts) that talks to Supabase. Reads today's
// existing project_scores row (if any) for the project, diffs it against
// the freshly-computed result, and only writes if something actually
// changed — same read-before-write pattern as
// src/ingestion/metrics/upsert-service.ts, for the same reason: "do not
// recalculate unchanged projects" is enforced as "do not WRITE for
// unchanged projects" (recomputing a pure, in-memory score is free; the
// database write is the part worth skipping).
//
// CANONICAL vs. CACHE (see src/scoring/signal.ts's architecture note):
// `pillar_breakdown`/`data_completeness_percent`/`data_freshness_score`
// written below are a DETERMINISTIC CACHE, never canonical — signals
// (recomputed every run from project_metrics/funding_rounds/
// token_unlock_events/project_aliases via signal-source.ts) are the sole
// source of truth. This file NEVER reads `pillar_breakdown` back for any
// computation — it's write-only from this pipeline's perspective, read
// only by API/dashboard code. If this column is dropped or goes stale,
// zero information is lost: rerunning the sync fully reconstructs it.
// The 7 flat `*_score` columns remain independently populated (extracted
// from the relevant pillar's signals below) for top_funds/top_projects
// compatibility — they are real values, not aliases of the cache.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { PillarResult, ScoreEngineResult } from "../scoring/types";
import type { SignalKey } from "../scoring/signal";
import type { ScoreUpsertOutcome } from "./types";

type ProjectScoresRow = Database["public"]["Tables"]["project_scores"]["Row"];
type ProjectScoresInsert = Database["public"]["Tables"]["project_scores"]["Insert"];

export class ScoringUpsertError extends Error {
  constructor(readonly projectId: string, readonly cause: unknown) {
    super(
      `Upsert into "project_scores" for project ${projectId} failed: ${String(
        (cause as { message?: string })?.message ?? cause,
      )}`,
    );
    this.name = "ScoringUpsertError";
  }
}

const LEGACY_SCORE_COLUMNS = [
  "funding_score",
  "investor_score",
  "market_score",
  "tvl_score",
  "revenue_score",
  "unlock_score",
  "momentum_score",
  "total_score",
] as const;

/** Finds one signal's normalizedScore across all 6 pillars — the 7 flat legacy columns each map to exactly one SignalKey. */
function normalizedScoreFor(pillars: PillarResult[], key: SignalKey): number | null {
  for (const pillar of pillars) {
    const signal = pillar.signals.find((s) => s.key === key);
    if (signal) return signal.state === "present" ? signal.normalizedScore : null;
  }
  return null;
}

/** Numeric columns come back from Postgrest as strings — compare numerically, null-safe. */
function valuesEqual(existing: unknown, incoming: unknown): boolean {
  if (existing === null || existing === undefined) {
    return incoming === null || incoming === undefined;
  }
  if (incoming === null || incoming === undefined) return false;
  const existingNum = Number(existing);
  const incomingNum = Number(incoming);
  if (!Number.isNaN(existingNum) && !Number.isNaN(incomingNum)) {
    return existingNum === incomingNum;
  }
  return existing === incoming;
}

function scoresEqual(existing: ProjectScoresRow, incoming: ProjectScoresInsert): boolean {
  const numericColumnsEqual = [...LEGACY_SCORE_COLUMNS, "data_completeness_percent", "data_freshness_score"].every(
    (column) => valuesEqual(existing[column as keyof ProjectScoresRow], incoming[column as keyof ProjectScoresInsert]),
  );
  if (!numericColumnsEqual) return false;

  // pillar_breakdown is a cache snapshot (see file header) — compared by
  // value, same as everything else here, so a genuinely-unchanged run
  // still skips the write.
  const existingJson = existing.pillar_breakdown === null ? null : JSON.stringify(existing.pillar_breakdown);
  const incomingJson = incoming.pillar_breakdown === undefined || incoming.pillar_breakdown === null
    ? null
    : JSON.stringify(incoming.pillar_breakdown);
  return existingJson === incomingJson;
}

function toRow(projectId: string, scoreDate: string, result: ScoreEngineResult): ProjectScoresInsert {
  return {
    project_id: projectId,
    score_date: scoreDate,
    funding_score: normalizedScoreFor(result.pillars, "funding"),
    investor_score: normalizedScoreFor(result.pillars, "investor"),
    market_score: normalizedScoreFor(result.pillars, "market"),
    tvl_score: normalizedScoreFor(result.pillars, "tvl"),
    revenue_score: normalizedScoreFor(result.pillars, "revenue"),
    unlock_score: normalizedScoreFor(result.pillars, "unlock"),
    momentum_score: normalizedScoreFor(result.pillars, "momentum"),
    total_score: result.overallScore,
    // Cache only — see file header. Never read back by this pipeline.
    pillar_breakdown: result.pillars as unknown as Database["public"]["Tables"]["project_scores"]["Row"]["pillar_breakdown"],
    data_completeness_percent: result.overallCompletenessPercent,
    data_freshness_score: result.overallFreshnessScore,
  };
}

export class ScoringUpsertService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Upserts the (project_id, score_date) row for one project's score
   * run. `scoreDate` is an ISO date string ("YYYY-MM-DD") — project_scores'
   * unique constraint is on (project_id, score_date), so re-running this
   * pipeline on the same calendar day is always idempotent by
   * construction, independent of the diff-based skip below.
   */
  async upsertProjectScore(
    projectId: string,
    scoreDate: string,
    result: ScoreEngineResult,
  ): Promise<ScoreUpsertOutcome> {
    const { data: existing, error: selectError } = await this.supabase
      .from("project_scores")
      .select("*")
      .eq("project_id", projectId)
      .eq("score_date", scoreDate)
      .maybeSingle();

    if (selectError) throw new ScoringUpsertError(projectId, selectError);

    const row = toRow(projectId, scoreDate, result);

    if (!existing) {
      const { error: insertError } = await this.supabase
        .from("project_scores")
        .upsert(row, { onConflict: "project_id,score_date" });
      if (insertError) throw new ScoringUpsertError(projectId, insertError);
      return "inserted";
    }

    if (scoresEqual(existing, row)) {
      return "unchanged";
    }

    const { error: updateError } = await this.supabase
      .from("project_scores")
      .update(row)
      .eq("project_id", projectId)
      .eq("score_date", scoreDate);
    if (updateError) throw new ScoringUpsertError(projectId, updateError);
    return "updated";
  }
}
