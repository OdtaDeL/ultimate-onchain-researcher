// Draft/report types for the unified Market Metrics pipeline. Mirrors
// the target `project_metrics` columns (supabase/migrations/
// 001_initial_schema.sql + 006_project_metrics_extension.sql) split by
// which provider owns which column — see mapper.ts for why the split
// matters (it's the entire merge-safety mechanism).

import type { ProviderIdentity } from "../../identity/identity-service";

export type MetricsProvider = "coingecko" | "defillama" | "coinpaprika" | "dexscreener";

/** Columns CoinGecko owns. CoinGecko ingestion must never touch any column outside this type. */
export interface CoinGeckoMetricsColumns {
  price: number | null;
  market_cap: number | null;
  fdv: number | null;
  volume_24h: number | null;
  market_cap_rank: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
  ath: number | null;
  atl: number | null;
}

/** Columns DefiLlama owns. DefiLlama ingestion must never touch any column outside this type. */
export interface DefiLlamaMetricsColumns {
  tvl: number | null;
  tvl_change_1d: number | null;
  tvl_change_7d: number | null;
  revenue_24h: number | null;
  revenue_30d: number | null;
  fees_24h: number | null;
  fees_30d: number | null;
}

/**
 * Columns CoinPaprika owns. Same underlying column set CoinGecko writes
 * (both are general market-data providers), which is normally forbidden
 * (see "own columns" rule above) — safe here ONLY because CoinPaprika
 * ingestion always runs through `MetricsUpsertService`'s `fillNullsOnly`
 * mode (see upsert-service.ts), which structurally cannot overwrite a
 * value CoinGecko already supplied. No `fdv` — CoinPaprika's `/tickers`
 * has no such field (see providers/coinpaprika/SOURCE.md).
 */
export interface CoinPaprikaMetricsColumns {
  price: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  market_cap_rank: number | null;
  total_supply: number | null;
  max_supply: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
  ath: number | null;
}

/**
 * Columns DexScreener owns. Same `fillNullsOnly`-only safety rule as
 * CoinPaprika above. Narrower still — DexScreener's search endpoint has
 * no supply/ATH/ATL/7d/30d fields at all (see providers/dexscreener/SOURCE.md).
 */
export interface DexScreenerMetricsColumns {
  price: number | null;
  market_cap: number | null;
  fdv: number | null;
  volume_24h: number | null;
  price_change_24h: number | null;
}

export type MetricsColumns =
  | CoinGeckoMetricsColumns
  | DefiLlamaMetricsColumns
  | CoinPaprikaMetricsColumns
  | DexScreenerMetricsColumns;

/**
 * Output of mapper.ts — one provider record, not yet identity-resolved.
 * `lastUpdated` is the provider's own freshness timestamp, carried for
 * diagnostics/logging only; it is not persisted as a project_metrics
 * column (see mapper.ts header).
 *
 * `columns` is `Partial<TColumns>`, not `TColumns` — deliberately. A
 * provider can own a field set without every one of its *endpoints*
 * supplying all of it in one response (DefiLlama's TVL/Revenue/Fees
 * endpoints each cover a different subset — see mapper.ts). Omitting a
 * key here means "this endpoint has no opinion about it," which the
 * upsert layer leaves untouched; explicitly including it as `null` would
 * mean "set it to null," clobbering a previously-ingested value from a
 * *different endpoint of the same provider*. Getting this distinction
 * wrong silently destroys data, so every mapper function must only
 * include the keys its specific source endpoint actually populated.
 */
export interface MetricsDraft<TColumns extends MetricsColumns> {
  identity: ProviderIdentity;
  columns: Partial<TColumns>;
  lastUpdated: string | null;
}

/** Output of identity resolution — a draft with a confirmed project_id, ready to upsert. */
export interface ResolvedMetricsDraft<TColumns extends MetricsColumns> extends MetricsDraft<TColumns> {
  projectId: string;
}

export type UpsertOutcome = "inserted" | "updated" | "unchanged";

// ---------------------------------------------------------------------
// Resolution breakdown — the 6 categories requested, plus one honest
// extra. See IDENTITY.md "Why tiers 2, 6, and 7 collapse into one
// lookup": once a hit comes from the alias-table cache, its tier label
// is generically "alias_table" with the *originally stored* confidence
// attached. This pipeline reclassifies confidence 95/90/75/60 back into
// provider_id/slug/symbol/name for reporting (since those scores are
// unique to one tier each), but confidence 100 is genuinely ambiguous
// between "contract_address" and "manual_override" once cached — no
// provider populates contract addresses today (see mapper.ts), so this
// pipeline counts a cached confidence-100 hit as manual_override. A
// *fresh* (non-cached) contract-address tier hit is still counted
// correctly via its own tier label. This is a documented heuristic, not
// a guarantee — see ingestion-service.ts `classifyResolutionTier`.
// ---------------------------------------------------------------------

export interface ResolutionBreakdown {
  contractMatches: number;
  providerIdMatches: number;
  slugMatches: number;
  symbolMatches: number;
  nameMatches: number;
  manualOverrideMatches: number;
  /** Confidence-40 alias-table hits with no stronger original signal — not one of the 6 requested categories, surfaced rather than silently dropped or misclassified. */
  aliasTableMatches: number;
}

export interface MetricsSyncReport {
  provider: MetricsProvider;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totalProviderRecords: number;
  matchedProjects: number;
  unmatchedProjects: number;
  /** 0-100. `matchedProjects / totalProviderRecords`, or 0 when totalProviderRecords is 0. */
  coveragePercentage: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
  resolutionBreakdown: ResolutionBreakdown;
}
