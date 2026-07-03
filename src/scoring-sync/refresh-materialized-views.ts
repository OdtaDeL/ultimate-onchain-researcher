// Refreshes the 4 scoring-derived materialized views via the
// refresh_materialized_view RPC (supabase/migrations/
// 009_scoring_refresh_function.sql) — PostgREST has no way to issue a
// raw REFRESH MATERIALIZED VIEW statement, only RPC calls to functions.
//
// Called by scoring-sync.ts only after a sync run that processed at
// least one project (see scoring-sync.ts) — "refresh materialized views
// only after successful sync."

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { MATERIALIZED_VIEW_NAMES } from "./types";
import type { MaterializedViewName } from "./types";

export class MaterializedViewRefreshError extends Error {
  constructor(readonly viewName: MaterializedViewName, readonly cause: unknown) {
    super(
      `Refreshing materialized view "${viewName}" failed: ${String(
        (cause as { message?: string })?.message ?? cause,
      )}`,
    );
    this.name = "MaterializedViewRefreshError";
  }
}

/** Refreshes one view. Throws on failure — callers decide whether one view's failure should stop the rest (see refreshAllMaterializedViews). */
export async function refreshMaterializedView(
  supabase: SupabaseClient<Database>,
  viewName: MaterializedViewName,
): Promise<void> {
  const { error } = await supabase.rpc("refresh_materialized_view", { view_name: viewName });
  if (error) throw new MaterializedViewRefreshError(viewName, error);
}

/**
 * Refreshes all 4 views in dependency-free order (none of them read from
 * each other, so order doesn't matter for correctness). Continues past a
 * single view's failure rather than aborting the rest — returns the list
 * that actually succeeded, so the sync report's
 * `materializedViewsRefreshed` is honest about partial failure rather
 * than claiming all 4 refreshed when one didn't.
 */
export async function refreshAllMaterializedViews(
  supabase: SupabaseClient<Database>,
): Promise<MaterializedViewName[]> {
  const refreshed: MaterializedViewName[] = [];
  for (const viewName of MATERIALIZED_VIEW_NAMES) {
    try {
      await refreshMaterializedView(supabase, viewName);
      refreshed.push(viewName);
    } catch {
      // One view's refresh failure must not block the others — same
      // resilience policy as src/sync/chainbroker/paged-sync.ts.
    }
  }
  return refreshed;
}
