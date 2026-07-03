// HTTP client for CoinGecko's public v3 API. See SOURCE.md for the
// endpoint inventory and response samples this is built against.
//
// Networking (timeout, retry/backoff, rate limiting, fetch, JSON parsing,
// schema validation) lives in src/providers/base/http-client.ts — this
// class only defines endpoints, request parameters, and Raw->Normalized
// mapping, per DEVELOPER_GUIDE.md "Adding a New Provider." No database
// writes, no Supabase integration, no UI: this module only fetches and
// normalizes data from CoinGecko.

import { BaseHttpClient, mergeProviderConfig, ProviderHttpError } from "../base";
import { CoinGeckoNotFoundError } from "./errors";
import {
  mapCoinDetail,
  mapCoinMarketItem,
  mapGlobalResponse,
  mapSearchCoinItem,
  mapTrendingCoinItem,
} from "./mapper";
import type { CoinGeckoMarketsPage, CoinGeckoProviderConfig, CoinsMarketsParams } from "./provider";
import {
  coinDetailSchema,
  coinMarketsListSchema,
  globalResponseSchema,
  searchResponseSchema,
  trendingResponseSchema,
} from "./schemas";
import type {
  NormalizedCoinMarketData,
  NormalizedGlobalMarket,
  NormalizedSearchResult,
  NormalizedTrendingCoin,
} from "./types";

export const DEFAULT_COINGECKO_CONFIG: CoinGeckoProviderConfig = {
  baseUrl: "https://api.coingecko.com/api/v3",
  userAgent: "smart-money-discovery-platform/1.0 (+data ingestion)",
  timeoutMs: 10_000,
  // CoinGecko's free public API (no key) has a hard per-minute cap that
  // resets on a ~60-second window. 0.2 req/sec = 12 req/min keeps us
  // well under even the most conservative free-tier limit. If you have a
  // CoinGecko Demo or Pro API key, pass it as a custom header via the
  // constructor's config override and bump this to 0.5–1.
  maxRequestsPerSecond: 0.2,
  retry: {
    maxAttempts: 4,
    // 30s base gives delays of 30s/60s/120s/240s — long enough for CoinGecko's
    // per-minute rate-limit window to reset between retries on 429.
    baseDelayMs: 30_000,
    // 429: documented rate-limit response. 5xx: transient upstream
    // failure. 404 is deliberately excluded — it means "coin not found,"
    // not "try again" (see SOURCE.md).
    retryOnStatusCodes: [429, 500, 502, 503, 504],
  },
};

const DEFAULT_VS_CURRENCY = "usd";
const DEFAULT_PER_PAGE = 100;

export class CoinGeckoClient extends BaseHttpClient {
  constructor(config: Partial<CoinGeckoProviderConfig> = {}) {
    super("CoinGecko", mergeProviderConfig(DEFAULT_COINGECKO_CONFIG, config));
  }

  // -------------------------------------------------------------------
  // Public API — the 5 requested capabilities
  // -------------------------------------------------------------------

  async listCoinsMarkets(
    params: CoinsMarketsParams = {},
  ): Promise<CoinGeckoMarketsPage<NormalizedCoinMarketData>> {
    const vsCurrency = params.vsCurrency ?? DEFAULT_VS_CURRENCY;
    const page = params.page ?? 1;
    const perPage = params.perPage ?? DEFAULT_PER_PAGE;

    const query = new URLSearchParams({
      vs_currency: vsCurrency,
      page: String(page),
      per_page: String(perPage),
      // Without this, only 24h change is present on the response.
      price_change_percentage: "7d,30d",
    });
    if (params.ids && params.ids.length > 0) {
      query.set("ids", params.ids.join(","));
    }

    const raw = await this.getJson(`/coins/markets?${query.toString()}`, coinMarketsListSchema);
    const items = raw.map(mapCoinMarketItem);

    return {
      items,
      page,
      perPage,
      // Heuristic, not a confirmed signal — see SOURCE.md and
      // CoinGeckoMarketsPage's doc comment.
      hasNext: items.length === perPage,
    };
  }

  async getCoinDetails(coinId: string): Promise<NormalizedCoinMarketData> {
    const path = `/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    try {
      const raw = await this.getJson(path, coinDetailSchema);
      return mapCoinDetail(raw);
    } catch (error) {
      if (error instanceof ProviderHttpError && error.status === 404) {
        throw new CoinGeckoNotFoundError(error.url, error.body);
      }
      throw error;
    }
  }

  async getTrendingCoins(): Promise<NormalizedTrendingCoin[]> {
    const raw = await this.getJson("/search/trending", trendingResponseSchema);
    return raw.coins.map(mapTrendingCoinItem);
  }

  async search(query: string): Promise<NormalizedSearchResult[]> {
    const params = new URLSearchParams({ query });
    const raw = await this.getJson(`/search?${params.toString()}`, searchResponseSchema);
    return raw.coins.map(mapSearchCoinItem);
  }

  async getGlobalMarket(): Promise<NormalizedGlobalMarket> {
    const raw = await this.getJson("/global", globalResponseSchema);
    return mapGlobalResponse(raw);
  }
}
