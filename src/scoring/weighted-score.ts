// Weighted Score — the ONLY module allowed to combine other scores. Every
// other file in src/scoring/ computes its 0-100 independently from raw
// facts; this is the single aggregation point, by design (see the
// "Design Principles" section this folder was built against — no module
// may depend on another score, except this one, whose entire job is to).

import { clampScore, DEFAULT_SCORING_CONFIG } from "./config";
import type { ScoreBreakdown, ScoreWeights } from "./types";

/** Normalizes weights to sum to 1 before applying — so passing e.g. percentages (20, 20, 20, 15, 10, 5, 10) just works. */
function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const total =
    weights.funding +
    weights.investor +
    weights.market +
    weights.tvl +
    weights.revenue +
    weights.unlock +
    weights.momentum;
  if (total === 0) {
    throw new Error("Score weights must not all be zero.");
  }
  return {
    funding: weights.funding / total,
    investor: weights.investor / total,
    market: weights.market / total,
    tvl: weights.tvl / total,
    revenue: weights.revenue / total,
    unlock: weights.unlock / total,
    momentum: weights.momentum / total,
  };
}

export function calculateWeightedScore(
  breakdown: ScoreBreakdown,
  weights: ScoreWeights = DEFAULT_SCORING_CONFIG.weights,
): number {
  const w = normalizeWeights(weights);
  const combined =
    breakdown.funding * w.funding +
    breakdown.investor * w.investor +
    breakdown.market * w.market +
    breakdown.tvl * w.tvl +
    breakdown.revenue * w.revenue +
    breakdown.unlock * w.unlock +
    breakdown.momentum * w.momentum;

  return clampScore(combined);
}
