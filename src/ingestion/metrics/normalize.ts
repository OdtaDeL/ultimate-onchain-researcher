// Normalization layer: collapses resolved drafts down to one row per
// `project_id` — the real project_metrics upsert-conflict key (see
// supabase/migrations/001_initial_schema.sql's
// project_metrics_project_id_key unique constraint). Same reason this
// exists in src/ingestion/chainbroker/normalize.ts: Postgres rejects an
// `ON CONFLICT DO UPDATE` batch containing the same conflict key twice.
//
// Why duplicates happen here specifically: a single provider can list
// several records that all resolve to the same internal project. This is
// expected for DefiLlama in particular — it lists "Aave V1"/"Aave V2"/
// "Aave V3" as separate protocol slugs, all of which may resolve to one
// "Aave" project if this platform's `projects` table doesn't track
// per-version rows (see IDENTITY.md "Conflict Resolution" — this is
// distinct from the ambiguous-match case, since identity resolution
// here is NOT ambiguous, multiple records just confidently resolve to
// the same project).

import type { MetricsColumns, ResolvedMetricsDraft } from "./types";

/**
 * Merges two resolved drafts for the same project: prefer non-null
 * values, later draft wins ties — same policy as
 * chainbroker/normalize.ts's mergeProject/mergeFund. Does not attempt to
 * aggregate (e.g. sum TVL across sub-protocols) — that's a scoring-layer
 * decision (see SYSTEM_ARCHITECTURE.md "Design Principles"), not an
 * ingestion concern. "Last wins" is an explicit, documented simplification,
 * not a fabrication: every value involved actually came from the provider.
 */
function mergeColumns<TColumns extends MetricsColumns>(
  a: Partial<TColumns>,
  b: Partial<TColumns>,
): Partial<TColumns> {
  const merged = { ...a } as Record<string, unknown>;
  for (const [key, value] of Object.entries(b as Record<string, unknown>)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as Partial<TColumns>;
}

export function normalizeResolvedMetricsDrafts<TColumns extends MetricsColumns>(
  drafts: ResolvedMetricsDraft<TColumns>[],
): ResolvedMetricsDraft<TColumns>[] {
  const byProjectId = new Map<string, ResolvedMetricsDraft<TColumns>>();
  for (const draft of drafts) {
    const existing = byProjectId.get(draft.projectId);
    if (!existing) {
      byProjectId.set(draft.projectId, draft);
      continue;
    }
    byProjectId.set(draft.projectId, {
      ...draft,
      columns: mergeColumns(existing.columns, draft.columns),
      lastUpdated: draft.lastUpdated ?? existing.lastUpdated,
    });
  }
  return [...byProjectId.values()];
}
