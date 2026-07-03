// HTTP client for ChainBroker's unofficial JSON API. See SOURCE.md for the
// endpoint inventory and response samples this is built against.
//
// Implements 7 of the 8 methods on `ChainBrokerProvider` (provider.ts) —
// `listProjectSlugs` is intentionally out of scope for this pass. No
// database writes, no Supabase integration, no UI: this module only
// fetches and normalizes data from ChainBroker.
//
// Networking (timeout, retry/backoff, rate limiting, fetch, JSON parsing,
// schema validation) lives in src/providers/base/http-client.ts — this
// class only defines endpoints, request paths, and Raw->Normalized
// mapping, per DEVELOPER_GUIDE.md "Adding a New Provider."

import { BaseHttpClient, mergeProviderConfig } from "../base";
import {
  parseAbbreviatedNumber,
  parseDisplayDate,
  parseIsoDate,
  parseTokenAmountString,
} from "./parse";
import type { ChainBrokerProviderConfig, PaginatedResult } from "./provider";
import {
  fundraisesListEnvelopeSchema,
  fundsSimpleListEnvelopeSchema,
  projectBackersEnvelopeSchema,
  projectFundraisesEnvelopeSchema,
  projectUnlocksEnvelopeSchema,
  projectsListEnvelopeSchema,
  unlocksListEnvelopeSchema,
} from "./schemas";
import type {
  NormalizedFund,
  NormalizedFundingRound,
  NormalizedInvestor,
  NormalizedProjectRef,
  NormalizedUnlockEvent,
  RawBacker,
  RawFundraise,
  RawGlobalFundraiseListItem,
  RawProjectListItem,
  RawProjectUnlockEvent,
  RawUnlockListItem,
} from "./types";

export const DEFAULT_CHAINBROKER_CONFIG: ChainBrokerProviderConfig = {
  baseUrl: "https://api.chainbroker.io/api/v1",
  userAgent: "smart-money-discovery-platform/1.0 (+data ingestion)",
  timeoutMs: 10_000,
  maxRequestsPerSecond: 2,
  retry: {
    maxAttempts: 4,
    baseDelayMs: 500,
    // 429/403: possible rate-limit or Cloudflare soft-block. 5xx: transient
    // upstream failure. See SOURCE.md — no documented limits, so this list
    // is a conservative default, not a confirmed contract.
    retryOnStatusCodes: [403, 429, 500, 502, 503, 504],
  },
};

export class ChainBrokerClient extends BaseHttpClient {
  constructor(config: Partial<ChainBrokerProviderConfig> = {}) {
    super("ChainBroker", mergeProviderConfig(DEFAULT_CHAINBROKER_CONFIG, config));
  }

  // -------------------------------------------------------------------
  // Public API — the 7 requested capabilities
  // -------------------------------------------------------------------

  async listRecentFundingRounds(
    page = 1,
  ): Promise<PaginatedResult<NormalizedFundingRound>> {
    const envelope = await this.getJson(
      `/fundraises/list/?page=${page}`,
      fundraisesListEnvelopeSchema,
    );
    const { list } = envelope.data;
    return {
      items: list.results.map(normalizeGlobalFundraiseItem),
      page: list.page_number,
      totalPages: list.total_pages,
      totalCount: list.count,
      hasNext: list.next !== null,
    };
  }

  async listUpcomingUnlocks(
    page = 1,
  ): Promise<PaginatedResult<NormalizedUnlockEvent>> {
    const envelope = await this.getJson(
      `/unlocks/list/?page=${page}`,
      unlocksListEnvelopeSchema,
    );
    const { list } = envelope.data;
    return {
      items: list.results.map(normalizeGlobalUnlockItem),
      page: list.page_number,
      totalPages: list.total_pages,
      totalCount: list.count,
      hasNext: list.next !== null,
    };
  }

  async listProjects(page = 1): Promise<PaginatedResult<NormalizedProjectRef>> {
    const envelope = await this.getJson(
      `/projects/list/?page=${page}`,
      projectsListEnvelopeSchema,
    );
    const { list } = envelope.data;
    return {
      items: list.results.map(normalizeProjectListItem),
      page: list.page_number,
      totalPages: list.total_pages,
      totalCount: list.count,
      hasNext: list.next !== null,
    };
  }

  async getProjectFundingRounds(
    projectSlug: string,
  ): Promise<NormalizedFundingRound[]> {
    const envelope = await this.getJson(
      `/projects/fundraises/${encodeURIComponent(projectSlug)}/`,
      projectFundraisesEnvelopeSchema,
    );
    return envelope.data.map((raw) => normalizeFundraise(raw, projectSlug));
  }

