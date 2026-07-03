// Unlock Score — pure function of upcoming-unlock facts only. Never
// reads any other score's output.
//
// Named "Unlock Risk" in the spec, but this function returns a SAFETY
// score, like every other module (0-100, higher is always better for
// weighted-score.ts's combination): "high unlock risk should lower the
// score" is implemented by inverting risk internally — a near-term,
// large, high-value unlock produces a LOW return value; no scheduled
// unlock, or a small/distant one, produces a HIGH one.

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type UnlockScoreConfig } from "./config";
import type { UnlockScoreInput } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateUnlockScore(
  input: UnlockScoreInput,
  config: UnlockScoreConfig = DEFAULT_SCORING_CONFIG.unlock,
): number {
  if (input.nextUnlockDate === null) {
    return clampScore(config.noUpcomingUnlockScore);
  }

  const asOf = input.asOf ?? new Date();
  const unlockDate = new Date(input.nextUnlockDate);
  const daysUntilUnlock = Math.max(0, (unlockDate.getTime() - asOf.getTime()) / MS_PER_DAY);

  const timingScore = interpolateCurve(config.timingCurveDays, daysUntilUnlock);
  const magnitudeScore = interpolateCurve(config.magnitudeCurvePercent, input.unlockPercentOfSupply ?? 0);
  const valueScore = interpolateCurve(config.valueCurveUsd, input.unlockValueUsd ?? 0);

  const { timing, magnitude, value } = config.subWeights;
  const combined = timingScore * timing + magnitudeScore * magnitude + valueScore * value;

  return clampScore(combined);
}
