// Funding Score — pure function of funding-round facts only. Never reads
// any other score's output (see SYSTEM_ARCHITECTURE.md-equivalent design
// principle in this folder: "no module may depend on another score").

import { clampScore, interpolateCurve, type FundingScoreConfig } from "./config";
import { DEFAULT_SCORING_CONFIG } from "./config";
import type { FundingScoreInput } from "./types";

export function calculateFundingScore(
  input: FundingScoreInput,
  config: FundingScoreConfig = DEFAULT_SCORING_CONFIG.funding,
): number {
  const amountScore = interpolateCurve(config.amountCurveUsd, input.totalFundingUsd ?? 0);
  const stageScore = config.stageScores[input.latestStage] ?? config.stageScores.unknown;
  const recencyScore =
    input.daysSinceLastRound === null
      ? config.recencyCurveDays[config.recencyCurveDays.length - 1].score
      : interpolateCurve(config.recencyCurveDays, input.daysSinceLastRound);
  const roundsScore = interpolateCurve(config.roundsCountCurve, input.numberOfRounds);
  const investorsScore = interpolateCurve(config.investorsCountCurve, input.numberOfUniqueInvestors);

  const { amount, stage, recency, rounds, investors } = config.subWeights;
  const combined =
    amountScore * amount +
    stageScore * stage +
    recencyScore * recency +
    roundsScore * rounds +
    investorsScore * investors;

  return clampScore(combined);
}
