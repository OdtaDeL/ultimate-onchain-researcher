// Shapes observed directly from https://api.chainbroker.io/api/v1 — see
// SOURCE.md for how each was discovered and a raw response sample.
// "Raw*" types mirror the API verbatim (including its display-string
// money/percent fields). "Normalized*" types are what the provider hands
// back to the rest of the platform, already mapped toward the Supabase
// schema (supabase/migrations/001_initial_schema.sql, 002, 003).

// ---------------------------------------------------------------------
// Raw API envelopes
// ---------------------------------------------------------------------

export interface RawEnvelope<T> {
  status: number;
  data: T;
  message?: string | null;
}

// Used by the global collection endpoints (fundraises/list/, unlocks/list/,
// projects/list/), where this object is nested under `data.list`.
export interface RawPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  page_number: number;
  results: T[];
}

// Used by per-project paginated endpoints (projects/unlocks/{slug}/), which
// returns a simpler DRF pagination shape directly under `data` — no
// total_pages/page_number.
export interface RawSimplePage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------
// Raw resource shapes
// ---------------------------------------------------------------------

export interface RawRoi {
  percent: number | null;
  x: number | null;
}

export interface RawBacker {
  name: string;
  slug: string;
  logo?: string | null;
  logo_alt?: string | null;
  logo_title?: string | null;
  current_roi?: RawRoi | null;
  investment_count?: number | null;
}

export interface RawFundraise {
  // Confirmed: always the literal "Funding Round" in sampled data. This
  // endpoint does not expose round-stage classification (seed/private/
  // series A) — there is no field for it.
  name: string;
  announce_date: string | null; // "YYYY-MM-DD"
  raise_amount: string | null; // display string, e.g. "$25M"
  valuation: string | null; // display string, e.g. "$1.4B"
  source: string | null; // citation URL
  backers: RawBacker[];
  lead_backers: RawBacker[];
}

export interface RawGlobalFundraiseListItem {
  slug: string;
  name: string;
  ticker: string | null;
  logo: string | null;
  raise_amount: string | null;
  raise_date: string | null;
  category: { name: string; slug: string }[];
  funds: { name: string; slug: string; logo: string | null }[];
}

export interface RawUnlockListItem {
  slug: string;
  name: string;
  ticker: string | null;
  next_unlock: string | null; // display date, e.g. "Jun 25, 2026"
  unlock_amount: string | null; // display string, e.g. "88.9M XPL"
  unlock_value: string | null; // display string, e.g. "$8.2M"
  round_name: string | null;
  circulation: string | null; // display percent, e.g. "26.0%"
  price_change_24h: string | null;
  price_change_7d: string | null;
  price_change_30d: string | null;
  price_change_1y: string | null;
  volume_24h: string | null;
  percent: string | null;
}

// Confirmed against GET /projects/unlocks/plasma/?past=false|true — past
// and future share this same item shape.
export interface RawProjectUnlockEvent {
  tokenomics_round: string | null;
  is_daily: boolean;
  start_date: string | null; // "YYYY-MM-DD"
  end_date: string | null;
  days: string | null; // e.g. "Vested", or a duration label
  percent: number | null; // percent of total supply unlocked in this event
  token_value: string | null; // display string, e.g. "7.64M" (USD)
  tokens: string | null; // display string, e.g. "88.9M" (token amount)
}

export interface RawSimpleListItem {
  name: string;
  slug: string;
}

// Confirmed against GET /projects/list/ — response carries far more
// fields (price/roi/market-cap display strings); only what the client
// consumes is typed here.
export interface RawProjectListItem {
  slug: string;
  name: string;
  ticker?: string | null;
  logo?: string | null;
}

// ---------------------------------------------------------------------
// Normalized domain types (provider output — aligned to Supabase schema)
// ---------------------------------------------------------------------

export interface NormalizedFund {
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface NormalizedInvestor extends NormalizedFund {
  roiPercent: number | null;
  roiMultiple: number | null;
  investmentCount: number | null;
}

export interface NormalizedFundingRound {
  projectSlug: string;
  // ChainBroker's per-project endpoint has no round-stage field (see
  // RawFundraise) — this is carried through as-is ("Funding Round") and
  // is not a substitute for a real seed/private/series-A classification.
  roundType: string | null;
  amountRaisedUsd: number | null;
  announcedDate: string | null; // ISO date
  fdvUsd: number | null;
  sourceUrl: string | null;
  investors: NormalizedInvestor[];
  leadInvestors: NormalizedInvestor[];
}

export interface NormalizedUnlockEvent {
  projectSlug: string;
  unlockDate: string | null; // ISO date
  amountTokens: number | null;
  amountUsd: number | null;
  percentOfSupply: number | null;
  roundName: string | null;
}

export interface NormalizedProjectRef {
  slug: string;
  name: string;
  ticker: string | null;
  logoUrl: string | null;
}
