// Raw* (API shapes) -> Normalized* (provider output) mapping. Pure
// functions only — no I/O, no retry/validation concerns (those live in
// client.ts/base), no database writes.

import type { NormalizedDexScreenerToken, RawDexScreenerPair } from "./types";

/** Confirmed live as a string ("1.90") — see SOURCE.md "Confirmed quirk." Returns null rather than NaN. */
function parsePriceUsd(value: string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapPair(raw: RawDexScreenerPair): NormalizedDexScreenerToken {
  return {
    address: raw.baseToken.address,
    chainId: raw.chainId,
    name: raw.baseToken.name,
    symbol: raw.baseToken.symbol,
    priceUsd: parsePriceUsd(raw.priceUsd),
    marketCapUsd: raw.marketCap ?? null,
    fdvUsd: raw.fdv ?? null,
    volume24hUsd: raw.volume?.h24 ?? null,
    priceChange24hPercent: raw.priceChange?.h24 ?? null,
    liquidityUsd: raw.liquidity?.usd ?? null,
  };
}

/**
 * Deduplicates raw pairs to one row per unique `baseToken.address` — the
 * same token trades on multiple DEXs/quote-pairs (see SOURCE.md), and
 * `marketCap`/`fdv`/`priceUsd` are identical across a token's own pairs,
 * so picking the highest-liquidity pair per address is a noise-reduction
 * step, not a data quality tradeoff (no field differs across the
 * candidates being deduplicated, only which pool happens to report it).
 */
export function mapSearchResults(pairs: RawDexScreenerPair[]): NormalizedDexScreenerToken[] {
  const byAddress = new Map<string, NormalizedDexScreenerToken>();

  for (const raw of pairs) {
    const mapped = mapPair(raw);
    const existing = byAddress.get(mapped.address);
    const existingLiquidity = existing?.liquidityUsd ?? -1;
    const candidateLiquidity = mapped.liquidityUsd ?? -1;
    if (!existing || candidateLiquidity > existingLiquidity) {
      byAddress.set(mapped.address, mapped);
    }
  }

  return [...byAddress.values()];
}
