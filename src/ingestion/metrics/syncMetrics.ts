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
import type { CoinPaprikaProvider } from "../../providers/coinpaprika/provider";
import type { DexScreenerProvider } from "../../providers/dexscreener/provider";
import { getProjectsMissingMarketData } from "./gap-query";
import { MetricsIngestionService } from "./ingestion-service";
import {
  mapCoinGeckoMetrics,
  mapCoinPaprikaMetrics,
  mapDefiLlamaFeesMetrics,
  mapDefiLlamaRevenueMetrics,
  mapDefiLlamaTvlMetrics,
  mapDexScreenerMetrics,
} from "./mapper";
import type { DexScreenerMetricsColumns, MetricsDraft, MetricsSyncReport } from "./types";

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
 *
 * Gap-fill only (flipped 2026-07-06, was previously the primary/first
 * source): CoinGecko's 16,000+-coin catalog has the highest chance of any
 * provider here of containing 2+ *different* coins sharing one project's
 * ticker in the same batch — `ingestion-service.ts`'s batch-dedup guard
 * now blanks those before resolving, but running CoinGecko last, after
 * CoinPaprika/DexScreener have already claimed the columns they could,
 * means fewer projects are even exposed to that risk in the first place.
 * Run this AFTER `syncCoinPaprikaMetrics` and the DexScreener gap-fill.
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
    const pageResult = await ingestion.ingest(drafts, true);

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

/**
 * Primary market-data source (flipped 2026-07-06, was previously a
 * CoinGecko-only gap-filler): run this FIRST, before CoinGecko. Not
 * `fillNullsOnly` — writes normally (diff-and-update), same as CoinGecko
 * used to. CoinPaprika's ~2,000-coin catalog is far smaller than
 * CoinGecko's 16,000+, so it's structurally less likely to contain
 * colliding tickers within one batch — see ingestion-service.ts's
 * batch-dedup guard, which still protects this call regardless.
 */
export async function syncCoinPaprikaMetrics(
  supabase: SupabaseClient<Database>,
  provider: CoinPaprikaProvider,
): Promise<MetricsSyncReport> {
  const startedAt = new Date();
  const ingestion = new MetricsIngestionService(supabase);

  const tickers = await provider.listTickers();
  const drafts = tickers.map(mapCoinPaprikaMetrics);
  const result = await ingestion.ingest(drafts, false);

  return buildReport("coinpaprika", startedAt, new Date(), result);
}

/**
 * Second primary source (flipped 2026-07-06) — run this AFTER
 * `syncCoinPaprikaMetrics` and BEFORE `syncCoinGeckoMetrics`, so
 * `getProjectsMissingMarketData` reflects the gap CoinPaprika left
 * (not the original, larger gap) and CoinGecko's fill-only pass afterward
 * only ever touches what's still missing after both of these. Still
 * `fillNullsOnly` relative to CoinPaprika (never overwrites what it just
 * wrote) even though it's conceptually "primary" alongside it — the two
 * don't compete for the same project since this only queries projects
 * CoinPaprika left null. Unlike the bulk providers above, DexScreener has
 * no "list everything" endpoint — this queries once per gap project with
 * a ChainBroker ticker (rate-limited via the provider's own 1 req/sec
 * limiter — see providers/dexscreener/SOURCE.md), accepting a candidate
 * only on an exact, unambiguous ticker-symbol match (see
 * providers/dexscreener/SOURCE.md "Matching strategy").
 */
export async function syncDexScreenerGapFill(
  supabase: SupabaseClient<Database>,
  provider: DexScreenerProvider,
): Promise<MetricsSyncReport> {
  const startedAt = new Date();
  const ingestion = new MetricsIngestionService(supabase);

  const gapProjects = await getProjectsMissingMarketData(supabase);
  // DexScreener's search rejects very short queries with a 400 (confirmed
  // live: a 1-character ticker "U" failed this way) — excluded here rather
  // than only in the per-project catch below, since a 400 isn't in
  // DexScreenerClient's retryOnStatusCodes (it's correctly not treated as
  // transient) and would otherwise burn 4 retry attempts for a query that
  // can never succeed.
  const MIN_QUERY_LENGTH = 2;
  const withTicker = gapProjects.filter(
    (p) => p.ticker !== null && p.ticker.length >= MIN_QUERY_LENGTH,
  );

  const drafts: MetricsDraft<DexScreenerMetricsColumns>[] = [];
  for (const project of withTicker) {
    let candidates: Awaited<ReturnType<typeof provider.searchTokens>>;
    try {
      candidates = await provider.searchTokens(project.ticker as string);
    } catch {
      // One project's lookup failing (network, unexpected 4xx, etc.) must
      // not lose progress on every other gap project in this run — same
      // resilience policy as src/sync/chainbroker/paged-sync.ts.
      continue;
    }
    const exactMatches = candidates.filter(
      (c) => c.symbol.toUpperCase() === (project.ticker as string).toUpperCase(),
    );
    // 0 matches: no signal. >1: ambiguous (e.g. the same ticker bridged
    // across chains with different addresses) — skip rather than guess,
    // same "never guess" principle as src/identity/.
    if (exactMatches.length === 1) {
      drafts.push(mapDexScreenerMetrics(exactMatches[0]));
    }
  }

  const result = await ingestion.ingest(drafts, true);
  return buildReport("dexscreener", startedAt, new Date(), {
    ...result,
    totalProviderRecords: withTicker.length,
  });
}
