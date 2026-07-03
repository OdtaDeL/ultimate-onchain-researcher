// Top-level sync jobs for the Market Metrics pipeline — one per
// provider, fetching from that provider's client, mapping, and handing
// off to MetricsIngestionService.
//
// Architecture note: ChainBroker's equivalent "sync job" layer lives in
// a separate src/sync/chainbroker/ folder, split out because it has 4
// data jobs, bootstrap variants of each, and shared pagination/retry/
// logging helpers worth their own module. This pipeline has exactly 2
// jobs total (one per provider), so that split would be over-structuring
// for what it's solving — both jobs live here, directly in
// src/ingestion/metrics/, per the task's own file list. If this grows
// (more providers, bootstrap variants, shared retry policy), revisit
// splitting into src/sync/metrics/ the same way sync-metadata.ts was
// pulled out of src/sync/chainbroker/ once it needed to be shared.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import type { CoinGeckoProvider, CoinsMarketsParams } from "../../providers/coingecko/provider";
import type { DefiLlamaProvider } from "../../providers/defillama/provider";
import { MetricsIngestionService } from "./ingestion-service";
import {
  mapCoinGeckoMetrics,
  mapDefiLlamaFeesMetrics,
  mapDefiLlamaRevenueMetrics,
  mapDefiLlamaTvlMetrics,
} from "./mapper";
import type { MetricsSyncReport } from "./types";

export interface SyncMetricsOptions {
  /** Caps how many /coins/markets pages CoinGecko fetches. Omit for the full catalog. */
  maxPages?: number;
  /** Per-page size for CoinGecko (default 250, the API's own max — see providers/coingecko/SOURCE.md). */
  perPage?: number;
}

function buildReport(
  provider: MetricsSyncReport["provider"],
  startedAt: Date,
  finishedAt: Date,
  result: {
    totalProviderRecords: number;
    matchedProjects: number;
    unmatchedProjects: number;
    inserted: number;
    updated: number;
    unchanged: number;
    failed: number;
    resolutionBreakdown: MetricsSyncReport["resolutionBreakdown"];
  },
): MetricsSyncReport {
  return {
    provider,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    totalProviderRecords: result.totalProviderRecords,
    matchedProjects: result.matchedProjects,
    unmatchedProjects: result.unmatchedProjects,
    coveragePercentage:
      result.totalProviderRecords === 0
        ? 0
        : Math.round((result.matchedProjects / result.totalProviderRecords) * 10_000) / 100,
    inserted: result.inserted,
    updated: result.updated,
    unchanged: result.unchanged,
    failed: result.failed,
    resolutionBreakdown: result.resolutionBreakdown,
  };
}

/**
 * Syncs CoinGecko-owned columns for every coin in /coins/markets,
 * paginated. Each page is resolved and upserted independently — a
 * failure resolving/upserting one page's records doesn't lose progress
 * already made on earlier pages.
 */
export async function syncCoinGeckoMetrics(
  supabase: SupabaseClient<Database>,
  provider: CoinGeckoProvider,
  options: SyncMetricsOptions = {},
): Promise<MetricsSyncReport> {
  const startedAt = new Date();
  const ingestion = new MetricsIngestionService(supabase);
  const perPage = options.perPage ?? 250;

  const totals = {
    totalProviderRecords: 0,
    matchedProjects: 0,
    unmatchedProjects: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    resolutionBreakdown: {
      contractMatches: 0,
      providerIdMatches: 0,
      slugMatches: 0,
      symbolMatches: 0,
      nameMatches: 0,
      manualOverrideMatches: 0,
      aliasTableMatches: 0,
    },
  };

  let page = 1;
  for (;;) {
    const params: CoinsMarketsParams = { page, perPage };
    const result = await provider.listCoinsMarkets(params);
    const drafts = result.items.map(mapCoinGeckoMetrics);
    const pageResult = await ingestion.ingest(drafts);

    totals.totalProviderRecords += pageResult.totalProviderRecords;
    totals.matchedProjects += pageResult.matchedProjects;
    totals.unmatchedProjects += pageResult.unmatchedProjects;
    totals.inserted += pageResult.inserted;
    totals.updated += pageResult.updated;
    totals.unchanged += pageResult.unchanged;
    totals.failed += pageResult.failed;
    for (const key of Object.keys(totals.resolutionBreakdown) as (keyof typeof totals.resolutionBreakdown)[]) {
      totals.resolutionBreakdown[key] += pageResult.resolutionBreakdown[key];
    }

    const reachedMaxPages = options.maxPages !== undefined && page >= options.maxPages;
    if (!result.hasNext || reachedMaxPages) break;
    page += 1;
  }

  return buildReport("coingecko", startedAt, new Date(), totals);
}

/**
 * Syncs DefiLlama-owned TVL columns (tvl, tvl_change_1d, tvl_change_7d)
 * for every protocol via the bulk /protocols endpoint.
 *
 * Revenue/fees are deliberately NOT included in this bulk sync:
 * DefiLlamaProvider only exposes per-protocol revenue/fees
 * (getProtocolRevenue/getProtocolFees, one HTTP call each), and there is
 * no bulk endpoint for them today (see providers/defillama/SOURCE.md
 * "Future extension" — /overview/fees would be the bulk alternative, not
 * yet implemented on the provider). Running revenue+fees for every
 * protocol from listProtocols() would mean 2 extra HTTP calls per
 * protocol — over 15,000 requests at the provider's conservative
 * 1-req/sec default (see providers/defillama/client.ts) — which would
 * make a routine sync run for hours. `syncDefiLlamaProtocolFeesAndRevenue`
 * is provided separately, scoped to a caller-supplied slug list, rather
 * than silently wiring an impractical default into this function.
 */
export async function syncDefiLlamaMetrics(
  supabase: SupabaseClient<Database>,
  provider: DefiLlamaProvider,
): Promise<MetricsSyncReport> {
  const startedAt = new Date();
  const ingestion = new MetricsIngestionService(supabase);

  const protocols = await provider.listProtocols();
  const drafts = protocols.map(mapDefiLlamaTvlMetrics);
  const result = await ingestion.ingest(drafts);

  return buildReport("defillama", startedAt, new Date(), result);
}

/**
 * Revenue/fees for an explicit, caller-scoped list of protocol slugs —
 * see syncDefiLlamaMetrics's doc comment for why this isn't run for
 * every protocol by default. Each slug requires 2 HTTP calls
 * (getProtocolRevenue + getProtocolFees); callers should scope this to
 * a deliberately small/curated list (e.g. top-N by TVL), not the full
 * catalog.
 */
export async function syncDefiLlamaProtocolFeesAndRevenue(
  supabase: SupabaseClient<Database>,
  provider: DefiLlamaProvider,
  slugs: string[],
): Promise<MetricsSyncReport> {
  const startedAt = new Date();
  const ingestion = new MetricsIngestionService(supabase);

  const drafts = [];
  for (const slug of slugs) {
    const [revenue, fees] = await Promise.all([
      provider.getProtocolRevenue(slug),
      provider.getProtocolFees(slug),
    ]);
    // Disjoint column sets (revenue_24h/30d vs fees_24h/30d) — merged
    // for the same project by normalize.ts after identity resolution.
    drafts.push(mapDefiLlamaRevenueMetrics(revenue), mapDefiLlamaFeesMetrics(fees));
  }

  const result = await ingestion.ingest(drafts);
  return buildReport("defillama", startedAt, new Date(), result);
}
