// Upsert service: the only file in this module that talks to Supabase.
// Mapping and normalization (mapper.ts, normalize.ts) are pure; this is
// where resolved drafts actually become (or update) rows.
//
// Two requirements drive the design here, both explicit in the task:
//
//   1. "Each provider owns only its own fields" — enforced structurally,
//      not by convention: the `columns` payload passed in is whatever
//      mapper.ts produced (CoinGeckoMetricsColumns or
//      DefiLlamaMetricsColumns), which never contains the other
//      provider's keys at all. Postgres/PostgREST's upsert only writes
//      the columns present in the payload — any column omitted from the
//      payload is left untouched on UPDATE (and defaults to NULL only on
//      a brand-new INSERT, which is correct: a new row naturally has
//      nothing from the other provider yet).
//
//   2. "Only update changed values. Avoid unnecessary writes." —
//      requires reading the current row before writing, diffing
//      field-by-field, and skipping the write (or shrinking it to just
//      the changed subset) when nothing actually changed. This is the
//      one ingestion upsert-service in this codebase that reads before
//      it writes; every other one (chainbroker) just upserts
//      unconditionally because it has no such requirement.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import type { MetricsColumns, UpsertOutcome } from "./types";

type ProjectMetricsRow = Database["public"]["Tables"]["project_metrics"]["Row"];
type ProjectMetricsInsert = Database["public"]["Tables"]["project_metrics"]["Insert"];
type ProjectMetricsUpdate = Database["public"]["Tables"]["project_metrics"]["Update"];

export class MetricsUpsertError extends Error {
  constructor(readonly projectId: string, readonly cause: unknown) {
    super(
      `Upsert into "project_metrics" for project ${projectId} failed: ${String(
        (cause as { message?: string })?.message ?? cause,
      )}`,
    );
    this.name = "MetricsUpsertError";
  }
}

/** Null-safe, numeric-string-safe equality — Postgrest returns `numeric` columns as strings to avoid float precision loss. */
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

/** Returns only the keys whose value actually differs from `existing` — never the full payload. */
function diffColumns<TColumns extends MetricsColumns>(
  existing: ProjectMetricsRow,
  incoming: Partial<TColumns>,
): Partial<TColumns> {
  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    const existingValue = (existing as unknown as Record<string, unknown>)[key];
    if (!valuesEqual(existingValue, value)) {
      changed[key] = value;
    }
  }
  return changed as Partial<TColumns>;
}

/**
 * Same as `diffColumns`, but only includes a key when the *existing* value
 * is null/missing — never when it merely differs. This is the entire
 * mechanism behind CoinPaprika/DexScreener being safe to give the exact
 * same column names CoinGecko owns (see types.ts's doc comments on
 * `CoinPaprikaMetricsColumns`/`DexScreenerMetricsColumns`): a gap-filler
 * can only ever write into a hole, never overwrite a value a
 * higher-priority provider already supplied.
 */
function fillNullColumns<TColumns extends MetricsColumns>(
  existing: ProjectMetricsRow,
  incoming: Partial<TColumns>,
): Partial<TColumns> {
  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined) continue;
    const existingValue = (existing as unknown as Record<string, unknown>)[key];
    if (existingValue === null || existingValue === undefined) {
      changed[key] = value;
    }
  }
  return changed as Partial<TColumns>;
}

export class MetricsUpsertService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Upserts one provider's columns for one project. Never writes a
   * column outside `columns` — see file header. Returns which of
   * inserted/updated/unchanged actually happened, for the sync report.
   *
   * `fillNullsOnly` (default false, preserves CoinGecko/DefiLlama's
   * existing overwrite-on-change behavior exactly): when true, an
   * existing row is only ever updated for columns currently null — see
   * `fillNullColumns` above. Pass `true` for gap-filling providers
   * (CoinPaprika, DexScreener) that share column names with a
   * higher-priority provider.
   */
  async upsertProviderMetrics<TColumns extends MetricsColumns>(
    projectId: string,
    columns: Partial<TColumns>,
    fillNullsOnly = false,
  ): Promise<UpsertOutcome> {
    const { data: existing, error: selectError } = await this.supabase
      .from("project_metrics")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (selectError) throw new MetricsUpsertError(projectId, selectError);

    if (!existing) {
      const row: ProjectMetricsInsert = { project_id: projectId, ...columns };
      const { error: insertError } = await this.supabase
        .from("project_metrics")
        .upsert(row, { onConflict: "project_id" });
      if (insertError) throw new MetricsUpsertError(projectId, insertError);
      return "inserted";
    }

    const changed = fillNullsOnly ? fillNullColumns(existing, columns) : diffColumns(existing, columns);
    if (Object.keys(changed).length === 0) {
      return "unchanged";
    }

    const { error: updateError } = await this.supabase
      .from("project_metrics")
      .update(changed as ProjectMetricsUpdate)
      .eq("project_id", projectId);
    if (updateError) throw new MetricsUpsertError(projectId, updateError);
    return "updated";
  }
}
