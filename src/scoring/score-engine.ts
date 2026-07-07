// The top-level orchestrator for the Provider -> Signal -> Pillar ->
// Overall hierarchy (see signal.ts's header for the full architecture
// note). Still 100% pure: no Supabase import, no provider import, no I/O.
// Assembling a Signal[] from real database rows is
// src/scoring-sync/signal-source.ts's job, not this one's.
//
// Each of the 6 pillars is composed independently from its own signals
// (composePillar never sees another pillar's data) — only the final
// combination step here reads across all 6, via the same
// adaptiveWeightedAverage utility used one level down inside each pillar.

import { adaptiveWeightedAverage, type WeightedTerm } from "./adaptive-weighted-average";
import { composePillar } from "./pillars/compose-pillar";
import {
  confidenceFrom,
  freshnessScoreFromAsOfDate,
  gradeFromScore,
  DEFAULT_SCORING_CONFIG,
  OVERALL_PILLAR_WEIGHTS,
  PILLAR_SIGNAL_WEIGHTS,
  type ScoringConfig,
} from "./config";
import type { PillarKey, PillarResult, ScoreEngineResult } from "./types";
import type { Signal } from "./signal";

const PILLAR_KEYS: PillarKey[] = [
  "vc_market_makers",
  "business_model",
  "tokenomics",
  "chart",
  "team",
  "community",
];

/** Groups a flat Signal[] (everything known about one project) by which pillar each signal's key belongs to, per config.ts's PILLAR_SIGNAL_WEIGHTS. */
function groupSignalsByPillar(signals: Signal[]): Record<PillarKey, Signal[]> {
  const groups = Object.fromEntries(PILLAR_KEYS.map((key) => [key, [] as Signal[]])) as Record<PillarKey, Signal[]>;
  for (const signal of signals) {
    for (const pillarKey of PILLAR_KEYS) {
      if (signal.key in PILLAR_SIGNAL_WEIGHTS[pillarKey]) {
        groups[pillarKey].push(signal);
      }
    }
  }
  return groups;
}

export function computePillars(signals: Signal[], now: Date = new Date()): PillarResult[] {
  const grouped = groupSignalsByPillar(signals);
  return PILLAR_KEYS.map((key) => composePillar(key, PILLAR_SIGNAL_WEIGHTS[key], grouped[key], now));
}

/**
 * Runs the full pipeline: signals -> 6 pillars -> overall score/grade,
 * with completeness/freshness/confidence at both levels. Deterministic:
 * identical signals + config always produce an identical result, with no
 * I/O or hidden state anywhere in the call graph.
 */
export function runScoreEngine(
  signals: Signal[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  now: Date = new Date(),
): ScoreEngineResult {
  const pillars = computePillars(signals, now);

  const overallTerms: WeightedTerm[] = pillars.map((p) => ({
    key: p.key,
    value: p.value,
    weight: OVERALL_PILLAR_WEIGHTS[p.key],
  }));
  const { value: overallScore, completenessPercent: overallCompletenessPercent } = adaptiveWeightedAverage(overallTerms);

  const freshnessTerms: WeightedTerm[] = pillars
    .filter((p) => p.freshnessScore !== null)
    .map((p) => ({ key: p.key, value: p.freshnessScore, weight: OVERALL_PILLAR_WEIGHTS[p.key] }));
  const { value: overallFreshnessScore } = adaptiveWeightedAverage(freshnessTerms);

  const overallGrade = overallScore === null ? null : gradeFromScore(overallScore, config.grade);
  const overallConfidence = confidenceFrom(overallCompletenessPercent, overallFreshnessScore);

  return {
    overallScore,
    overallGrade,
    overallCompletenessPercent,
    overallFreshnessScore,
    overallConfidence,
    pillars,
  };
}

// Re-exported for callers that only need the freshness curve (e.g. a
// future debug page rendering "how fresh is this specific signal").
export { freshnessScoreFromAsOfDate };
