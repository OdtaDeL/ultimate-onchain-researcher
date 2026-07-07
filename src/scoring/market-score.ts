// Market Score — pure function of market-data facts only. Never reads
// any other score's output. Returns null (not a fabricated low number)
// when there isn't enough data to compute a meaningful score — see
// adaptive-weighted-average.ts's header for why every missing input here
// is excluded rather than defaulted to 0.

import { adaptiveWeightedAverage, type WeightedTerm } from "./adaptive-weighted-average";
import { interpolateCurve, DEFAULT_SCORING_CONFIG, type MarketScoreConfig } from "./config";
import type { MarketScoreInput } from "./types";

export function calculateMarketScore(
  input: MarketScoreInput,
  config: MarketScoreConfig = DEFAULT_SCORING_CONFIG.market,
): number | null {
  const { marketCap: wMarketCap, fdvRatio, volume, liquidity, priceTrend } = config.subWeights;

  const marketCapScore =
    input.marketCapUsd === null ? null : interpolateCurve(config.marketCapCurveUsd, input.marketCapUsd);

  // FDV/market-cap ratio needs both sides present and a positive market
  // cap to divide by — excluded (not a fabricated neutral 50) if either
  // is missing.
  const fdvRatioScore =
    input.fullyDilutedValuationUsd === null || input.marketCapUsd === null || input.marketCapUsd <= 0
      ? null
      : interpolateCurve(config.fdvRatioCurve, input.fullyDilutedValuationUsd / input.marketCapUsd);

  const volumeScore =
    input.volume24hUsd === null ? null : interpolateCurve(config.volumeCurveUsd, input.volume24hUsd);

  // Liquidity proxy: 24h volume as a fraction of market cap (turnover).
  // Same "both sides present" requirement as the FDV ratio above.
  const liquidityScore =
    input.volume24hUsd === null || input.marketCapUsd === null || input.marketCapUsd <= 0
      ? null
      : interpolateCurve(config.turnoverCurve, input.volume24hUsd / input.marketCapUsd);

  const trendTerms: WeightedTerm[] = [
    {
      key: "d1",
      value: input.priceChange24hPercent === null ? null : interpolateCurve(config.priceChangeCurve, input.priceChange24hPercent),
      weight: config.priceTrendWeights.d1,
    },
    {
      key: "d7",
      value: input.priceChange7dPercent === null ? null : interpolateCurve(config.priceChangeCurve, input.priceChange7dPercent),
      weight: config.priceTrendWeights.d7,
    },
    {
      key: "d30",
      value: input.priceChange30dPercent === null ? null : interpolateCurve(config.priceChangeCurve, input.priceChange30dPercent),
      weight: config.priceTrendWeights.d30,
    },
  ];
  const { value: priceTrendScore } = adaptiveWeightedAverage(trendTerms);

  const { value } = adaptiveWeightedAverage([
    { key: "marketCap", value: marketCapScore, weight: wMarketCap },
    { key: "fdvRatio", value: fdvRatioScore, weight: fdvRatio },
    { key: "volume", value: volumeScore, weight: volume },
    { key: "liquidity", value: liquidityScore, weight: liquidity },
    { key: "priceTrend", value: priceTrendScore, weight: priceTrend },
  ]);

  return value;
}
