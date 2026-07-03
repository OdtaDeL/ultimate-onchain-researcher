// TVL Score — pure function of TVL facts only. Never reads any other
// score's output.

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type TvlScoreConfig } from "./config";
import type { TvlScoreInput } from "./types";

export function calculateTvlScore(
  input: TvlScoreInput,
  config: TvlScoreConfig = DEFAULT_SCORING_CONFIG.tvl,
): number {
  const tvlScore = interpolateCurve(config.tvlCurveUsd, input.tvlUsd ?? 0);

  const d1 = input.tvlChange1dPercent;
  const d7 = input.tvlChange7dPercent;
  const growthTerms = [
    [d1, config.growthWeights.d1],
    [d7, config.growthWeights.d7],
  ] as const;
  const { weightedSum, weightTotal } = growthTerms.reduce(
    (acc, [value, weight]) => {
      if (value === null) return acc;
      return {
        weightedSum: acc.weightedSum + interpolateCurve(config.tvlChangeCurve, value) * weight,
        weightTotal: acc.weightTotal + weight,
      };
    },
    { weightedSum: 0, weightTotal: 0 },
  );
  const growthScore = weightTotal > 0 ? weightedSum / weightTotal : 50;

  const chainDiversityScore = interpolateCurve(config.chainCountCurve, input.chainCount);

  const { tvl, growth, chainDiversity } = config.subWeights;
  const combined = tvlScore * tvl + growthScore * growth + chainDiversityScore * chainDiversity;

  return clampScore(combined);
}
