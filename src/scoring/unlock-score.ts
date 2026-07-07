// Unlock Score — pure function of upcoming-unlock facts only. Never
// reads any other score's output.
//
// Named "Unlock Risk" in the spec, but this function returns a SAFETY
// score, like every other module (0-100, higher is always better for
// score-engine.ts's pillar/overall combination): "high unlock risk should
// lower the score" is implemented by inverting risk internally — a near-term,
// large, high-value unlock produces a LOW return value; no scheduled
// unlock, or a small/distant one, produces a HIGH one.
//
// Unlike every other module in this folder, this one legitimately always
// returns a real number, never null: `noUpcomingUnlockScore` is a
// deliberate business default (no unlock scheduled genuinely means no
// near-term risk to price in — a verified fact, not missing data), and
// once a date IS scheduled, timing is always computable. Only the
// magnitude/value sub-terms can be individually missing (a real unlock
// is scheduled, but its percent-of-supply or USD value wasn't ingested)
// — see adaptive-weighted-average.ts's header for why those are excluded
// and renormalized rather than defaulted to 0.

import { adaptiveWeightedAverage, type WeightedTerm } from "./adaptive-weighted-average";
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
  const magnitudeScore =
    input.unlockPercentOfSupply === null ? null : interpolateCurve(config.magnitudeCurvePercent, input.unlockPercentOfSupply);
  const valueScore = input.unlockValueUsd === null ? null : interpolateCurve(config.valueCurveUsd, input.unlockValueUsd);

  const { timing, magnitude, value } = config.subWeights;
  const terms: WeightedTerm[] = [
    { key: "timing", value: timingScore, weight: timing },
    { key: "magnitude", value: magnitudeScore, weight: magnitude },
    { key: "value", value: valueScore, weight: value },
  ];
  const { value: combined } = adaptiveWeightedAverage(terms);

  // timingScore is always present in this branch, so `combined` can only
  // be null if the utility were passed zero total weight — not possible
  // with this fixed 3-term config — but fall back to timingScore alone
  // defensively rather than asserting.
  return clampScore(combined ?? timingScore);
}
