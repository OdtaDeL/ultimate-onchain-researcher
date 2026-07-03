// Upsert service: the only file in this module (besides
// refresh-materialized-views.ts) that talks to Supabase. Reads today's
// existing project_scores row (if any) for the project, diffs it against
// the freshly-computed breakdown, and only writes if something actually
// changed — same read-before-write pattern as
// src/ingestion/metrics/upsert-service.ts, for the same reason: "do not
// recalculate unchanged projects" is enforced as "do not WRITE for
// unchanged projects" (recomputing a pure, in-memory score is free; the
// database write is the part worth skipping — see types.ts header for
// the full reasoning, or src/scoring-sync's design notes).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { ScoreEngineResult } from "../scoring/types";
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

const SCORE_COLUMNS = [
  "funding_score",
  "investor_score",
  "market_score",
  "tvl_score",
  "revenue_score",
  "unlock_score",
  "momentum_score",
  "total_score",
] as const;

/** Numeric columns come back from Postgrest as strings — compare numerically, null-safe. */
function scoresEqual(existing: ProjectScoresRow, incoming: ProjectScoresInsert): boolean {
  return SCORE_COLUMNS.every((column) => {
    const existingValue = existing[column];
    const incomingValue = incoming[column] ?? null;
    if (existingValue === null || existingValue === undefined) {
      return incomingValue === null || incomingValue === undefined;
    }
    if (incomingValue === null || incomingValue === undefined) return false;
    return Number(existingValue) === Number(incomingValue);
  });
}

function toRow(projectId: string, scoreDate: string, result: ScoreEngineResult): ProjectScoresInsert {
  return {
    project_id: projectId,
    score_date: scoreDate,
    funding_score: result.scoreBreakdown.funding,
    investor_score: result.scoreBreakdown.investor,
    market_score: result.scoreBreakdown.market,
    tvl_score: result.scoreBreakdown.tvl,
    revenue_score: result.scoreBreakdown.revenue,
    unlock_score: result.scoreBreakdown.unlock,
    momentum_score: result.scoreBreakdown.momentum,
    total_score: result.overallScore,
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
