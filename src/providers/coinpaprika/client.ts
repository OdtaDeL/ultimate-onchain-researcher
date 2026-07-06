// HTTP client for CoinPaprika's public v1 API. See SOURCE.md for the
// endpoint inventory and response sample this is built against.
//
// Networking (timeout, retry/backoff, rate limiting, fetch, JSON parsing,
// schema validation) lives in src/providers/base/http-client.ts — this
// class only defines endpoints, request mapping, and Raw->Normalized
// mapping, per DEVELOPER_GUIDE.md "Adding a New Provider."

import { BaseHttpClient, mergeProviderConfig } from "../base";
import { mapCoinPaprikaTicker } from "./mapper";
import type { CoinPaprikaProviderConfig } from "./provider";
import { coinPaprikaTickersListSchema } from "./schemas";
import type { NormalizedCoinPaprikaTicker } from "./types";

export const DEFAULT_COINPAPRIKA_CONFIG: CoinPaprikaProviderConfig = {
  baseUrl: "https://api.coinpaprika.com/v1",
  userAgent: "smart-money-discovery-platform/1.0 (+data ingestion)",
  timeoutMs: 15_000,
  // No documented or observed limit (see SOURCE.md) — conservative default,
  // same posture as ChainBroker/CoinGecko. In practice this provider only
  // ever issues one request per sync run (the bulk /tickers call below),
  // so this ceiling is never actually exercised.
  maxRequestsPerSecond: 1,
  retry: {
    maxAttempts: 4,
    baseDelayMs: 2_000,
    retryOnStatusCodes: [429, 500, 502, 503, 504],
  },
};

export class CoinPaprikaClient extends BaseHttpClient {
  constructor(config: Partial<CoinPaprikaProviderConfig> = {}) {
    super("CoinPaprika", mergeProviderConfig(DEFAULT_COINPAPRIKA_CONFIG, config));
  }

  async listTickers(): Promise<NormalizedCoinPaprikaTicker[]> {
    const raw = await this.getJson("/tickers", coinPaprikaTickersListSchema);
    return raw.map(mapCoinPaprikaTicker);
  }
}
