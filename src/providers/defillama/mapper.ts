// Raw* (API shapes) -> Normalized* (provider output) mapping. Pure
// functions only — no I/O, no retry/validation concerns (those live in
// client.ts/base), no database writes.

import type {
  NormalizedChainTvl,
  NormalizedDefiLlamaMetrics,
  RawChainListItem,
  RawFeesSummary,
  RawProtocolDetail,
  RawProtocolListItem,
} from "./types";

/** `chainTvls`/`currentChainTvls` mix real chain keys with `<Chain>-borrowed` pseudo-keys — see SOURCE.md. */
function isRealChainKey(key: string): boolean {
  return !key.endsWith("-borrowed");
}

export function mapProtocolListItem(raw: RawProtocolListItem): NormalizedDefiLlamaMetrics {
  return {
    projectSlug: raw.slug,
    protocolName: raw.name,
    chain: raw.chain ?? null,
    tvl: raw.tvl,
    tvlChange1d: raw.change_1d,
    tvlChange7d: raw.change_7d,
    revenue24h: null,
    revenue30d: null,
    fees24h: null,
    fees30d: null,
    // /protocols carries no per-protocol timestamp — see SOURCE.md.
    lastUpdated: null,
  };
}

/**
 * One row per real chain in `currentChainTvls`. `lastUpdated` is the
 * detail response's own historical-series last point, applied uniformly
 * to every row produced from this one fetch — see SOURCE.md "TVL" for
 * why that's an honest response timestamp, not a fabrication.
 */
export function mapProtocolDetailToChainRows(raw: RawProtocolDetail): NormalizedDefiLlamaMetrics[] {
  const lastPoint = raw.tvl[raw.tvl.length - 1];
  const lastUpdated = lastPoint ? new Date(lastPoint.date * 1000).toISOString() : null;

  return Object.entries(raw.currentChainTvls)
    .filter(([chain]) => isRealChainKey(chain))
    .map(([chain, tvl]) => ({
      projectSlug: raw.slug,
      protocolName: raw.name,
      chain,
      tvl,
      tvlChange1d: null,
      tvlChange7d: null,
      revenue24h: null,
      revenue30d: null,
      fees24h: null,
      fees30d: null,
      lastUpdated,
    }));
}

function lastChartPointIso(chart: readonly [number, number][]): string | null {
  const last = chart[chart.length - 1];
  return last ? new Date(last[0] * 1000).toISOString() : null;
}

export function mapFeesSummaryToFees(raw: RawFeesSummary): NormalizedDefiLlamaMetrics {
  return {
    projectSlug: raw.slug,
    protocolName: raw.displayName ?? raw.name,
    chain: raw.chain,
    tvl: null,
    tvlChange1d: null,
    tvlChange7d: null,
    revenue24h: null,
    revenue30d: null,
    fees24h: raw.total24h,
    fees30d: raw.total30d,
    lastUpdated: lastChartPointIso(raw.totalDataChart),
  };
}

export function mapFeesSummaryToRevenue(raw: RawFeesSummary): NormalizedDefiLlamaMetrics {
  return {
    projectSlug: raw.slug,
    protocolName: raw.displayName ?? raw.name,
    chain: raw.chain,
    tvl: null,
    tvlChange1d: null,
    tvlChange7d: null,
    revenue24h: raw.total24h,
    revenue30d: raw.total30d,
    fees24h: null,
    fees30d: null,
    lastUpdated: lastChartPointIso(raw.totalDataChart),
  };
}

export function mapChainListItem(raw: RawChainListItem): NormalizedChainTvl {
  return {
    chain: raw.name,
    tvl: raw.tvl,
    tokenSymbol: raw.tokenSymbol,
    chainId: raw.chainId,
  };
}
