// The one aggregation primitive used at every level of the scoring
// engine: Signal -> Pillar, and Pillar -> Overall. Deliberately simple —
// it only ever sees plain nullable values and weights. The DECISION of
// which excluded signals still count toward completeness (missing/
// provider_error do; not_applicable/not_implemented don't, since they
// were never a real gap to begin with — see signal.ts's SignalState doc
// comment) is made by the CALLER (a pillar composer, which has the full
// Signal and can inspect its state) by choosing whether to include a term
// at all. This function never sees "why" a value is null, only that it
// is — which is exactly what keeps it reusable for both aggregation
// levels without any pillar-specific logic leaking in here.

export interface WeightedTerm {
  key: string;
  /** null = excluded from the numerator (works uniformly for "missing," "provider_error," or a pillar with zero present signals). */
  value: number | null;
  weight: number;
}

export interface AdaptiveAverageResult {
  /** null iff zero terms were included (i.e. every term's value was null, or the list was empty). */
  value: number | null;
  /** 0-100: (sum of weights of terms with a non-null value) / (sum of weights of ALL terms passed in) * 100. 0 when no terms were passed in at all. */
  completenessPercent: number;
}

export function adaptiveWeightedAverage(terms: WeightedTerm[]): AdaptiveAverageResult {
  const totalWeight = terms.reduce((sum, t) => sum + t.weight, 0);
  if (totalWeight <= 0) {
    return { value: null, completenessPercent: 0 };
  }

  const present = terms.filter((t) => t.value !== null);
  const includedWeight = present.reduce((sum, t) => sum + t.weight, 0);
  const completenessPercent = Math.round((includedWeight / totalWeight) * 10_000) / 100;

  if (includedWeight <= 0) {
    return { value: null, completenessPercent };
  }

  const weightedSum = present.reduce((sum, t) => sum + (t.value as number) * t.weight, 0);
  const value = Math.round((weightedSum / includedWeight) * 100) / 100;

  return { value, completenessPercent };
}
