// Shapes observed directly from https://api.dexscreener.com — see
// SOURCE.md for how each was discovered and a raw response sample.

// ---------------------------------------------------------------------
// Raw resource shapes
// ---------------------------------------------------------------------

export interface RawDexScreenerToken {
  address: string;
  name: string;
  symbol: string;
}

export interface RawDexScreenerPair {
  chainId: string;
  dexId: string;
  baseToken: RawDexScreenerToken;
  quoteToken: RawDexScreenerToken;
  // Confirmed live as a string ("1.90") — see SOURCE.md "Confirmed quirk."
  priceUsd?: string | null;
  priceChange?: {
    h24?: number | null;
  } | null;
  volume?: {
    h24?: number | null;
  } | null;
  liquidity?: {
    usd?: number | null;
  } | null;
  fdv?: number | null;
  marketCap?: number | null;
}

/** GET /latest/dex/search — `pairs: []` (not a 404) when nothing matches, confirmed live. */
export interface RawDexScreenerSearchResponse {
  schemaVersion: string;
  pairs: RawDexScreenerPair[] | null;
}

// ---------------------------------------------------------------------
// Normalized domain types (provider output)
// ---------------------------------------------------------------------

/**
 * One unique on-chain token, deduplicated from potentially many raw pairs
 * (the same token trades on multiple DEXs/quote-pairs — see SOURCE.md).
 * `liquidityUsd` is kept on the normalized shape (unlike most Normalized*
 * types elsewhere, which drop raw-only bookkeeping fields) because it is
 * the exact signal this dedup used to pick this row over its siblings —
 * a caller that needs to compare across multiple search results again
 * (e.g. picking the best of several distinct tokens with the same symbol
 * on different chains) needs it, not just this provider's internals.
 */
export interface NormalizedDexScreenerToken {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPercent: number | null;
  liquidityUsd: number | null;
}
