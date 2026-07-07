// Signal — the canonical unit of truth for the scoring engine. Everything
// above this layer (Pillar, Overall Score) is a deterministic derivation
// FROM signals, recomputed every run — never itself canonical, never read
// back as an input. See DEVELOPER_GUIDE.md-equivalent note at the top of
// score-engine.ts for the full Provider -> Signal -> Pillar -> Overall
// hierarchy this folder is built around.
//
// Pure types only — no I/O, no Supabase/provider import, matching every
// other file in this folder. The only impure implementation of
// SignalSource lives in src/scoring-sync/signal-source.ts.

/**
 * The full known taxonomy of signals, including ones with no calculator
 * yet — those simply always resolve to state "not_implemented" (see
 * SignalState below), which requires a real key to attach that state to
 * (Team/Community/Market Maker are represented as not_implemented Signal
 * objects, not just absent ones — this is what lets a debug/audit view
 * enumerate "everything this platform could research," not just
 * "everything it currently measures").
 *
 * Adding a genuinely new signal (e.g. a future "github_activity" under
 * Team) means adding one member here — a small, compile-time-checked
 * change, distinct from restructuring pillars or aggregation logic.
 */
export type SignalKey =
  | "funding" // vc_market_makers
  | "investor" // vc_market_makers
  | "market_maker" // vc_market_makers — always not_implemented today
  | "market" // business_model
  | "tvl" // business_model
  | "revenue" // business_model
  | "unlock" // tokenomics
  | "momentum" // chart
  | "team" // team — always not_implemented today
  | "community"; // community — always not_implemented today

/**
 * - present: real value exists.
 * - missing: a provider/calculator exists for this signal, but this
 *   project has no value for it yet (e.g. TVL is a DeFi-relevant metric
 *   we track, but this project hasn't been matched/crawled for it).
 * - not_applicable: this signal doesn't meaningfully apply to this
 *   project's business model (e.g. TVL for an AI/Wallet/NFT-marketplace
 *   project). Category-gated — see signal-source.ts for why this isn't
 *   wired to real category data yet.
 * - not_implemented: no provider/calculator exists for this signal
 *   ANYWHERE in the codebase yet (Team, Community, Market Maker today).
 *   A product-capability state, not a data-availability state — never
 *   conflate with "missing."
 * - provider_error: the provider failed/timed out/returned invalid data.
 *   An OPERATIONAL state, not a data state. Transient by definition — see
 *   signal-source.ts for why the current adapter never actually emits
 *   this (reserved for a future live-calling adapter).
 *
 * For scoring MATH, missing/not_applicable/not_implemented/provider_error
 * are all identical: excluded. They must stay separately labeled in every
 * other surface (API, dashboard, debug/admin pages, AI explanations) —
 * never collapse them into a bare `null`. See adaptive-weighted-average.ts
 * for how a pillar composer decides which excluded signals still count
 * toward completeness (missing/provider_error do; not_applicable/
 * not_implemented don't, since they were never a real gap).
 */
export type SignalState = "present" | "missing" | "not_applicable" | "not_implemented" | "provider_error";

export interface SignalMetadata {
  /** e.g. "chainbroker", "coingecko", "coinpaprika", "defillama", "dexscreener". Null unless state === "present". */
  providerId: string | null;
  /** Display name for the provider above. */
  providerName: string | null;
  /** ISO timestamp of the underlying data this signal's value was computed from — drives freshness. Null unless state === "present". */
  asOfDate: string | null;
  /** This provider's rank in the ingestion priority order for this signal, if relevant (see src/ingestion/metrics/syncMetrics.ts's provider ordering). Informational only. */
  sourcePriority: number | null;
  /** Reserved for future schema/calculator versioning. Informational only. */
  version: string | null;
}

export interface Signal {
  key: SignalKey;
  state: SignalState;
  /**
   * The real-world value this signal is about (e.g. market cap in USD,
   * next-unlock percent-of-supply) — kept so UI/AI-explanations/
   * debugging/audit never need to re-derive it from raw DB rows, and so
   * re-tuning a scoring curve later never loses the underlying fact.
   * NEVER read by scoring math (adaptiveWeightedAverage only ever reads
   * normalizedScore).
   */
  rawValue: unknown | null;
  /** 0-100, produced by this signal's own scoring curve from rawValue. Null unless state === "present". The ONLY field scoring math reads. */
  normalizedScore: number | null;
  /** Debugging/explainability only — NEVER read by scoring math. */
  metadata: SignalMetadata;
}

/**
 * The ONLY boundary between the pure engine (this folder) and storage.
 * Implemented today by src/scoring-sync/signal-source.ts, deriving
 * Provider+Signal from project_metrics/funding_rounds/token_unlock_events/
 * project_aliases (a documented approximation — those tables don't track
 * per-field provenance today). A future project_signals table, a
 * materialized view, or a cached API response would satisfy this exact
 * same interface with a new adapter — src/scoring/ never changes when the
 * adapter does.
 */
export interface SignalSource {
  getSignal(projectId: string, signalKey: SignalKey): Signal;
}

const NO_METADATA: SignalMetadata = {
  providerId: null,
  providerName: null,
  asOfDate: null,
  sourcePriority: null,
  version: null,
};

/** Convenience constructor for a signal in a state where value/metadata are always empty (missing, not_applicable, not_implemented, provider_error). */
export function emptySignal(key: SignalKey, state: Exclude<SignalState, "present">): Signal {
  return { key, state, rawValue: null, normalizedScore: null, metadata: NO_METADATA };
}
