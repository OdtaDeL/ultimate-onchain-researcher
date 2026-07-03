// Draft types: the output of the mapping layer (mapper.ts) and input to
// the normalization layer (normalize.ts). They mirror the target Supabase
// columns but use natural keys (slug/name) instead of uuids, since FKs
// aren't known until the corresponding row has been upserted.
//
// One real schema gap remains, surfaced while designing these mappings —
// data the ChainBroker client provides but the current Supabase schema
// has no column for:
//
//   1. `funding_investors` has no `is_lead` column, so ChainBroker's
//      lead_backers vs. backers distinction is collapsed into one
//      undifferentiated investor list before upsert. Surfaced for
//      visibility — fixing it means a schema migration, out of scope
//      for "ingestion service only."
//
// (A second gap — `funds` having no `slug` column — was fixed by
// supabase/migrations/010_funds_slug.sql. FundDraft.slug, ChainBroker's
// real provider-supplied fund slug, is now persisted directly by
// upsert-service.ts's upsertFunds instead of being discarded after use
// as an in-process dedup key.)

export interface ProjectDraft {
  slug: string;
  name: string;
  ticker: string | null;
  logoUrl: string | null;
}

export interface FundDraft {
  /** ChainBroker's identity for the fund — written directly to `funds.slug`. */
  slug: string;
  /** The actual `funds.name` upsert key. */
  name: string;
  logoUrl: string | null;
}

export interface FundingRoundDraft {
  projectSlug: string;
  // ChainBroker's per-project fundraise endpoint has no round-stage field
  // (see src/providers/chainbroker/types.ts RawFundraise) — this is
  // either the literal "Funding Round" or null from the global feed.
  roundType: string | null;
  amountRaisedUsd: number | null;
  announcedDate: string | null;
  fdvUsd: number | null;
  /** Fund slugs involved, lead and regular merged — see gap #2 above. */
  investorFundSlugs: string[];
}

export interface TokenUnlockEventDraft {
  projectSlug: string;
  unlockDate: string | null;
  /** Mapped from ChainBroker's `tokenomics_round`/`round_name` (an allocation bucket like "Ecosystem", not a vesting mechanism). */
  unlockType: string | null;
  amountTokens: number | null;
  amountUsd: number | null;
  percentOfSupply: number | null;
}

// ---------------------------------------------------------------------
// Ingestion run reports — returned by ingestion-service.ts methods so
// callers can log/alert without the service doing any logging itself.
// ---------------------------------------------------------------------

export interface ProjectFundingIngestionResult {
  projectSlug: string;
  fundingRoundsUpserted: number;
  investorsUpserted: number;
  fundingInvestorLinksUpserted: number;
  unlockEventsUpserted: number;
}

export interface ProjectDirectoryIngestionResult {
  page: number;
  totalPages: number;
  projectsUpserted: number;
}

export interface FundsIngestionResult {
  fundsUpserted: number;
}

export interface RecentFundingRoundsIngestionResult {
  page: number;
  totalPages: number;
  fundingRoundsUpserted: number;
  investorsUpserted: number;
  fundingInvestorLinksUpserted: number;
  /** Projects referenced by this feed page that don't exist locally yet — run ingestProjects first. */
  skippedUnknownProjectSlugs: string[];
}

export interface UpcomingUnlocksIngestionResult {
  page: number;
  totalPages: number;
  unlockEventsUpserted: number;
  skippedUnknownProjectSlugs: string[];
}
