// Shapes observed directly from https://api.coingecko.com/api/v3 — see
// SOURCE.md for how each was discovered and a raw response sample.
// "Raw*" types mirror the API verbatim (including its per-currency
// objects and the one endpoint that returns display strings instead of
// numbers). "Normalized*" types are what this provider hands back to the
// rest of the platform — aligned to project_metrics's future shape
// (supabase/migrations/001_initial_schema.sql), not the current one.

// ---------------------------------------------------------------------
// Raw resource shapes
// ---------------------------------------------------------------------

/** GET /coins/markets — flat, single vs_currency, no pagination envelope (see SOURCE.md). */
export interface RawCoinMarketItem {
  id: string;
  symbol: string;
  name: string;
  image?: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  // Only present when the caller requests `price_change_percentage=7d,30d`.
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_date: string | null;
  last_updated: string | null;
}

/** Per-currency `market_data` block on GET /coins/{id}. Only the `usd` key is ever read. */
export interface RawCoinDetailMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  fully_diluted_valuation: Record<string, number>;
  total_volume: Record<string, number>;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_30d: number | null;
  ath: Record<string, number>;
  ath_date: Record<string, string>;
  atl: Record<string, number>;
  atl_date: Record<string, string>;
}

/** GET /coins/{id}?market_data=true — only the fields this provider consumes are typed. */
export interface RawCoinDetail {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number | null;
  last_updated: string | null;
  market_data: RawCoinDetailMarketData;
}

/** GET /coins/{id} error body, confirmed live for an unknown id. */
export interface RawCoinGeckoErrorBody {
  error: string;
}

/** A single trending coin's `data` block — money fields are display strings here (see SOURCE.md). */
export interface RawTrendingCoinData {
  price: number | null;
  price_change_percentage_24h?: Record<string, number> | null;
  market_cap: string | null;
  total_volume: string | null;
}

export interface RawTrendingCoinItem {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb?: string | null;
    small?: string | null;
    large?: string | null;
    slug: string;
    data: RawTrendingCoinData;
  };
}

/** GET /search/trending — `nfts`/`categories` are out of scope (see SOURCE.md), validated loosely. */
export interface RawTrendingResponse {
  coins: RawTrendingCoinItem[];
  nfts: unknown[];
  categories: unknown[];
}

export interface RawSearchCoinItem {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb?: string | null;
  large?: string | null;
}

/** GET /search — `exchanges`/`icos`/`categories`/`nfts` are out of scope, validated loosely. */
export interface RawSearchResponse {
  coins: RawSearchCoinItem[];
  exchanges: unknown[];
  icos: unknown[];
  categories: unknown[];
  nfts: unknown[];
}

export interface RawGlobalMarketData {
  active_cryptocurrencies: number;
  markets: number;
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number | null;
  /** Unix seconds — every other timestamp on this API is ISO-8601 (see SOURCE.md). */
  updated_at: number;
}

/** GET /global */
export interface RawGlobalResponse {
  data: RawGlobalMarketData;
}

// ---------------------------------------------------------------------
// Normalized domain types (provider output)
// ---------------------------------------------------------------------

/**
 * Shared output of Coins Markets and Coin Details — both endpoints
 * describe the same real-world entity (a coin's current market
 * snapshot), just with different raw shapes. Field names are chosen to
 * match project_metrics's anticipated future columns (see
 * SYSTEM_ARCHITECTURE.md "Future Providers"); this table does not have
 * all of these columns yet, and adding them is a future migration, not
 * part of this provider.
 */
export interface NormalizedCoinMarketData {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  marketCap: number | null;
  fullyDilutedValuation: number | null;
  volume24h: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  marketCapRank: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  ath: number | null;
  atl: number | null;
  /** ISO-8601 */
  lastUpdated: string | null;
}

export interface NormalizedTrendingCoin {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
  thumbnailUrl: string | null;
  priceUsd: number | null;
  priceChangePercentage24hUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
}

/** No market data on this endpoint at all — identity-only (see SOURCE.md). */
export interface NormalizedSearchResult {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
  thumbnailUrl: string | null;
}

export interface NormalizedGlobalMarket {
  activeCryptocurrencies: number;
  markets: number;
  totalMarketCapUsd: number | null;
  totalVolumeUsd: number | null;
  btcDominancePercent: number | null;
  ethDominancePercent: number | null;
  marketCapChangePercentage24hUsd: number | null;
  /** ISO-8601, converted from the raw Unix-seconds `updated_at`. */
  updatedAt: string | null;
}
