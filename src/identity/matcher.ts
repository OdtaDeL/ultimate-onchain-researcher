// Pure matching logic — no I/O, no Supabase. Every function here takes
// already-fetched candidates and returns a result; resolver.ts owns
// fetching candidates and deciding what to do with the result. This
// mirrors the provider/ingestion split established elsewhere in this
// codebase (mapper.ts is pure, upsert-service.ts holds the DB client).

import { TIER_CONFIDENCE } from "./types";
import type {
  MatchTier,
  ProjectAlias,
  ProjectIdentityCandidate,
  ProviderIdentity,
  TierMatchResult,
} from "./types";

/** Case-insensitive, trims whitespace. Empty string normalizes to null (treated as "not provided"). */
function normalize(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

function matchUnique(
  tier: MatchTier,
  needle: string | null,
  candidateIds: string[],
): TierMatchResult {
  if (needle == null) return { kind: "none" };
  if (candidateIds.length === 0) return { kind: "none" };
  const distinct = Array.from(new Set(candidateIds));
  if (distinct.length > 1) {
    return { kind: "ambiguous", tier, projectIds: distinct };
  }
  return {
    kind: "unique",
    hit: { projectId: distinct[0], tier, confidence: TIER_CONFIDENCE[tier] },
  };
}

/**
 * Tier 1. Compared against `projects.metadata->>'contract_address'`
 * (best-effort — see types.ts ProjectIdentityCandidate doc comment).
 */
export function matchByContractAddress(
  identity: ProviderIdentity,
  candidates: ProjectIdentityCandidate[],
): TierMatchResult {
  const needle = normalize(identity.contractAddress);
  if (needle == null) return { kind: "none" };
  const ids = candidates
    .filter((c) => normalize(c.contractAddress) === needle)
    .map((c) => c.id);
  return matchUnique("contract_address", needle, ids);
}

/** Tier 3. Compared against `projects.slug`. */
export function matchBySlug(
  identity: ProviderIdentity,
  candidates: ProjectIdentityCandidate[],
): TierMatchResult {
  const needle = normalize(identity.slug);
  if (needle == null) return { kind: "none" };
  const ids = candidates.filter((c) => normalize(c.slug) === needle).map((c) => c.id);
  return matchUnique("slug", needle, ids);
}

/** Tier 4. Compared against `projects.ticker`. */
export function matchBySymbol(
  identity: ProviderIdentity,
  candidates: ProjectIdentityCandidate[],
): TierMatchResult {
  const needle = normalize(identity.symbol);
  if (needle == null) return { kind: "none" };
  const ids = candidates.filter((c) => normalize(c.ticker) === needle).map((c) => c.id);
  return matchUnique("symbol", needle, ids);
}

/** Tier 5. Compared against `projects.name`, exact match only (no fuzzy matching — see IDENTITY.md). */
export function matchByName(
  identity: ProviderIdentity,
  candidates: ProjectIdentityCandidate[],
): TierMatchResult {
  const needle = normalize(identity.name);
  if (needle == null) return { kind: "none" };
  const ids = candidates.filter((c) => normalize(c.name) === needle).map((c) => c.id);
  return matchUnique("name", needle, ids);
}

/**
 * Tiers 2 + 6 + 7 collapsed into one lookup — see IDENTITY.md "Why tiers
 * 2, 6, and 7 collapse into one lookup." Checks every identifying column
 * project_aliases has for this provider; the matched row's own stored
 * `confidence` is returned as-is (not recomputed), since it already
 * reflects whichever tier — including a manual override — created it.
 */
export function matchAgainstAliasTable(
  identity: ProviderIdentity,
  aliases: ProjectAlias[],
): TierMatchResult {
  const providerAliases = aliases.filter((a) => a.provider === identity.provider);

  const needles = {
    providerIdentifier: normalize(identity.providerId),
    providerSlug: normalize(identity.slug),
    providerSymbol: normalize(identity.symbol),
    providerName: normalize(identity.name),
    contractAddress: normalize(identity.contractAddress),
  };

  const hits = providerAliases.filter((a) => {
    return (
      (needles.providerIdentifier != null &&
        normalize(a.providerIdentifier) === needles.providerIdentifier) ||
      (needles.providerSlug != null && normalize(a.providerSlug) === needles.providerSlug) ||
      (needles.providerSymbol != null &&
        normalize(a.providerSymbol) === needles.providerSymbol) ||
      (needles.providerName != null && normalize(a.providerName) === needles.providerName) ||
      (needles.contractAddress != null &&
        normalize(a.contractAddress) === needles.contractAddress)
    );
  });

  if (hits.length === 0) return { kind: "none" };

  const distinctProjectIds = Array.from(new Set(hits.map((h) => h.projectId)));
  if (distinctProjectIds.length > 1) {
    return { kind: "ambiguous", tier: "alias_table", projectIds: distinctProjectIds };
  }

  // Multiple alias rows can agree on the same project_id (e.g. both the
  // old and new slug after a rename) — reuse the highest-confidence row
  // among them rather than an arbitrary one.
  const best = hits.reduce((a, b) => (b.confidence > a.confidence ? b : a));
  return {
    kind: "unique",
    hit: { projectId: best.projectId, tier: "alias_table", confidence: best.confidence },
  };
}
