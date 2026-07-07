// Revenue Score — pure function of revenue/fee facts only. Never reads
// any other score's output. Returns null when there isn't enough data to
// compute a meaningful score — see adaptive-weighted-average.ts's header.

import { adaptiveWeightedAverage } from "./adaptive-weighted-average";
import { interpolateCurve, DEFAULT_SCORING_CONFIG, type RevenueScoreConfig } from "./config";
import type { RevenueScoreInput } from "./types";

export function calculateRevenueScore(
  input: RevenueScoreInput,
  config: RevenueScoreConfig = DEFAULT_SCORING_CONFIG.revenue,
): number | null {
  const revenueScore =
    input.revenue24hUsd === null ? null : interpolateCurve(config.revenueCurveUsd, input.revenue24hUsd);
  const feesScore = input.fees24hUsd === null ? null : interpolateCurve(config.feesCurveUsd, input.fees24hUsd);

  // Trend: today's revenue vs. its trailing 30-day daily average.
  // Excluded (not a fabricated neutral 50) when either side is missing
  // or the 30d total is 0 (a genuinely revenue-less protocol would divide
  // by zero, not signal "no data").
  let trendScore: number | null = null;
  if (input.revenue24hUsd !== null && input.revenue30dUsd !== null && input.revenue30dUsd > 0) {
    const dailyAverage = input.revenue30dUsd / 30;
    const percentDelta = ((input.revenue24hUsd - dailyAverage) / dailyAverage) * 100;
    trendScore = interpolateCurve(config.trendCurve, percentDelta);
  }

  const { revenue, fees, trend } = config.subWeights;
  const { value } = adaptiveWeightedAverage([
    { key: "revenue", value: revenueScore, weight: revenue },
    { key: "fees", value: feesScore, weight: fees },
    { key: "trend", value: trendScore, weight: trend },
  ]);

  return value;
}
