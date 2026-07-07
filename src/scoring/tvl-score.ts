// TVL Score — pure function of TVL facts only. Never reads any other
// score's output. Returns null when there isn't enough data to compute a
// meaningful score — see adaptive-weighted-average.ts's header.

import { adaptiveWeightedAverage, type WeightedTerm } from "./adaptive-weighted-average";
import { interpolateCurve, DEFAULT_SCORING_CONFIG, type TvlScoreConfig } from "./config";
import type { TvlScoreInput } from "./types";

export function calculateTvlScore(
  input: TvlScoreInput,
  config: TvlScoreConfig = DEFAULT_SCORING_CONFIG.tvl,
): number | null {
  const tvlScore = input.tvlUsd === null ? null : interpolateCurve(config.tvlCurveUsd, input.tvlUsd);

  const growthTerms: WeightedTerm[] = [
    {
      key: "d1",
      value: input.tvlChange1dPercent === null ? null : interpolateCurve(config.tvlChangeCurve, input.tvlChange1dPercent),
      weight: config.growthWeights.d1,
    },
    {
      key: "d7",
      value: input.tvlChange7dPercent === null ? null : interpolateCurve(config.tvlChangeCurve, input.tvlChange7dPercent),
      weight: config.growthWeights.d7,
    },
  ];
  const { value: growthScore } = adaptiveWeightedAverage(growthTerms);

  // chainCount always has a value (defaults to 1 upstream — see types.ts's TvlScoreInput doc comment), never excluded.
  const chainDiversityScore = interpolateCurve(config.chainCountCurve, input.chainCount);

  const { tvl, growth, chainDiversity } = config.subWeights;
  const { value } = adaptiveWeightedAverage([
    { key: "tvl", value: tvlScore, weight: tvl },
    { key: "growth", value: growthScore, weight: growth },
    { key: "chainDiversity", value: chainDiversityScore, weight: chainDiversity },
  ]);

  return value;
}
