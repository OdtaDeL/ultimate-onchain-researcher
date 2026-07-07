// Funding Score — pure function of funding-round facts only. Never reads
// any other score's output (see SYSTEM_ARCHITECTURE.md-equivalent design
// principle in this folder: "no module may depend on another score").
// Returns null when there isn't enough data to compute a meaningful score
// — see adaptive-weighted-average.ts's header.

import { adaptiveWeightedAverage } from "./adaptive-weighted-average";
import { interpolateCurve, type FundingScoreConfig } from "./config";
import { DEFAULT_SCORING_CONFIG } from "./config";
import type { FundingScoreInput } from "./types";

export function calculateFundingScore(
  input: FundingScoreInput,
  config: FundingScoreConfig = DEFAULT_SCORING_CONFIG.funding,
): number | null {
  const amountScore =
    input.totalFundingUsd === null ? null : interpolateCurve(config.amountCurveUsd, input.totalFundingUsd);

  // Real facts, never excluded: latestStage always resolves to a real
  // classification ("unknown" is itself a meaningful default — see
  // types.ts's FundingStage doc comment), and numberOfRounds/
  // numberOfUniqueInvestors are verified counts (0 is a true fact, not
  // missing data — same reasoning as investor-score.ts's zero-investors
  // case).
  const stageScore = config.stageScores[input.latestStage] ?? config.stageScores.unknown;
  const roundsScore = interpolateCurve(config.roundsCountCurve, input.numberOfRounds);
  const investorsScore = interpolateCurve(config.investorsCountCurve, input.numberOfUniqueInvestors);

  // Excluded (not fabricated as "10 years stale") when no dated round
  // exists at all — a real gap in the data, not a verified fact.
  const recencyScore =
    input.daysSinceLastRound === null ? null : interpolateCurve(config.recencyCurveDays, input.daysSinceLastRound);

  const { amount, stage, recency, rounds, investors } = config.subWeights;
  const { value } = adaptiveWeightedAverage([
    { key: "amount", value: amountScore, weight: amount },
    { key: "stage", value: stageScore, weight: stage },
    { key: "recency", value: recencyScore, weight: recency },
    { key: "rounds", value: roundsScore, weight: rounds },
    { key: "investors", value: investorsScore, weight: investors },
  ]);

  return value;
}
