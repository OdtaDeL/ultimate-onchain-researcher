// Orchestrates identity resolution -> normalize -> upsert for one batch
// of provider drafts. Generic over the column shape so the exact same
// code path runs for CoinGecko and DefiLlama — there is no per-provider
// branching here, which is the literal mechanism behind "provider-
// independent" and "do not duplicate matching logic": this file calls
// src/identity/identity-service.ts exclusively for matching and never
// compares a slug/symbol/name itself.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import {
  loadResolutionContext,
  resolveProjectIdentityWithContext,
} from "../../identity/identity-service";
import type { ResolutionContext, ResolutionResult } from "../../identity/identity-service";
import { normalizeResolvedMetricsDrafts } from "./normalize";
import { MetricsUpsertService } from "./upsert-service";
import type {
  MetricsColumns,
  MetricsDraft,
  ResolutionBreakdown,
  ResolvedMetricsDraft,
} from "./types";

export interface MetricsIngestionResult {
  totalProviderRecords: number;
  matchedProjects: number;
  unmatchedProjects: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
  resolutionBreakdown: ResolutionBreakdown;
}

function emptyBreakdown(): ResolutionBreakdown {
  return {
    contractMatches: 0,
    providerIdMatches: 0,
    slugMatches: 0,
    symbolMatches: 0,
    nameMatches: 0,
    manualOverrideMatches: 0,
    aliasTableMatches: 0,
  };
}

/**
 * Maps a ResolutionResult onto one of the 7 report buckets — see
 * types.ts's ResolutionBreakdown doc comment for why a cached
 * confidence-100 alias-table hit is counted as a manual override rather
 * than a contract-address match (the two are indistinguishable once
 * cached, and no current provider populates contract addresses, making
 * manual_override the far more likely real-world source today).
 */
function classifyResolutionTier(result: ResolutionResult): keyof ResolutionBreakdown {
  if (result.tier === "contract_address") return "contractMatches";
  if (result.tier === "provider_id") return "providerIdMatches";
  if (result.tier === "slug") return "slugMatches";
  if (result.tier === "symbol") return "symbolMatches";
  if (result.tier === "name") return "nameMatches";
  if (result.tier === "manual_override") return "manualOverrideMatches";

  // result.tier === "alias_table" — reclassify by the row's stored
  // confidence, which reflects whichever tier actually created it.
  switch (result.confidence) {
    case 100:
      return "manualOverrideMatches";
    case 95:
      return "providerIdMatches";
    case 90:
      return "slugMatches";
    case 75:
      return "symbolMatches";
    case 60:
      return "nameMatches";
    default:
      return "aliasTableMatches";
  }
}

/**
 * Counts how many times each symbol/name (case-insensitive) appears across
 * this batch's identities. Ticker collisions are the rule in crypto, not
 * the exception — confirmed live 2026-07-06: DexScreener returned 24
 * *different, unrelated* tokens all sharing the exact symbol "HYPER"
 * (Bitcoin Hyper, Hyperpigmentation, Hyper Ape AI, the real Hyperlane,
 * ...). If a provider's own batch contains 2+ records sharing a
 * symbol/name, that string cannot safely identify a single real-world
 * asset — whichever one happens to resolve first would silently claim a
 * project, and a later one sharing the same string would then silently
 * overwrite it with a *different* coin's data, since the alias table
 * matches on (provider, symbol) alone. See `ingest`'s use of this below.
 */
function countBatchOccurrences<TColumns extends MetricsColumns>(
  drafts: MetricsDraft<TColumns>[],
): { symbolCounts: Map<string, number>; nameCounts: Map<string, number> } {
  const symbolCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  for (const draft of drafts) {
    if (draft.identity.symbol) {
      const key = draft.identity.symbol.toUpperCase();
      symbolCounts.set(key, (symbolCounts.get(key) ?? 0) + 1);
    }
    if (draft.identity.name) {
      const key = draft.identity.name.toUpperCase();
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    }
  }
  return { symbolCounts, nameCounts };
}

export class MetricsIngestionService {
  private readonly upsertService: MetricsUpsertService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.upsertService = new MetricsUpsertService(supabase);
  }

  /**
   * `fillNullsOnly` (default false): see MetricsUpsertService.upsertProviderMetrics's
   * doc comment. Pass `true` for gap-filling providers (CoinPaprika, DexScreener).
   */
  async ingest<TColumns extends MetricsColumns>(
    drafts: MetricsDraft<TColumns>[],
    fillNullsOnly = false,
  ): Promise<MetricsIngestionResult> {
    const breakdown = emptyBreakdown();
    const resolved: ResolvedMetricsDraft<TColumns>[] = [];
    let unmatchedProjects = 0;

    // Load project candidates and existing aliases once for the entire
    // batch — avoids O(n) full-table fetches that make large provider
    // syncs (DefiLlama: 7,000+ protocols; CoinGecko: 14,000+ coins)
    // impractically slow. context.aliases is mutated in-place by
    // resolveProjectIdentityWithContext as new aliases are written, so
    // subsequent items in this batch see them as alias-table hits.
    const provider = drafts[0]?.identity.provider;
    const context: ResolutionContext | null = provider
      ? await loadResolutionContext(this.supabase, provider)
      : null;

    const { symbolCounts, nameCounts } = countBatchOccurrences(drafts);

    for (const draft of drafts) {
      // Strip any symbol/name this batch can't vouch for as unique (see
      // countBatchOccurrences) — resolution falls through to a safer tier
      // (or unresolved) instead of trusting an ambiguous ticker/name.
      const identity = { ...draft.identity };
      if (identity.symbol && (symbolCounts.get(identity.symbol.toUpperCase()) ?? 0) > 1) {
        identity.symbol = null;
      }
      if (identity.name && (nameCounts.get(identity.name.toUpperCase()) ?? 0) > 1) {
        identity.name = null;
      }

      const result = context
        ? await resolveProjectIdentityWithContext(this.supabase, identity, context)
        : { status: "unresolved" as const, projectId: null, tier: null, confidence: null };

      if (result.status !== "resolved" || result.projectId === null) {
        unmatchedProjects += 1;
        continue;
      }

      breakdown[classifyResolutionTier(result)] += 1;
      resolved.push({ ...draft, projectId: result.projectId });
    }

    const deduped = normalizeResolvedMetricsDrafts(resolved);

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    for (const draft of deduped) {
      try {
        const outcome = await this.upsertService.upsertProviderMetrics(draft.projectId, draft.columns, fillNullsOnly);
        if (outcome === "inserted") inserted += 1;
        else if (outcome === "updated") updated += 1;
        else unchanged += 1;
      } catch {
        // Upsert failures are reported in the sync report's `failed`
        // count, not thrown — one bad row must not abort the batch, same
        // resilience policy as src/sync/chainbroker/paged-sync.ts.
        failed += 1;
      }
    }

    return {
      totalProviderRecords: drafts.length,
      matchedProjects: resolved.length,
      unmatchedProjects,
      inserted,
      updated,
      unchanged,
      failed,
      resolutionBreakdown: breakdown,
    };
  }
}
