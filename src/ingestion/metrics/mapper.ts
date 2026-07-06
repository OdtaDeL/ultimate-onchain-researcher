// Raw (provider Normalized* types) -> Draft mapping. Pure functions only
// — no I/O, no identity resolution, no Supabase. Mirrors the
// providers/<x>/mapper.ts convention: boring 1:1 field renames, no
// comparison logic of any kind (identity matching happens exclusively in
// src/identity/ — see ingestion-service.ts).
//
// Each function extracts ONLY the columns its provider owns (see
// types.ts) — this is the actual mechanism behind "CoinGecko must never
// overwrite DefiLlama metrics": a CoinGecko draft's `columns` object
// has no DefiLlama keys to begin with, so there is nothing for the
// upsert layer to accidentally clobber.

import type { NormalizedCoinMarketData } from "../../providers/coingecko/types";
import type { NormalizedDefiLlamaMetrics } from "../../providers/defillama/types";
import type { NormalizedCoinPaprikaTicker } from "../../providers/coinpaprika/types";
import type { NormalizedDexScreenerToken } from "../../providers/dexscreener/types";
import type {
  CoinGeckoMetricsColumns,
  CoinPaprikaMetricsColumns,
  DefiLlamaMetricsColumns,
  DexScreenerMetricsColumns,
  MetricsDraft,
} from "./types";

export function mapCoinGeckoMetrics(raw: NormalizedCoinMarketData): MetricsDraft<CoinGeckoMetricsColumns> {
  return {
    identity: {
      provider: "coingecko",
      // CoinGecko's `id` doubles as both its provider-specific id and a
      // slug-like value (e.g. "aave") — giving the resolver both signals
      // from the same string is intentional, not redundant, see
      // IDENTITY.md "Why tiers 2, 6, and 7 collapse into one lookup."
      providerId: raw.id,
      slug: raw.id,
      symbol: raw.symbol,
      name: raw.name,
    },
    columns: {
      price: raw.price,
      market_cap: raw.marketCap,
      fdv: raw.fullyDilutedValuation,
      volume_24h: raw.volume24h,
      market_cap_rank: raw.marketCapRank,
      circulating_supply: raw.circulatingSupply,
      total_supply: raw.totalSupply,
      max_supply: raw.maxSupply,
      price_change_24h: raw.priceChange24h,
      price_change_7d: raw.priceChange7d,
      price_change_30d: raw.priceChange30d,
      ath: raw.ath,
      atl: raw.atl,
    },
    lastUpdated: raw.lastUpdated,
  };
}

function defiLlamaIdentity(raw: NormalizedDefiLlamaMetrics): MetricsDraft<DefiLlamaMetricsColumns>["identity"] {
  return {
    provider: "defillama",
    slug: raw.projectSlug,
    name: raw.protocolName,
    // DefiLlama's Normalized output carries no separate provider id or
    // ticker symbol distinct from its slug/name (see
    // providers/defillama/types.ts) — providerId/symbol are simply
    // absent here, not omitted by mistake. The resolver tiers that
    // depend on them just won't fire for this provider, which is
    // expected (see DEVELOPER_GUIDE.md "Extension Guide").
  };
}

/**
 * DefiLlama's TVL/Protocols endpoints (listProtocols, getProtocolTvlByChain)
 * only ever populate tvl/tvlChange1d/tvlChange7d on NormalizedDefiLlamaMetrics
 * — revenue/fees come back null on those endpoints, not because the
 * protocol has none, but because that endpoint doesn't report them (see
 * providers/defillama/SOURCE.md). Only including the 3 TVL keys here
 * (never the other 4) is what stops a TVL-only sync from nulling out
 * previously-ingested revenue/fees — see types.ts MetricsDraft doc comment.
 */
export function mapDefiLlamaTvlMetrics(
  raw: NormalizedDefiLlamaMetrics,
): MetricsDraft<DefiLlamaMetricsColumns> {
  return {
    identity: defiLlamaIdentity(raw),
    columns: {
      tvl: raw.tvl,
      tvl_change_1d: raw.tvlChange1d,
      tvl_change_7d: raw.tvlChange7d,
    },
    lastUpdated: raw.lastUpdated,
  };
}

/** DefiLlama's Revenue endpoint (getProtocolRevenue) — only revenue_24h/30d, same reasoning as mapDefiLlamaTvlMetrics. */
export function mapDefiLlamaRevenueMetrics(
  raw: NormalizedDefiLlamaMetrics,
): MetricsDraft<DefiLlamaMetricsColumns> {
  return {
    identity: defiLlamaIdentity(raw),
    columns: {
      revenue_24h: raw.revenue24h,
      revenue_30d: raw.revenue30d,
    },
    lastUpdated: raw.lastUpdated,
  };
}

/** DefiLlama's Fees endpoint (getProtocolFees) — only fees_24h/30d, same reasoning as mapDefiLlamaTvlMetrics. */
export function mapDefiLlamaFeesMetrics(
  raw: NormalizedDefiLlamaMetrics,
): MetricsDraft<DefiLlamaMetricsColumns> {
  return {
    identity: defiLlamaIdentity(raw),
    columns: {
      fees_24h: raw.fees24h,
      fees_30d: raw.fees30d,
    },
    lastUpdated: raw.lastUpdated,
  };
}

/**
 * CoinPaprika — gap-fill only (see types.ts's `CoinPaprikaMetricsColumns`
 * doc comment and upsert-service.ts's `fillNullsOnly`). No `slug`:
 * CoinPaprika's own `id` (e.g. "btc-bitcoin") does not match ChainBroker's
 * plain slugs (e.g. "bitcoin") — see providers/coinpaprika/SOURCE.md —
 * so only symbol/name are given to the resolver.
 */
export function mapCoinPaprikaMetrics(raw: NormalizedCoinPaprikaTicker): MetricsDraft<CoinPaprikaMetricsColumns> {
  return {
    identity: {
      provider: "coinpaprika",
      symbol: raw.symbol,
      name: raw.name,
    },
    columns: {
      price: raw.priceUsd,
      market_cap: raw.marketCapUsd,
      volume_24h: raw.volume24hUsd,
      market_cap_rank: raw.rank,
      total_supply: raw.totalSupply,
      max_supply: raw.maxSupply,
      price_change_24h: raw.priceChange24hPercent,
      price_change_7d: raw.priceChange7dPercent,
      price_change_30d: raw.priceChange30dPercent,
      ath: raw.athPriceUsd,
    },
    lastUpdated: raw.lastUpdated,
  };
}

/**
 * DexScreener — gap-fill only, same reasoning as mapCoinPaprikaMetrics.
 * `raw` here is a single already-matched token (see
 * src/ingestion/metrics/syncMetrics.ts's `syncDexScreenerGapFill`, which
 * performs the exact-symbol matching before calling this) — this function
 * is a pure field rename, no matching logic of its own.
 */
export function mapDexScreenerMetrics(raw: NormalizedDexScreenerToken): MetricsDraft<DexScreenerMetricsColumns> {
  return {
    identity: {
      provider: "dexscreener",
      symbol: raw.symbol,
      name: raw.name,
    },
    columns: {
      price: raw.priceUsd,
      market_cap: raw.marketCapUsd,
      fdv: raw.fdvUsd,
      volume_24h: raw.volume24hUsd,
      price_change_24h: raw.priceChange24hPercent,
    },
    lastUpdated: null,
  };
}
