// Provider contract for ChainBroker. INTERFACE ONLY — no HTTP client, no
// Playwright, no implementation. See SOURCE.md for the API contract this
// is designed against, and the note at the bottom for the Playwright
// contingency mentioned in the brief.
//
// Why an interface at all, given a JSON API was found: the API is
// unofficial (see SOURCE.md "Stability posture"). Coding the rest of the
// platform against this interface — rather than against
// `fetch("https://api.chainbroker.io/...")` calls scattered around —
// means a future Playwright-based implementation can be swapped in
// without touching any caller.

import type {
  NormalizedFund,
  NormalizedFundingRound,
  NormalizedInvestor,
  NormalizedProjectRef,
  NormalizedUnlockEvent,
} from "./types";
import type { BaseProviderConfig } from "../base/config";
import type { PaginatedResult } from "../base/provider";

export type { PaginatedResult };

// Identical shape to BaseProviderConfig today — kept as its own named type
// so ChainBroker-specific fields could be added here later without
// touching src/providers/base/. See SYSTEM_ARCHITECTURE.md "Future
// Providers."
export type ChainBrokerProviderConfig = BaseProviderConfig;

/**
 * Read-only access to ChainBroker's project/fund/funding/unlock data.
 * Implementations: a direct JSON-API client (primary, since SOURCE.md
 * confirms the endpoints work unauthenticated) or a Playwright-driven
 * browser-automation client (fallback — see bottom of file).
 */
export interface ChainBrokerProvider {
  /** Bulk project discovery, for seeding/reconciling the local `projects` table. */
  listProjects(page?: number): Promise<PaginatedResult<NormalizedProjectRef>>;

  /** Lightweight slug+name directory — cheaper than listProjects for existence checks. */
  listProjectSlugs(): Promise<NormalizedProjectRef[]>;

  /** Funding rounds for a single project, by slug (maps to `funding_rounds` + `funding_investors`). */
  getProjectFundingRounds(projectSlug: string): Promise<NormalizedFundingRound[]>;

  /** Investors/backers for a single project, by slug (maps to `funds`). */
  getProjectInvestors(projectSlug: string): Promise<NormalizedInvestor[]>;

  /** Unlock events for a single project. `scope` controls past vs. upcoming. */
  getProjectUnlocks(
    projectSlug: string,
    scope: "past" | "upcoming",
  ): Promise<NormalizedUnlockEvent[]>;

  /** Global funding-round feed, for "New Funded Projects" without per-project fan-out. */
  listRecentFundingRounds(page?: number): Promise<PaginatedResult<NormalizedFundingRound>>;

  /** Global unlock feed, for "Unlock Alerts" without per-project fan-out. */
  listUpcomingUnlocks(page?: number): Promise<PaginatedResult<NormalizedUnlockEvent>>;

  /** Full fund directory (maps to `funds`). */
  listFunds(): Promise<NormalizedFund[]>;
}

// ---------------------------------------------------------------------
// Playwright contingency (not implemented — design note only)
// ---------------------------------------------------------------------
//
// If api.chainbroker.io starts rejecting non-browser traffic (Cloudflare
// bot management is the obvious trigger, since no rate-limit headers are
// exposed today), a second implementation of `ChainBrokerProvider` would:
//
//   1. Launch a persistent Playwright browser context with a realistic
//      UA/viewport, navigating to the rendered chainbroker.io pages
//      (/projects/{slug}/, /fundraises/list/, /fundraises/token-unlocks/)
//      instead of calling the API directly.
//   2. Intercept the page's own XHR/fetch calls to api.chainbroker.io via
//      `page.route()`/`page.on('response')` and parse the same JSON
//      payloads documented in SOURCE.md — reusing 100% of the
//      normalization logic, since the response shape is identical.
//   3. Fall back to DOM scraping (reading rendered card values) only if
//      step 2 is also blocked — last resort, brittle against markup
//      changes, and the only path that needs new parsing code instead of
//      reusing the normalizer.
//   4. Respect a much lower concurrency (1 browser context, serialized
//      navigation) since a real browser session is expensive and easier
//      to get flagged if parallelized.
//
// Both implementations satisfy the same `ChainBrokerProvider` interface,
// so ingestion jobs and the rest of the platform never know which one is
// active.
