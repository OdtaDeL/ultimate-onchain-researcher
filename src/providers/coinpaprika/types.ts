// Shapes observed directly from https://api.coinpaprika.com/v1 — see
// SOURCE.md for how each was discovered and a raw response sample.

// ---------------------------------------------------------------------
// Raw resource shapes
// ---------------------------------------------------------------------

export interface RawCoinPaprikaQuoteUsd {
  price: number | null;
  volume_24h: number | null;
  market_cap: number | null;
  percent_change_24h: number | null;
  percent_change_7d: number | null;
  percent_change_30d: number | null;
  ath_price: number | null;
  ath_date: string | null;
}

/** GET /v1/tickers — flat array, no pagination envelope (see SOURCE.md). */
export interface RawCoinPaprikaTicker {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  // Confirmed live as `0` (not null) for at least one no-max-supply token —
  // see SOURCE.md "Confirmed quirk." Carried through as-is.
  total_supply: number | null;
  max_supply: number | null;
  last_updated: string | null;
  quotes: {
    USD: RawCoinPaprikaQuoteUsd;
  };
}

// ---------------------------------------------------------------------
// Normalized domain types (provider output)
// ---------------------------------------------------------------------

export interface NormalizedCoinPaprikaTicker {
  /** CoinPaprika's own id, e.g. "btc-bitcoin" — NOT passed to the identity resolver as a slug (see SOURCE.md). */
  id: string;
  name: string;
  symbol: string;
  rank: number;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  athPriceUsd: number | null;
  /** ISO-8601 */
  lastUpdated: string | null;
}
