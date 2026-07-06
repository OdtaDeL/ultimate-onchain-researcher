// Raw* (API shapes) -> Normalized* (provider output) mapping. Pure
// functions only — no I/O, no retry/validation concerns (those live in
// client.ts/base), no database writes.

import type { NormalizedCoinPaprikaTicker, RawCoinPaprikaTicker } from "./types";

export function mapCoinPaprikaTicker(raw: RawCoinPaprikaTicker): NormalizedCoinPaprikaTicker {
  const quote = raw.quotes.USD;
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    rank: raw.rank,
    priceUsd: quote.price,
    marketCapUsd: quote.market_cap,
    volume24hUsd: quote.volume_24h,
    priceChange24hPercent: quote.percent_change_24h,
    priceChange7dPercent: quote.percent_change_7d,
    priceChange30dPercent: quote.percent_change_30d,
    totalSupply: raw.total_supply,
    maxSupply: raw.max_supply,
    athPriceUsd: quote.ath_price,
    lastUpdated: raw.last_updated,
  };
}
