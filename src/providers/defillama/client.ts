// HTTP client for DefiLlama's public v1 API (api.llama.fi). See SOURCE.md
// for the endpoint inventory and response samples this is built against.
//
// Networking (timeout, retry/backoff, rate limiting, fetch, JSON parsing,
// schema validation) lives in src/providers/base/http-client.ts — this
// class only defines endpoints, request parameters, and Raw->Normalized
// mapping, per DEVELOPER_GUIDE.md "Adding a New Provider." No database
// writes, no Supabase integration, no UI, no scoring: this module only
// fetches and normalizes data from DefiLlama.

import { BaseHttpClient, mergeProviderConfig, ProviderHttpError } from "../base";
import { DefiLlamaNotFoundError } from "./errors";
import {
  mapChainListItem,
  mapFeesSummaryToFees,
  mapFeesSummaryToRevenue,
  mapProtocolDetailToChainRows,
  mapProtocolListItem,
} from "./mapper";
import type { DefiLlamaProviderConfig } from "./provider";
import {
  chainsListSchema,
  feesSummarySchema,
  protocolDetailSchema,
  protocolsListSchema,
} from "./schemas";
import type { NormalizedChainTvl, NormalizedDefiLlamaMetrics } from "./types";

export const DEFAULT_DEFILLAMA_CONFIG: DefiLlamaProviderConfig = {
  baseUrl: "https://api.llama.fi",
  userAgent: "smart-money-discovery-platform/1.0 (+data ingestion)",
  timeoutMs: 15_000,
  maxRequestsPerSecond: 1,
  retry: {
    maxAttempts: 4,
    baseDelayMs: 1_000,
    // 429: rate-limit response. 5xx: transient upstream failure. 400 is
    // deliberately excluded — it means "protocol not found" on this API
    // (see SOURCE.md), not "try again."
    retryOnStatusCodes: [429, 500, 502, 503, 504],
  },
};

export class DefiLlamaClient extends BaseHttpClient {
  constructor(config: Partial<DefiLlamaProviderConfig> = {}) {
    super("DefiLlama", mergeProviderConfig(DEFAULT_DEFILLAMA_CONFIG, config));
  }

  // -------------------------------------------------------------------
  // Public API — the 5 requested capabilities
  // -------------------------------------------------------------------

  async listProtocols(): Promise<NormalizedDefiLlamaMetrics[]> {
    const raw = await this.getJson("/protocols", protocolsListSchema);
    return raw.map(mapProtocolListItem);
  }

  async getProtocolTvlByChain(slug: string): Promise<NormalizedDefiLlamaMetrics[]> {
    const raw = await this.getProtocolDetailOrNotFound(slug);
    return mapProtocolDetailToChainRows(raw);
  }

  async getProtocolRevenue(slug: string): Promise<NormalizedDefiLlamaMetrics> {
    const raw = await this.getFeesSummaryOrNotFound(slug, "dailyRevenue");
    return mapFeesSummaryToRevenue(raw);
  }

  async getProtocolFees(slug: string): Promise<NormalizedDefiLlamaMetrics> {
    const raw = await this.getFeesSummaryOrNotFound(slug, "dailyFees");
    return mapFeesSummaryToFees(raw);
  }

  async listChains(): Promise<NormalizedChainTvl[]> {
    const raw = await this.getJson("/chains", chainsListSchema);
    return raw.map(mapChainListItem);
  }

  // -------------------------------------------------------------------
  // Internals: 400-as-"not found" handling shared by the two
  // slug-scoped endpoints (see SOURCE.md — confirmed live on both).
  // -------------------------------------------------------------------

  private async getProtocolDetailOrNotFound(slug: string) {
    try {
      return await this.getJson(`/protocol/${encodeURIComponent(slug)}`, protocolDetailSchema);
    } catch (error) {
      throw this.toNotFoundIfApplicable(error);
    }
  }

  private async getFeesSummaryOrNotFound(slug: string, dataType: "dailyFees" | "dailyRevenue") {
    const query = new URLSearchParams({ dataType });
    try {
      return await this.getJson(
        `/summary/fees/${encodeURIComponent(slug)}?${query.toString()}`,
        feesSummarySchema,
      );
    } catch (error) {
      throw this.toNotFoundIfApplicable(error);
    }
  }

  private toNotFoundIfApplicable(error: unknown): unknown {
    if (error instanceof ProviderHttpError && error.status === 400) {
      return new DefiLlamaNotFoundError(error.url, error.body);
    }
    return error;
  }
}
