// Provider-independent identity types. No Supabase import here — pure
// domain types only (matcher.ts depends on these and must stay testable
// without a database). Mirrors supabase/migrations/005_project_identity.sql.
// See IDENTITY.md for the full design rationale.

/**
 * Match tiers, in priority order, and the confidence assigned when a row
 * is first *created* by that tier. Once created, a project_aliases row's
 * stored `confidence` is reused on every later lookup — never recomputed
 * (see IDENTITY.md "Why tiers 2, 6, and 7 collapse into one lookup").
 *
 * "provider_id" has no equivalent column on `projects` (only the alias
 * table stores arbitrary provider IDs) — it can only ever be discovered
 * via `alias_table`, never via a fresh comparison. It keeps its own tier
 * name/confidence purely as a label for *why* a row was created, not as
 * a separate comparison path in matcher.ts.
 */
export type MatchTier =
  | "contract_address"
  | "provider_id"
  | "slug"
  | "symbol"
  | "name"
  | "alias_table"
  | "manual_override";

export const TIER_CONFIDENCE: Record<MatchTier, number> = {
  contract_address: 100,
  provider_id: 95,
  slug: 90,
  symbol: 75,
  name: 60,
  alias_table: 40,
  manual_override: 100,
};

/**
 * What a provider can supply to identify a project. All optional — field
 * coverage varies per provider (see DEVELOPER_GUIDE.md "Extension Guide");
 * a provider with only a slug and name is fully supported, just resolves
 * through fewer tiers.
 */
export interface ProviderIdentity {
  /** data_sources.slug, e.g. "coingecko" — must already be registered there. */
  provider: string;
  contractAddress?: string | null;
  providerId?: string | null;
  slug?: string | null;
  symbol?: string | null;
  name?: string | null;
}

/** A row of project_aliases, as read back from the database. */
export interface ProjectAlias {
  id: string;
  projectId: string;
  provider: string;
  providerIdentifier: string | null;
  providerSlug: string | null;
  providerSymbol: string | null;
  providerName: string | null;
  contractAddress: string | null;
  confidence: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Minimal `projects` row shape the matcher compares fresh identity
 * against — not the full row. `contractAddress` is best-effort: `projects`
 * has no dedicated column for it (see IDENTITY.md "Contract address tier"),
 * so resolver.ts reads it from `projects.metadata->>'contract_address'`
 * when present, which is rarely populated today.
 */
export interface ProjectIdentityCandidate {
  id: string;
  slug: string;
  name: string;
  ticker: string | null;
  contractAddress: string | null;
}

export interface MatchHit {
  projectId: string;
  tier: MatchTier;
  confidence: number;
}

/** Returned by each matcher.ts function for one tier's evaluation. */
export type TierMatchResult =
  | { kind: "none" }
  | { kind: "unique"; hit: MatchHit }
  | { kind: "ambiguous"; tier: MatchTier; projectIds: string[] };

export type ResolutionStatus = "resolved" | "ambiguous" | "unresolved";

export interface ResolutionResult {
  status: ResolutionStatus;
  projectId: string | null;
  tier: MatchTier | null;
  confidence: number | null;
  /** Populated only when status === "ambiguous" — see IDENTITY.md "Conflict Resolution." */
  conflictingProjectIds?: string[];
}

/** Thrown when a write would violate one of project_aliases' uniqueness invariants (see migration 005). */
export class IdentityConflictError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "IdentityConflictError";
  }
}
