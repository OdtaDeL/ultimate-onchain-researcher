// Raw* (API shapes) -> Normalized* (provider output) mapping. Pure
// functions only — no I/O, no retry/validation concerns (those live in
// client.ts/base), no database writes.

import type {
  NormalizedCoinMarketData,
  NormalizedGlobalMarket,
  NormalizedSearchResult,
  NormalizedTrendingCoin,
  RawCoinDetail,
  RawCoinMarketItem,
  RawGlobalResponse,
  RawSearchCoinItem,
  RawTrendingCoinItem,
} from "./types";

/**
 * Trending's `market_cap`/`total_volume` are pre-formatted display
 * strings ("$1,203,016,649,552") rather than numbers — confirmed live,
 * see SOURCE.md. Comma-separated, no K/M/B/T suffix (unlike ChainBroker's
 * abbreviated form), so this is a narrower parser than
 * chainbroker/parse.ts's `parseAbbreviatedNumber`. Returns null for
 * anything that doesn't parse rather than throwing — a single
 * unparseable display field shouldn't fail the whole response.
 */
function parseDisplayCurrency(input: string | null | undefined): number | null {
  if (input == null) return null;
  const match = input.trim().match(/^\$?\s*(-?[0-9][0-9,]*\.?[0-9]*)$/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isNaN(value) ? null : value;
}

function usd(record: Record<string, number> | null | undefined): number | null {
  return record?.usd ?? null;
}

export function mapCoinMarketItem(raw: RawCoinMarketItem): NormalizedCoinMarketData {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    price: raw.current_price,
    marketCap: raw.market_cap,
    fullyDilutedValuation: raw.fully_diluted_valuation,
    volume24h: raw.total_volume,
    circulatingSupply: raw.circulating_supply,
    totalSupply: raw.total_supply,
    maxSupply: raw.max_supply,
    marketCapRank: raw.market_cap_rank,
    priceChange24h: raw.price_change_percentage_24h,
    priceChange7d: raw.price_change_percentage_7d_in_currency ?? null,
    priceChange30d: raw.price_change_percentage_30d_in_currency ?? null,
    ath: raw.ath,
    atl: raw.atl,
    lastUpdated: raw.last_updated,
  };
}

export function mapCoinDetail(raw: RawCoinDetail): NormalizedCoinMarketData {
  const md = raw.market_data;
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    price: usd(md.current_price),
    marketCap: usd(md.market_cap),
    fullyDilutedValuation: usd(md.fully_diluted_valuation),
    volume24h: usd(md.total_volume),
    circulatingSupply: md.circulating_supply,
    totalSupply: md.total_supply,
    maxSupply: md.max_supply,
    marketCapRank: raw.market_cap_rank,
    priceChange24h: md.price_change_percentage_24h,
    priceChange7d: md.price_change_percentage_7d,
    priceChange30d: md.price_change_percentage_30d,
    ath: usd(md.ath),
    atl: usd(md.atl),
    lastUpdated: raw.last_updated,
  };
}

export function mapTrendingCoinItem(raw: RawTrendingCoinItem): NormalizedTrendingCoin {
  const { item } = raw;
  return {
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    marketCapRank: item.market_cap_rank,
    thumbnailUrl: item.thumb ?? item.small ?? item.large ?? null,
    priceUsd: item.data.price,
    priceChangePercentage24hUsd: item.data.price_change_percentage_24h?.usd ?? null,
    marketCapUsd: parseDisplayCurrency(item.data.market_cap),
    volume24hUsd: parseDisplayCurrency(item.data.total_volume),
  };
}

export function mapSearchCoinItem(raw: RawSearchCoinItem): NormalizedSearchResult {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    marketCapRank: raw.market_cap_rank,
    thumbnailUrl: raw.thumb ?? raw.large ?? null,
  };
}

export function mapGlobalResponse(raw: RawGlobalResponse): NormalizedGlobalMarket {
  const d = raw.data;
  return {
    activeCryptocurrencies: d.active_cryptocurrencies,
    markets: d.markets,
    totalMarketCapUsd: usd(d.total_market_cap),
    totalVolumeUsd: usd(d.total_volume),
    btcDominancePercent: d.market_cap_percentage.btc ?? null,
    ethDominancePercent: d.market_cap_percentage.eth ?? null,
    marketCapChangePercentage24hUsd: d.market_cap_change_percentage_24h_usd,
    // Raw is Unix seconds; every other timestamp on this API is ISO-8601
    // (see SOURCE.md) — converted here so Normalized* is consistent.
    updatedAt: d.updated_at ? new Date(d.updated_at * 1000).toISOString() : null,
  };
}
