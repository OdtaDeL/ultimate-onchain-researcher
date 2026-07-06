// HTTP client for DexScreener's public API. See SOURCE.md for the
// endpoint inventory and response samples this is built against.
//
// Networking (timeout, retry/backoff, rate limiting, fetch, JSON parsing,
// schema validation) lives in src/providers/base/http-client.ts — this
// class only defines endpoints, request mapping, and Raw->Normalized
// mapping, per DEVELOPER_GUIDE.md "Adding a New Provider."

import { BaseHttpClient, mergeProviderConfig } from "../base";
import { mapSearchResults } from "./mapper";
import type { DexScreenerProviderConfig } from "./provider";
import { dexScreenerSearchResponseSchema } from "./schemas";
import type { NormalizedDexScreenerToken } from "./types";

export const DEFAULT_DEXSCREENER_CONFIG: DexScreenerProviderConfig = {
  baseUrl: "https://api.dexscreener.com",
  userAgent: "smart-money-discovery-platform/1.0 (+data ingestion)",
  timeoutMs: 10_000,
  // Documented limit for /latest/dex/search (docs.dexscreener.com/api/reference)
  // — an exact translation, not a conservative guess, see SOURCE.md.
  maxRequestsPerSecond: 1,
  retry: {
    maxAttempts: 4,
    baseDelayMs: 2_000,
    retryOnStatusCodes: [429, 500, 502, 503, 504],
  },
};

export class DexScreenerClient extends BaseHttpClient {
  constructor(config: Partial<DexScreenerProviderConfig> = {}) {
    super("DexScreener", mergeProviderConfig(DEFAULT_DEXSCREENER_CONFIG, config));
  }

  async searchTokens(query: string): Promise<NormalizedDexScreenerToken[]> {
    const params = new URLSearchParams({ q: query });
    const raw = await this.getJson(`/latest/dex/search?${params.toString()}`, dexScreenerSearchResponseSchema);
    return mapSearchResults(raw.pairs ?? []);
  }
}
