// Provider contract for CoinPaprika. INTERFACE ONLY — mirrors
// coingecko/provider.ts and chainbroker/provider.ts.

import type { BaseProviderConfig } from "../base/config";
import type { NormalizedCoinPaprikaTicker } from "./types";

export type CoinPaprikaProviderConfig = BaseProviderConfig;

/** Read-only access to CoinPaprika's market data — a gap-filling second source behind CoinGecko, see SOURCE.md. */
export interface CoinPaprikaProvider {
  /** Bulk snapshot for every actively-tracked coin (~2,000 on the free tier) — one call, no pagination. */
  listTickers(): Promise<NormalizedCoinPaprikaTicker[]>;
}
