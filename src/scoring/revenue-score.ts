// Revenue Score — pure function of revenue/fee facts only. Never reads
// any other score's output.

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type RevenueScoreConfig } from "./config";
import type { RevenueScoreInput } from "./types";

export function calculateRevenueScore(
  input: RevenueScoreInput,
  config: RevenueScoreConfig = DEFAULT_SCORING_CONFIG.revenue,
): number {
  const revenueScore = interpolateCurve(config.revenueCurveUsd, input.revenue24hUsd ?? 0);
  const feesScore = interpolateCurve(config.feesCurveUsd, input.fees24hUsd ?? 0);

  // Trend: today's revenue vs. its trailing 30-day daily average.
  // Undefined when either side is missing or the 30d total is 0 (a
  // genuinely revenue-less protocol, not a divide-by-zero to mask).
  let trendScore = 50;
  if (input.revenue24hUsd !== null && input.revenue30dUsd !== null && input.revenue30dUsd > 0) {
    const dailyAverage = input.revenue30dUsd / 30;
    const percentDelta = ((input.revenue24hUsd - dailyAverage) / dailyAverage) * 100;
    trendScore = interpolateCurve(config.trendCurve, percentDelta);
  }

  const { revenue, fees, trend } = config.subWeights;
  const combined = revenueScore * revenue + feesScore * fees + trendScore * trend;

  return clampScore(combined);
}
