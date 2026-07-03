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

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type MomentumScoreConfig } from "./config";
import type { MomentumScoreInput } from "./types";

export function calculateMomentumScore(
  input: MomentumScoreInput,
  config: MomentumScoreConfig = DEFAULT_SCORING_CONFIG.momentum,
): number {
  const fundingRecencyScore =
    input.daysSinceLastRound === null
      ? config.fundingRecencyCurveDays[config.fundingRecencyCurveDays.length - 1].score
      : interpolateCurve(config.fundingRecencyCurveDays, input.daysSinceLastRound);

  const priceMomentumScore =
    input.priceChange24hPercent === null
      ? 50
      : interpolateCurve(config.priceMomentumCurvePercent, input.priceChange24hPercent);

  const tvlMomentumScore =
    input.tvlChange1dPercent === null
      ? 50
      : interpolateCurve(config.tvlMomentumCurvePercent, input.tvlChange1dPercent);

  const revenueMomentumScore =
    input.revenueMomentumPercent === null
      ? 50
      : interpolateCurve(config.revenueMomentumCurvePercent, input.revenueMomentumPercent);

  const { fundingRecency, priceMomentum, tvlMomentum, revenueMomentum } = config.subWeights;
  const combined =
    fundingRecencyScore * fundingRecency +
    priceMomentumScore * priceMomentum +
    tvlMomentumScore * tvlMomentum +
    revenueMomentumScore * revenueMomentum;

  return clampScore(combined);
}
