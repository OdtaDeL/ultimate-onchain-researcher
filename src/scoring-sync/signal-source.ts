// The ONLY implementation of src/scoring/signal.ts's SignalSource port
// today — translates this platform's current schema (project_metrics/
// funding_rounds/token_unlock_events/project_aliases, via mapper.ts's
// build*Input helpers + the leaf calculators in src/scoring/) into
// Signal objects. A future project_signals table, materialized view, or
// cached API response would need only a new implementation of this same
// contract; src/scoring/ never changes when this file does.
//
// Provider attribution for market/tvl/revenue/momentum signals below is
// a documented APPROXIMATION: project_metrics stores one merged row per
// project (whichever provider's sync last wrote each column), with no
// per-field provenance. This inspects project_aliases (which providers
// have successfully matched this project at all) and picks the
// highest-priority one, in the same order the ingestion pipeline itself
// prefers (src/ingestion/metrics/syncMetrics.ts) — it cannot be exact
// when multiple providers have written to the same row, and is purely
// informational metadata that never affects scoring.

import { calculateFundingScore } from "../scoring/funding-score";
import { calculateInvestorScore } from "../scoring/investor-score";
import { calculateMarketScore } from "../scoring/market-score";
import { calculateMomentumScore } from "../scoring/momentum-score";
import { calculateRevenueScore } from "../scoring/revenue-score";
import { calculateTvlScore } from "../scoring/tvl-score";
import { calculateUnlockScore } from "../scoring/unlock-score";
import { emptySignal, type Signal, type SignalMetadata } from "../scoring/signal";
import {
  buildFundingInput,
  buildInvestorInput,
  buildMarketInput,
  buildMomentumInput,
  buildRevenueInput,
  buildTvlInput,
  buildUnlockInput,
  mostRecentlyCreatedFundingRound,
  nextUnlockEvent,
} from "./mapper";
import type { ProjectScoringData, RawProjectAlias } from "./types";

const PROVIDER_NAMES: Record<string, string> = {
  chainbroker: "ChainBroker",
  coingecko: "CoinGecko",
  coinpaprika: "CoinPaprika",
  dexscreener: "DexScreener",
  defillama: "DefiLlama",
};

// Same priority order the ingestion pipeline itself uses — see
// src/ingestion/metrics/syncMetrics.ts and src/cli/metrics-sync.ts's
// header comment ("CoinPaprika/DexScreener are the primary market-data
// sources... CoinGecko now only fills what they left null").
const MARKET_PROVIDER_PRIORITY = ["coinpaprika", "dexscreener", "coingecko"];
const TVL_PROVIDER_PRIORITY = ["defillama", "coinpaprika", "dexscreener", "coingecko"];

function pickProvider(
  aliases: RawProjectAlias[],
  priority: string[],
): { providerId: string; sourcePriority: number } | null {
  for (let i = 0; i < priority.length; i++) {
    if (aliases.some((a) => a.provider === priority[i])) {
      return { providerId: priority[i], sourcePriority: i + 1 };
    }
  }
  return null;
}

function metadataFor(providerId: string | null, asOfDate: string | null, sourcePriority: number | null): SignalMetadata {
  return {
    providerId,
    providerName: providerId ? (PROVIDER_NAMES[providerId] ?? providerId) : null,
    asOfDate,
    sourcePriority,
    version: null,
  };
}

/**
 * Builds every signal known for one project (see src/scoring/signal.ts's
 * SignalKey union — always all 10 keys, in a fixed order). This is the
 * function scoring-sync.ts actually calls; it's what "implements
 * SignalSource" in practice for this adapter, translating DB-shaped data
 * into the pure engine's canonical Signal[] input.
 */