  async getProjectInvestors(projectSlug: string): Promise<NormalizedInvestor[]> {
    const envelope = await this.getJson(
      `/projects/backers/${encodeURIComponent(projectSlug)}/`,
      projectBackersEnvelopeSchema,
    );
    return envelope.data.backers.map(normalizeBacker);
  }

  async getProjectUnlocks(
    projectSlug: string,
    scope: "past" | "upcoming",
  ): Promise<NormalizedUnlockEvent[]> {
    const past = scope === "past" ? "true" : "false";
    const envelope = await this.getJson(
      `/projects/unlocks/${encodeURIComponent(projectSlug)}/?past=${past}`,
      projectUnlocksEnvelopeSchema,
    );
    if (envelope.data === null) return [];
    return envelope.data.results.map((raw) =>
      normalizeProjectUnlockEvent(raw, projectSlug),
    );
  }

  async listFunds(): Promise<NormalizedFund[]> {
    const envelope = await this.getJson(
      "/funds/simple-list/",
      fundsSimpleListEnvelopeSchema,
    );
    return envelope.data.map((raw) => ({
      name: raw.name,
      slug: raw.slug,
      logoUrl: null,
    }));
  }

}

// ---------------------------------------------------------------------
// Normalization: Raw* (API shapes) -> Normalized* (Supabase-aligned)
// ---------------------------------------------------------------------

function normalizeBacker(raw: RawBacker): NormalizedInvestor {
  return {
    name: raw.name,
    slug: raw.slug,
    logoUrl: raw.logo ?? null,
    roiPercent: raw.current_roi?.percent ?? null,
    roiMultiple: raw.current_roi?.x ?? null,
    investmentCount: raw.investment_count ?? null,
  };
}

function normalizeFundraise(
  raw: RawFundraise,
  projectSlug: string,
): NormalizedFundingRound {
  return {
    projectSlug,
    roundType: raw.name,
    amountRaisedUsd: parseAbbreviatedNumber(raw.raise_amount),
    announcedDate: parseIsoDate(raw.announce_date),
    fdvUsd: parseAbbreviatedNumber(raw.valuation),
    sourceUrl: raw.source,
    investors: raw.backers.map(normalizeBacker),
    leadInvestors: raw.lead_backers.map(normalizeBacker),
  };
}

function normalizeGlobalFundraiseItem(
  raw: RawGlobalFundraiseListItem,
): NormalizedFundingRound {
  return {
    projectSlug: raw.slug,
    // Global feed carries no round-stage info either — see RawFundraise.
    roundType: null,
    amountRaisedUsd: parseAbbreviatedNumber(raw.raise_amount),
    announcedDate: parseIsoDate(raw.raise_date),
    fdvUsd: null,
    sourceUrl: null,
    investors: raw.funds.map((fund) => ({
      name: fund.name,
      slug: fund.slug,
      logoUrl: fund.logo,
      roiPercent: null,
      roiMultiple: null,
      investmentCount: null,
    })),
    leadInvestors: [],
  };
}

function normalizeGlobalUnlockItem(raw: RawUnlockListItem): NormalizedUnlockEvent {
  return {
    projectSlug: raw.slug,
    unlockDate: parseDisplayDate(raw.next_unlock),
    amountTokens: parseTokenAmountString(raw.unlock_amount),
    amountUsd: parseAbbreviatedNumber(raw.unlock_value),
    // `circulation` is cumulative % of total supply already circulating —
    // NOT the % being released by this specific unlock event (that field
    // doesn't exist in this endpoint; it does on the per-project endpoint
    // as `percent`, see normalizeProjectUnlockEvent). Left null rather
    // than mislabeling a different metric as percentOfSupply.
    percentOfSupply: null,
    roundName: raw.round_name,
  };
}

function normalizeProjectUnlockEvent(
  raw: RawProjectUnlockEvent,
  projectSlug: string,
): NormalizedUnlockEvent {
  return {
    projectSlug,
    unlockDate: parseIsoDate(raw.start_date),
    amountTokens: parseTokenAmountString(raw.tokens),
    amountUsd: parseAbbreviatedNumber(raw.token_value),
    percentOfSupply: raw.percent,
    roundName: raw.tokenomics_round,
  };
}

function normalizeProjectListItem(raw: RawProjectListItem): NormalizedProjectRef {
  return {
    slug: raw.slug,
    name: raw.name,
    ticker: raw.ticker ?? null,
    logoUrl: raw.logo ?? null,
  };
}
