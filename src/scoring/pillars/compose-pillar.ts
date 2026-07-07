// The one pillar composer, shared by all 6 pillars (src/scoring/pillars/
// *.ts each just call this with their own key/label/signal list) — the
// actual "Signal -> Pillar" logic is identical across pillars; only which
// signals feed in and at what weight differs (see config.ts's
// PILLAR_SIGNAL_WEIGHTS).
//
// This is where the "mathematical vs. semantic" split from signal.ts's
// SignalState doc comment is actually enforced: not_applicable/
// not_implemented signals are OMITTED from the term list entirely (never
// reach adaptiveWeightedAverage, never touch the completeness
// denominator, since they were never a real gap); missing/provider_error
// signals ARE included, as a term with value: null (they count toward
// completeness — this pillar expected them — but contribute nothing to
// the numerator). The full, untouched Signal[] — including the omitted
// ones — is still returned on PillarResult.signals, so nothing is ever
// hidden from callers, only excluded from the arithmetic.

import { adaptiveWeightedAverage, type WeightedTerm } from "../adaptive-weighted-average";
import { confidenceFrom, freshnessScoreFromAsOfDate } from "../config";
import type { PillarKey, PillarResult } from "../types";
import type { Signal, SignalKey } from "../signal";

function isExcludedFromCompleteness(signal: Signal): boolean {
  return signal.state === "not_applicable" || signal.state === "not_implemented";
}

export function composePillar(
  key: PillarKey,
  signalWeights: Partial<Record<SignalKey, number>>,
  signals: Signal[],
  now: Date = new Date(),
): PillarResult {
  const valueTerms: WeightedTerm[] = [];
  const freshnessTerms: WeightedTerm[] = [];

  for (const signal of signals) {
    if (isExcludedFromCompleteness(signal)) continue;
    const weight = signalWeights[signal.key] ?? 0;
    if (weight <= 0) continue;

    valueTerms.push({
      key: signal.key,
      value: signal.state === "present" ? signal.normalizedScore : null,
      weight,
    });

    if (signal.state === "present") {
      freshnessTerms.push({
        key: signal.key,
        value: freshnessScoreFromAsOfDate(signal.metadata.asOfDate, now),
        weight,
      });
    }
  }

  const { value, completenessPercent } = adaptiveWeightedAverage(valueTerms);
  // Freshness is only meaningful over present signals — a missing/
  // provider_error signal has no asOfDate to measure, so it never
  // becomes a freshness term at all (distinct from the completeness
  // calculation above, which DOES count it via a null-value term).
  const { value: freshnessScore } = adaptiveWeightedAverage(freshnessTerms);

  return {
    key,
    value,
    completenessPercent,
    freshnessScore,
    confidence: confidenceFrom(completenessPercent, freshnessScore),
    signals,
  };
}
