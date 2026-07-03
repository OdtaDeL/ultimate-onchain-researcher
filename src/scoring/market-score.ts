// Market Score — pure function of market-data facts only. Never reads
// any other score's output.

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type MarketScoreConfig } from "./config";
import type { MarketScoreInput } from "./types";

export function calculateMarketScore(
  input: MarketScoreInput,
  config: MarketScoreConfig = DEFAULT_SCORING_CONFIG.market,
): number {
  const marketCap = input.marketCapUsd ?? 0;
  const marketCapScore = interpolateCurve(config.marketCapCurveUsd, marketCap);

  // FDV/market-cap ratio is undefined when either side is missing or
  // market cap is 0 — fall back to a neutral midpoint rather than
  // dividing by zero or guessing a dilution risk that isn't observable.
  const fdvRatioScore =
    input.fullyDilutedValuationUsd === null || marketCap <= 0
      ? 50
      : interpolateCurve(config.fdvRatioCurve, input.fullyDilutedValuationUsd / marketCap);

  const volumeScore = interpolateCurve(config.volumeCurveUsd, input.volume24hUsd ?? 0);

  // Liquidity proxy: 24h volume as a fraction of market cap (turnover).
  // Same zero-market-cap guard as the FDV ratio above.
  const turnover = marketCap > 0 ? (input.volume24hUsd ?? 0) / marketCap : 0;
  const liquidityScore = interpolateCurve(config.turnoverCurve, turnover);

  const trendScores = [
    [input.priceChange24hPercent, config.priceTrendWeights.d1],
    [input.priceChange7dPercent, config.priceTrendWeights.d7],
    [input.priceChange30dPercent, config.priceTrendWeights.d30],
  ] as const;
  const { weightedSum, weightTotal } = trendScores.reduce(
    (acc, [value, weight]) => {
      if (value === null) return acc;
      return {
        weightedSum: acc.weightedSum + interpolateCurve(config.priceChangeCurve, value) * weight,
        weightTotal: acc.weightTotal + weight,
      };
    },
    { weightedSum: 0, weightTotal: 0 },
  );
  const priceTrendScore = weightTotal > 0 ? weightedSum / weightTotal : 50;

  const { marketCap: wMarketCap, fdvRatio, volume, liquidity, priceTrend } = config.subWeights;
  const combined =
    marketCapScore * wMarketCap +
    fdvRatioScore * fdvRatio +
    volumeScore * volume +
    liquidityScore * liquidity +
    priceTrendScore * priceTrend;

  return clampScore(combined);
}
