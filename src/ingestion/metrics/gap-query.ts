// Supabase-aware query for the DexScreener gap-fill job only — every
// other file in src/ingestion/metrics/ besides this one and
// upsert-service.ts is pure (no I/O). Kept separate from upsert-service.ts
// since this is a read used by the *sync job* (syncMetrics.ts) to decide
// what to even query DexScreener for for, not part of the write path.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";

export interface GapProject {
  id: string;
  ticker: string | null;
  name: string;
}

/**
 * Projects with no price or no market cap yet — i.e. still a gap after
 * CoinGecko and CoinPaprika have both run. Called at the start of
 * `syncDexScreenerGapFill`, so it reflects whatever gap remains right now,
 * not a stale snapshot from before this sync run's earlier phases.
 */
export async function getProjectsMissingMarketData(
  supabase: SupabaseClient<Database>,
): Promise<GapProject[]> {
  const { data: allProjects, error: projectsError } = await supabase
    .from("projects")
    .select("id, ticker, name");
  if (projectsError) throw new Error(`getProjectsMissingMarketData: failed to load projects: ${projectsError.message}`);

  const { data: metrics, error: metricsError } = await supabase
    .from("project_metrics")
    .select("project_id, price, market_cap");
  if (metricsError) throw new Error(`getProjectsMissingMarketData: failed to load project_metrics: ${metricsError.message}`);

  const metricsByProject = new Map(metrics.map((m) => [m.project_id, m]));

  return allProjects
    .filter((p) => {
      const m = metricsByProject.get(p.id);
      return !m || m.price === null || m.market_cap === null;
    })
    .map((p) => ({ id: p.id, ticker: p.ticker, name: p.name }));
}
