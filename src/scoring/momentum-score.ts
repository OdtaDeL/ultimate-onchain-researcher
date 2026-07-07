// Momentum Score — pure function of short-term trend facts only. Never
// reads any other score's output.
//
// These input facts overlap with what funding-score.ts/market-score.ts/
// tvl-score.ts/revenue-score.ts also consume (e.g. daysSinceLastRound,
// priceChange24h) — that's expected, not a violation of "no module may
// depend on another score." This module never calls those modules or
// reads their *computed scores*; it independently re-derives its own
// 0-100 from the same raw facts, with a different emphasis (short-term
// acceleration, not magnitude).
//
// Returns null when there isn't enough data to compute a meaningful score
// — see adaptive-weighted-average.ts's header. Every term here is now
// excluded-and-renormalized when its input is missing, rather than
// defaulted to a neutral 50 (or, for fundingRecency, the curve's worst
// point — treating "no dated round" as "as stale as possible" was itself
// a second instance of the same "missing != worst-case" bug).

import { adaptiveWeightedAverage, type WeightedTerm } from "./adaptive-weighted-average";
import { interpolateCurve, DEFAULT_SCORING_CONFIG, type MomentumScoreConfig } from "./config";
import type { MomentumScoreInput } from "./types";

export function calculateMomentumScore(
  input: MomentumScoreInput,
  config: MomentumScoreConfig = DEFAULT_SCORING_CONFIG.momentum,
): number | null {
  const { fundingRecency, priceMomentum, tvlMomentum, revenueMomentum } = config.subWeights;

  const terms: WeightedTerm[] = [
    {
      key: "fundingRecency",
      value: input.daysSinceLastRound === null ? null : interpolateCurve(config.fundingRecencyCurveDays, input.daysSinceLastRound),
      weight: fundingRecency,
    },
    {
      key: "priceMomentum",
      value: input.priceChange24hPercent === null ? null : interpolateCurve(config.priceMomentumCurvePercent, input.priceChange24hPercent),
      weight: priceMomentum,
    },
    {
      key: "tvlMomentum",
      value: input.tvlChange1dPercent === null ? null : interpolateCurve(config.tvlMomentumCurvePercent, input.tvlChange1dPercent),
      weight: tvlMomentum,
    },
    {
      key: "revenueMomentum",
      value: input.revenueMomentumPercent === null ? null : interpolateCurve(config.revenueMomentumCurvePercent, input.revenueMomentumPercent),
      weight: revenueMomentum,
    },
  ];

  const { value } = adaptiveWeightedAverage(terms);
  return value;
}
