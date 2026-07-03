// Provider contract for DefiLlama. INTERFACE ONLY — no HTTP client
// implementation here, mirroring chainbroker/provider.ts and
// coingecko/provider.ts. Coding the rest of the platform against this
// interface, rather than against `DefiLlamaClient` directly, means a
// second implementation can be swapped in without touching callers — see
// SYSTEM_ARCHITECTURE.md ADR 5.

import type { BaseProviderConfig } from "../base/config";
import type { NormalizedChainTvl, NormalizedDefiLlamaMetrics } from "./types";

// Identical shape to BaseProviderConfig today — kept as its own named
// type so DefiLlama-specific fields could be added here later without
// touching src/providers/base/.
export type DefiLlamaProviderConfig = BaseProviderConfig;

/** Read-only access to DefiLlama's protocol/chain TVL, fees, and revenue data. */
export interface DefiLlamaProvider {
  /** Bulk protocol directory with aggregate TVL + 1d/7d change, for seeding/reconciling. */
  listProtocols(): Promise<NormalizedDefiLlamaMetrics[]>;

  /** Per-chain TVL breakdown for a single protocol (see SOURCE.md "TVL" for why this endpoint over the bare /tvl/{slug}). */
  getProtocolTvlByChain(slug: string): Promise<NormalizedDefiLlamaMetrics[]>;

  /** Protocol revenue (24h/30d totals) for a single protocol. */
  getProtocolRevenue(slug: string): Promise<NormalizedDefiLlamaMetrics>;

  /** Protocol fees (24h/30d totals) for a single protocol. */
  getProtocolFees(slug: string): Promise<NormalizedDefiLlamaMetrics>;

  /** Full chain directory with current aggregate TVL. No protocol concept — see SOURCE.md "Chains." */
  listChains(): Promise<NormalizedChainTvl[]>;
}
