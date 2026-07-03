// DB-aware orchestration layer — the only file in src/identity/ that
// holds a SupabaseClient, mirroring the provider/ingestion split
// elsewhere in this codebase (matcher.ts is pure, this is not). Fetches
// candidates, runs them through matcher.ts in priority order, and
// persists newly-discovered mappings back to project_aliases.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import {
  matchAgainstAliasTable,
  matchByContractAddress,
  matchByName,
  matchBySlug,
  matchBySymbol,
} from "./matcher";
import { IdentityConflictError } from "./types";
import type {
  MatchHit,
  MatchTier,
  ProjectAlias,
  ProjectIdentityCandidate,
  ProviderIdentity,
  ResolutionResult,
  TierMatchResult,
} from "./types";

type AliasRow = Database["public"]["Tables"]["project_aliases"]["Row"];

// Postgrest errors are plain objects with a `.message`, not `Error`
// instances — `String(error)` on them gives "[object Object]" (same
// issue documented in src/sync/sync-metadata.ts; duplicated here rather
// than imported, since src/identity/ has no dependency on src/sync/ —
// see IDENTITY.md "Layering").
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

const UNIQUE_VIOLATION = "23505";

function rowToAlias(row: AliasRow): ProjectAlias {
  return {
    id: row.id,
    projectId: row.project_id,
    provider: row.provider,
    providerIdentifier: row.provider_identifier,
    providerSlug: row.provider_slug,
    providerSymbol: row.provider_symbol,
    providerName: row.provider_name,
    contractAddress: row.contract_address,
    confidence: row.confidence,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchAliasesForProvider(
  supabase: SupabaseClient<Database>,
  provider: string,
): Promise<ProjectAlias[]> {
  const { data, error } = await supabase
    .from("project_aliases")
    .select("*")
    .eq("provider", provider);
  if (error) {
    throw new IdentityConflictError(
      `Failed to fetch existing aliases for provider "${provider}": ${describeError(error)}`,
      provider,
      error,
    );
  }
  return (data ?? []).map(rowToAlias);
}

/**
 * Fetches the full `projects` table for in-memory tier matching. Simple
 * and transparent at the current scale (low thousands of rows from the
 * ChainBroker bootstrap) — see IDENTITY.md "Known limitation: full-table
 * fetch" for why this isn't per-tier targeted queries, and when to revisit.
 */
async function fetchProjectCandidates(
  supabase: SupabaseClient<Database>,
): Promise<ProjectIdentityCandidate[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, ticker, metadata");
  if (error) {
    throw new IdentityConflictError(
      `Failed to fetch projects for identity matching: ${describeError(error)}`,
      "*",
      error,
    );
  }
  return (data ?? []).map((p) => {
    const metadata = p.metadata;
    const contractAddress =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata) &&
      typeof (metadata as Record<string, unknown>).contract_address === "string"
        ? ((metadata as Record<string, unknown>).contract_address as string)
        : null;
    return { id: p.id, slug: p.slug, name: p.name, ticker: p.ticker, contractAddress };
  });
}

function resolvedResult(hit: MatchHit): ResolutionResult {
  return { status: "resolved", projectId: hit.projectId, tier: hit.tier, confidence: hit.confidence };
}

function ambiguousResult(result: { tier: MatchTier; projectIds: string[] }): ResolutionResult {
  return {
    status: "ambiguous",
    projectId: null,
    tier: result.tier,
    confidence: null,
    conflictingProjectIds: result.projectIds,
  };
}

/**
 * Writes (or rewrites) the primary alias for (projectId, identity.provider).
 * If a different primary row already exists for this pair, it is demoted
 * (is_primary = false) first — see IDENTITY.md "Renamed protocols." Used
 * by both automated tier-3/4/5 discovery and manual overrides
 * (identity-service.ts) — the only difference between them is which tier/
 * confidence the caller passes in.
 */
export async function writeAlias(
  supabase: SupabaseClient<Database>,
  projectId: string,
  identity: ProviderIdentity,
  tier: MatchTier,
  confidence: number,
): Promise<ProjectAlias> {
  const { data: existingPrimary, error: lookupError } = await supabase
    .from("project_aliases")
    .select("*")
    .eq("project_id", projectId)
    .eq("provider", identity.provider)
    .eq("is_primary", true)
    .maybeSingle();

  if (lookupError) {
    throw new IdentityConflictError(
      `Failed to check existing primary alias for provider "${identity.provider}": ${describeError(lookupError)}`,
      identity.provider,
      lookupError,
    );
  }

  if (existingPrimary) {
    const { error: demoteError } = await supabase
      .from("project_aliases")
      .update({ is_primary: false })
      .eq("id", existingPrimary.id);
    if (demoteError) {
      throw new IdentityConflictError(
        `Failed to demote previous primary alias (id=${existingPrimary.id}) while registering a new one for provider "${identity.provider}": ${describeError(demoteError)}`,
        identity.provider,
        demoteError,
      );
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("project_aliases")
    .insert({
      project_id: projectId,
      provider: identity.provider,
      provider_identifier: identity.providerId ?? null,
      provider_slug: identity.slug ?? null,
      provider_symbol: identity.symbol ?? null,
      provider_name: identity.name ?? null,
      contract_address: identity.contractAddress ?? null,
      confidence,
      is_primary: true,
    })
    .select("*")
    .single();

  if (insertError) {
    const isDuplicate = (insertError as { code?: string }).code === UNIQUE_VIOLATION;
    throw new IdentityConflictError(
      isDuplicate
        ? `Identifier already claimed by a different project for provider "${identity.provider}" (tier "${tier}"): ${describeError(insertError)}`
        : `Failed to register alias for provider "${identity.provider}" (tier "${tier}"): ${describeError(insertError)}`,
      identity.provider,
      insertError,
    );
  }

  return rowToAlias(inserted);
}

/** Pre-loaded data for a batch of identity resolutions — load once, reuse per-item. */
export interface ResolutionContext {
  aliases: ProjectAlias[];
  candidates: ProjectIdentityCandidate[];
}

/**
 * Loads the two datasets that identity resolution needs — all aliases for
 * the given provider, and all project candidates — in a single parallel
 * round-trip. Pass the result to `resolveProjectIdWithContext` for every
 * item in the batch so the DB isn't hit O(n) times.
 */
export async function loadResolutionContext(
  supabase: SupabaseClient<Database>,
  provider: string,
): Promise<ResolutionContext> {
  const [aliases, candidates] = await Promise.all([
    fetchAliasesForProvider(supabase, provider),
    fetchProjectCandidates(supabase),
  ]);
  return { aliases, candidates };
}

/**
 * Resolves identity using pre-loaded context. Identical logic to
 * `resolveProjectId` but skips the DB fetches — callers that process many
 * items from the same provider should call `loadResolutionContext` once and
 * pass it here, reducing O(n) DB round-trips to O(1).
 *
 * When a new alias is written (tier 3-5 match), `context.aliases` is
 * mutated in place so subsequent items in the same batch see it as already
 * resolved via the alias table (idempotent on re-run; prevents double-write).
 */
export async function resolveProjectIdWithContext(
  supabase: SupabaseClient<Database>,
  identity: ProviderIdentity,
  context: ResolutionContext,
): Promise<ResolutionResult> {
  const { aliases, candidates } = context;

  const aliasResult = matchAgainstAliasTable(identity, aliases);
  if (aliasResult.kind === "ambiguous") return ambiguousResult(aliasResult);
  if (aliasResult.kind === "unique") return resolvedResult(aliasResult.hit);

  const directTiers: ((
    i: ProviderIdentity,
    c: ProjectIdentityCandidate[],
  ) => TierMatchResult)[] = [matchByContractAddress, matchBySlug, matchBySymbol, matchByName];

  for (const matchTier of directTiers) {
    const result = matchTier(identity, candidates);
    if (result.kind === "ambiguous") return ambiguousResult(result);
    if (result.kind === "unique") {
      const alias = await writeAlias(supabase, result.hit.projectId, identity, result.hit.tier, result.hit.confidence);
      context.aliases.push(alias);
      return resolvedResult(result.hit);
    }
  }

  return { status: "unresolved", projectId: null, tier: null, confidence: null };
}

/**
 * Resolves a provider's raw identity to an internal project id.
 *
 * Order: alias table first (covers tiers 2/6/7 in one lookup — see
 * IDENTITY.md), then contract address, slug, symbol, name against
 * `projects` directly, stopping at the first tier with a unique hit. A
 * tier with 2+ candidates stops resolution immediately as "ambiguous"
 * rather than falling through to a lower-confidence tier and guessing.
 *
 * For batch use (many items from the same provider), prefer
 * `loadResolutionContext` + `resolveProjectIdWithContext` to avoid O(n)
 * DB fetches.
 */
export async function resolveProjectId(
  supabase: SupabaseClient<Database>,
  identity: ProviderIdentity,
): Promise<ResolutionResult> {
  const context = await loadResolutionContext(supabase, identity.provider);
  return resolveProjectIdWithContext(supabase, identity, context);
}