export function buildSignals(data: ProjectScoringData, asOf: Date): Signal[] {
  const signals: Signal[] = [];

  // --- funding, investor: chainbroker only, no ambiguity to approximate ---
  const fundingInput = buildFundingInput(data, asOf);
  const fundingRound = mostRecentlyCreatedFundingRound(data.fundingRounds);
  const fundingScore = calculateFundingScore(fundingInput);
  signals.push(
    data.fundingRounds.length === 0
      ? emptySignal("funding", "missing")
      : {
          key: "funding",
          state: "present",
          rawValue: fundingInput.totalFundingUsd,
          normalizedScore: fundingScore,
          metadata: metadataFor("chainbroker", fundingRound?.createdAt ?? null, 1),
        },
  );

  const investorInput = buildInvestorInput(data);
  signals.push({
    key: "investor",
    // Always "present" — 0 investors is a verified fact (investor-score.ts
    // never returns null), not missing data.
    state: "present",
    rawValue: investorInput.investors.length,
    normalizedScore: calculateInvestorScore(investorInput),
    metadata: metadataFor("chainbroker", fundingRound?.createdAt ?? null, 1),
  });

  // --- market_maker: no provider/calculator exists anywhere yet ---
  signals.push(emptySignal("market_maker", "not_implemented"));

  // --- market, tvl, revenue, momentum: derived from project_metrics ---
  const marketInput = buildMarketInput(data);
  const marketScore = calculateMarketScore(marketInput);
  const marketProvider = pickProvider(data.aliases, MARKET_PROVIDER_PRIORITY);
  signals.push(
    marketScore === null
      ? emptySignal("market", "missing")
      : {
          key: "market",
          state: "present",
          rawValue: marketInput.marketCapUsd,
          normalizedScore: marketScore,
          metadata: metadataFor(
            marketProvider?.providerId ?? null,
            data.metrics?.updatedAt ?? null,
            marketProvider?.sourcePriority ?? null,
          ),
        },
  );

  const tvlInput = buildTvlInput(data);
  const tvlScore = calculateTvlScore(tvlInput);
  const tvlProvider = pickProvider(data.aliases, TVL_PROVIDER_PRIORITY);
  signals.push(
    tvlScore === null
      ? emptySignal("tvl", "missing")
      : {
          key: "tvl",
          state: "present",
          rawValue: tvlInput.tvlUsd,
          normalizedScore: tvlScore,
          metadata: metadataFor(
            tvlProvider?.providerId ?? null,
            data.metrics?.updatedAt ?? null,
            tvlProvider?.sourcePriority ?? null,
          ),
        },
  );

  const revenueInput = buildRevenueInput(data);
  const revenueScore = calculateRevenueScore(revenueInput);
  signals.push(
    revenueScore === null
      ? emptySignal("revenue", "missing")
      : {
          key: "revenue",
          state: "present",
          rawValue: revenueInput.revenue24hUsd,
          normalizedScore: revenueScore,
          metadata: metadataFor(
            marketProvider?.providerId ?? null,
            data.metrics?.updatedAt ?? null,
            marketProvider?.sourcePriority ?? null,
          ),
        },
  );

  // --- unlock: chainbroker only, always computable (a real safety default when nothing is scheduled) ---
  const unlockInput = buildUnlockInput(data, asOf);
  const unlock = nextUnlockEvent(data);
  signals.push({
    key: "unlock",
    state: "present",
    rawValue: unlockInput.unlockPercentOfSupply,
    normalizedScore: calculateUnlockScore(unlockInput),
    metadata: metadataFor("chainbroker", unlock?.createdAt ?? null, 1),
  });

  // --- momentum: derived from the same project_metrics + funding_rounds facts as above ---
  const momentumInput = buildMomentumInput(data, fundingInput);
  const momentumScore = calculateMomentumScore(momentumInput);
  signals.push(
    momentumScore === null
      ? emptySignal("momentum", "missing")
      : {
          key: "momentum",
          state: "present",
          rawValue: momentumInput.priceChange24hPercent,
          normalizedScore: momentumScore,
          metadata: metadataFor(
            marketProvider?.providerId ?? null,
            data.metrics?.updatedAt ?? null,
            marketProvider?.sourcePriority ?? null,
          ),
        },
  );

  // --- team, community: no provider/calculator exists anywhere yet ---
  signals.push(emptySignal("team", "not_implemented"));
  signals.push(emptySignal("community", "not_implemented"));

  return signals;
}
