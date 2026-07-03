// Public facade for the identity layer — this is the module every future
// ingestion pipeline (CoinGecko, DefiLlama, RootData, CryptoRank, Kaito)
// should import. matcher.ts and resolver.ts are implementation details;
// callers outside src/identity/ should not need to import them directly.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { writeAlias, resolveProjectId } from "./resolver";
import { TIER_CONFIDENCE } from "./types";
import type { ProjectAlias, ProviderIdentity, ResolutionResult } from "./types";

/**
 * Resolves a provider's raw identity (whatever subset of contract
 * address / provider id / slug / symbol / name it supplies) to an
 * internal project id. On a confident unique match against tiers 3-5,
 * automatically registers the mapping in project_aliases so the next
 * call for the same identity is an instant alias-table hit. Never
 * fabricates a match — returns `status: "unresolved"` or `"ambiguous"`
 * rather than guessing (see IDENTITY.md "Conflict Resolution").
 */
export async function resolveProjectIdentity(
  supabase: SupabaseClient<Database>,
  identity: ProviderIdentity,
): Promise<ResolutionResult> {
  return resolveProjectId(supabase, identity);
}

/**
 * Human-authored fix: always wins, regardless of what automated matching
 * would have produced, because resolveProjectIdentity checks the alias
 * table (where this row lives) before ever running tiers 3-5 — see
 * IDENTITY.md "Manual Overrides." No code change is required to apply
 * one; this function (or a direct SQL/admin-dashboard insert against
 * project_aliases) is the entire mechanism.
 */
export async function applyManualOverride(
  supabase: SupabaseClient<Database>,
  projectId: string,
  identity: ProviderIdentity,
  confidence: number = TIER_CONFIDENCE.manual_override,
): Promise<ProjectAlias> {
  return writeAlias(supabase, projectId, identity, "manual_override", confidence);
}

/**
 * Registers a known alias without running automated matching at all —
 * e.g. bulk-importing a curated "also known as" list, or onboarding a
 * provider before any automated tier can resolve it. Defaults to the
 * "alias_table" tier's confidence (40, the lowest tier) since, unlike
 * applyManualOverride, this isn't asserted by a human reviewing a
 * specific conflict — it's a declarative registration taken on faith
 * from whatever curated the list. Pass a higher `confidence` if the
 * caller has stronger grounds.
 */
export async function registerAlias(
  supabase: SupabaseClient<Database>,
  projectId: string,
  identity: ProviderIdentity,
  confidence: number = TIER_CONFIDENCE.alias_table,
): Promise<ProjectAlias> {
  return writeAlias(supabase, projectId, identity, "alias_table", confidence);
}

export { loadResolutionContext, resolveProjectIdWithContext as resolveProjectIdentityWithContext } from "./resolver";
export type { ResolutionContext } from "./resolver";
export type { ProviderIdentity, ResolutionResult, ProjectAlias } from "./types";
