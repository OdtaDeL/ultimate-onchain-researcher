// Provider contract for DexScreener. INTERFACE ONLY — mirrors
// coingecko/provider.ts and chainbroker/provider.ts.

import type { BaseProviderConfig } from "../base/config";
import type { NormalizedDexScreenerToken } from "./types";

export type DexScreenerProviderConfig = BaseProviderConfig;

/** Read-only access to DexScreener's on-chain DEX data — a narrow, third gap-filling source behind CoinGecko/CoinPaprika, see SOURCE.md. */
export interface DexScreenerProvider {
  /**
   * Free-text search, deduplicated to one row per unique token address
   * (the raw API returns one row per trading pair — see SOURCE.md).
   * Returns an empty array for no matches, never throws for that case.
   */
  searchTokens(query: string): Promise<NormalizedDexScreenerToken[]>;
}
