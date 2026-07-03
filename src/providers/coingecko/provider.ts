// Provider contract for CoinGecko. INTERFACE ONLY — no HTTP client
// implementation here, mirroring chainbroker/provider.ts. Coding the rest
// of the platform against this interface, rather than against
// `CoinGeckoClient` directly, means a second implementation (e.g. a
// keyed Pro-tier client) can be swapped in without touching callers — see
// SYSTEM_ARCHITECTURE.md ADR 5.

import type { BaseProviderConfig } from "../base/config";
import type {
  NormalizedCoinMarketData,
  NormalizedGlobalMarket,
  NormalizedSearchResult,
  NormalizedTrendingCoin,
} from "./types";

// Identical shape to BaseProviderConfig today — kept as its own named
// type so CoinGecko-specific fields (e.g. a future Demo/Pro `apiKey`,
// see SOURCE.md "Future extension") can be added here without touching
// src/providers/base/.
export type CoinGeckoProviderConfig = BaseProviderConfig;

export interface CoinsMarketsParams {
  /** Defaults to "usd". */
  vsCurrency?: string;
  /** Restrict to specific coin ids; omit for the full market, paged. */
  ids?: string[];
  /** 1-indexed. Defaults to 1. */
  page?: number;
  /** Max 250 per CoinGecko's own limit. Defaults to 100. */
  perPage?: number;
}

/**
 * CoinGecko's /coins/markets has no pagination envelope at all (see
 * SOURCE.md) — there is no real `totalPages`/`totalCount` to report.
 * `hasNext` is a heuristic (a full page *might* mean more exist), not a
 * guarantee, and is documented as such rather than silently presented as
 * a confirmed signal.
 */
export interface CoinGeckoMarketsPage<T> {
  items: T[];
  page: number;
  perPage: number;
  hasNext: boolean;
}

/** Read-only access to CoinGecko's market data. */
export interface CoinGeckoProvider {
  /** Bulk market snapshot, for project_metrics-style refreshes across many coins at once. */
  listCoinsMarkets(params?: CoinsMarketsParams): Promise<CoinGeckoMarketsPage<NormalizedCoinMarketData>>;

  /** Single-coin market snapshot, richer than listCoinsMarkets for one id (e.g. ATH/ATL dates in full). */
  getCoinDetails(coinId: string): Promise<NormalizedCoinMarketData>;

  /** Top searched-for coins right now — no ingestion meaning yet, but useful for a future "trending" feature. */
  getTrendingCoins(): Promise<NormalizedTrendingCoin[]>;

  /** Free-text coin search, identity-only (no market data — see SOURCE.md). */
  search(query: string): Promise<NormalizedSearchResult[]>;

  /** Aggregate market stats (total cap, BTC/ETH dominance, etc). */
  getGlobalMarket(): Promise<NormalizedGlobalMarket>;
}
