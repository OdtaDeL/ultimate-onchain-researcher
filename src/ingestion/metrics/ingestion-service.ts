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

    for (const draft of drafts) {
      const result = context
        ? await resolveProjectIdentityWithContext(this.supabase, draft.identity, context)
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
