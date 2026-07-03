// Shapes observed directly from https://api.llama.fi — see SOURCE.md for
// how each was discovered and a raw response sample. "Raw*" types mirror
// the API verbatim (only the fields this provider actually consumes —
// /protocol/{slug} in particular carries many megabytes of historical
// chart data that is deliberately left untyped, see SOURCE.md). "Normalized*"
// types are what this provider hands back to the rest of the platform.

// ---------------------------------------------------------------------
// Raw resource shapes
// ---------------------------------------------------------------------

/** GET /protocols — one item. */
export interface RawProtocolListItem {
  id: string;
  name: string;
  slug: string;
  /** DefiLlama's own aggregate label, e.g. "Multi-Chain" or "Ethereum". Absent on multi-chain aggregator protocols added after 2025-06 — treat as null. */
  chain?: string;
  chains: string[];
  tvl: number | null;
  change_1d: number | null;
  change_7d: number | null;
  /** Mixes real chain keys with `<Chain>-borrowed` pseudo-keys — filtered in mapper.ts. */
  chainTvls: Record<string, number>;
}

export interface RawTvlHistoryPoint {
  date: number;
  totalLiquidityUSD: number;
}

/**
 * GET /protocol/{slug} — only the fields this provider consumes are
 * typed. The real response also carries `chainTvls.<chain>.tvl/tokens/tokensInUsd`,
 * `totalDataChartBreakdown`, etc. — multi-megabyte historical series this
 * provider has no use for and deliberately does not declare (see
 * SOURCE.md "why this endpoint" for the validation-cost reasoning).
 */
export interface RawProtocolDetail {
  id: string;
  name: string;
  slug: string;
  chain?: string;
  chains: string[];
  /** Point-in-time per-chain TVL, same `-borrowed` quirk as RawProtocolListItem.chainTvls. */
  currentChainTvls: Record<string, number>;
  /** Historical aggregate TVL series — only the last entry's `date` is used, as a response timestamp. */
  tvl: RawTvlHistoryPoint[];
}

/** GET /protocol/{slug} error body, confirmed live: HTTP 400, plain text, e.g. "Protocol not found". */
export type RawDefiLlamaErrorBody = string;

/** [unix seconds, value] */
export type RawFeesChartPoint = [number, number];

/**
 * GET /summary/fees/{slug}?dataType=dailyFees|dailyRevenue — same shape
 * for both; only `dataType` differs (see SOURCE.md, confirmed the two
 * calls return materially different numbers for the same protocol).
 */
export interface RawFeesSummary {
  slug: string;
  name: string;
  displayName?: string | null;
  /** Confirmed inconsistent with /protocols' `chain` field for the same protocol — see SOURCE.md. */
  chain: string | null;
  total24h: number | null;
  total30d: number | null;
  totalDataChart: RawFeesChartPoint[];
}

/** GET /chains — one item. No protocol concept, no timestamp. */
export interface RawChainListItem {
  name: string;
  tvl: number | null;
  tokenSymbol: string | null;
  chainId: number | string | null;
}

// ---------------------------------------------------------------------
// Normalized domain types (provider output)
// ---------------------------------------------------------------------

/**
 * Shared output of Protocols, TVL, Revenue, and Fees — all four describe
 * the same real-world entity (a protocol's metrics, optionally scoped to
 * one chain), just with different raw shapes and different populated
 * subsets of these fields (e.g. Protocols never populates revenue/fees;
 * Fees never populates tvl). Unavailable fields are left `null` rather
 * than fabricated — see SOURCE.md per-endpoint notes for exactly which
 * fields each endpoint can and cannot supply.
 */
export interface NormalizedDefiLlamaMetrics {
  projectSlug: string;
  protocolName: string | null;
  /** null means "aggregate across all chains," not "unknown" — see SOURCE.md. */
  chain: string | null;
  tvl: number | null;
  tvlChange1d: number | null;
  tvlChange7d: number | null;
  revenue24h: number | null;
  revenue30d: number | null;
  fees24h: number | null;
  fees30d: number | null;
  /** ISO-8601. null where the source endpoint carries no timestamp at all (see SOURCE.md). */
  lastUpdated: string | null;
}

/**
 * Chain-level TVL has no protocol concept — kept separate from
 * NormalizedDefiLlamaMetrics rather than forcing project_slug/protocol_name
 * onto something that isn't a protocol (see SOURCE.md "Chains").
 */
export interface NormalizedChainTvl {
  chain: string;
  tvl: number | null;
  tokenSymbol: string | null;
  chainId: number | string | null;
}
