// All tunable numeric constants for the scoring engine live here — every
// score module takes its config as a parameter (defaulting to
// DEFAULT_SCORING_CONFIG) rather than hardcoding thresholds inline. This
// is what makes "weights must be configurable" true for every score, not
// just the top-level weighted combination, and what makes the modules
// testable at exact boundary values without editing source.
//
// One-directional dependency: every score module imports types from
// here; this file imports nothing from them. Never the reverse — that
// would create an import cycle.

import type { Grade, ScoreWeights } from "./types";

/** A piecewise-linear curve: interpolated between consecutive points, clamped at the ends. */
export interface ScoreCurvePoint {
  /** The raw input value at which `score` applies. */
  at: number;
  score: number;
}

/**
 * Linear interpolation between the two curve points bracketing `value`.
 * Below the first point's `at`, returns the first point's score; above
 * the last, returns the last. Points must be sorted ascending by `at`.
 */
export function interpolateCurve(curve: ScoreCurvePoint[], value: number): number {
  if (curve.length === 0) return 0;
  if (value <= curve[0].at) return curve[0].score;
  const last = curve[curve.length - 1];
  if (value >= last.at) return last.score;

  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (value >= a.at && value <= b.at) {
      const t = (value - a.at) / (b.at - a.at);
      return a.score + t * (b.score - a.score);
    }
  }
  return last.score;
}

/** Clamps to [0, 100] and rounds to 2 decimal places — every score module's final return value goes through this. */
export function clampScore(value: number): number {
  const clamped = Math.max(0, Math.min(100, value));
  return Math.round(clamped * 100) / 100;
}

// ---------------------------------------------------------------------
// Funding Score
// ---------------------------------------------------------------------

export interface FundingScoreConfig {
  /** Sub-factor weights, must sum to 1. */
  subWeights: {
    amount: number;
    stage: number;
    recency: number;
    rounds: number;
    investors: number;
  };
  /** USD raised -> 0-100, log-scale: most of the signal is in order-of-magnitude, not exact dollars. */
  amountCurveUsd: ScoreCurvePoint[];
  stageScores: Record<string, number>;
  /** Days since last round -> 0-100, decaying. */
  recencyCurveDays: ScoreCurvePoint[];
  /** Round count -> 0-100, diminishing returns. */
  roundsCountCurve: ScoreCurvePoint[];
  /** Unique investor count -> 0-100, diminishing returns. */
  investorsCountCurve: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// Investor Score
// ---------------------------------------------------------------------

export interface InvestorScoreConfig {
  subWeights: {
    tierQuality: number;
    repeatParticipation: number;
    leadPresence: number;
    fundDiversity: number;
  };
  tierScores: { tier_1: number; tier_2: number; tier_3: number; untiered: number };
  /** Average rounds-participated-per-fund -> 0-100; rewards repeat backers, not first-time-only syndicates. */
  repeatParticipationCurve: ScoreCurvePoint[];
  /** Flat bonus score when at least one lead investor is present, vs. when none is. */
  leadPresentScore: number;
  leadAbsentScore: number;
  /** Unique fund count -> 0-100, diminishing returns. */
  fundDiversityCurve: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// Market Score
// ---------------------------------------------------------------------

export interface MarketScoreConfig {
  subWeights: {
    marketCap: number;
    fdvRatio: number;
    volume: number;
    liquidity: number;
    priceTrend: number;
  };
  marketCapCurveUsd: ScoreCurvePoint[];
  /** FDV / market cap ratio -> 0-100. A ratio near 1 (little future dilution) scores highest; a very high ratio (most supply still locked/unissued) scores low. */
  fdvRatioCurve: ScoreCurvePoint[];
  volumeCurveUsd: ScoreCurvePoint[];
  /** 24h volume / market cap (turnover) -> 0-100, the liquidity proxy — see market-score.ts. */
  turnoverCurve: ScoreCurvePoint[];
  /** Blended 24h/7d/30d price change weights, must sum to 1. */
  priceTrendWeights: { d1: number; d7: number; d30: number };
  /** Percent change -> 0-100, centered at 0% = 50. */
  priceChangeCurve: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// TVL Score
// ---------------------------------------------------------------------

export interface TvlScoreConfig {
  subWeights: {
    tvl: number;
    growth: number;
    chainDiversity: number;
  };
  tvlCurveUsd: ScoreCurvePoint[];
  /** Blended 1d/7d TVL change weights, must sum to 1. */
  growthWeights: { d1: number; d7: number };
  tvlChangeCurve: ScoreCurvePoint[];
  /** Chain count -> 0-100, diminishing returns. */
  chainCountCurve: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// Revenue Score
// ---------------------------------------------------------------------

export interface RevenueScoreConfig {
  subWeights: {
    revenue: number;
    fees: number;
    trend: number;
  };
  revenueCurveUsd: ScoreCurvePoint[];
  feesCurveUsd: ScoreCurvePoint[];
  /** (revenue24h vs. revenue30d-daily-average) percent delta -> 0-100. */
  trendCurve: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// Unlock Score
// ---------------------------------------------------------------------

export interface UnlockScoreConfig {
  subWeights: {
    timing: number;
    magnitude: number;
    value: number;
  };
  /** Days until next unlock -> 0-100 SAFETY score (more days = safer = higher). */
  timingCurveDays: ScoreCurvePoint[];
  /** Percent of supply unlocking -> 0-100 SAFETY score (less % = safer = higher). */
  magnitudeCurvePercent: ScoreCurvePoint[];
  /** USD value unlocking -> 0-100 SAFETY score (less USD = safer = higher). */
  valueCurveUsd: ScoreCurvePoint[];
  /** Returned when there is no scheduled unlock at all — no risk to price in. */
  noUpcomingUnlockScore: number;
}

// ---------------------------------------------------------------------
// Momentum Score
// ---------------------------------------------------------------------

export interface MomentumScoreConfig {
  subWeights: {
    fundingRecency: number;
    priceMomentum: number;
    tvlMomentum: number;
    revenueMomentum: number;
  };
  fundingRecencyCurveDays: ScoreCurvePoint[];
  priceMomentumCurvePercent: ScoreCurvePoint[];
  tvlMomentumCurvePercent: ScoreCurvePoint[];
  revenueMomentumCurvePercent: ScoreCurvePoint[];
}

// ---------------------------------------------------------------------
// Grade thresholds
// ---------------------------------------------------------------------

export interface GradeThresholds {
  /** Minimum overall_score (inclusive) required for each grade, checked highest-first. */
  aPlus: number;
  a: number;
  b: number;
  c: number;
  // Below `c` is "D" — the spec's bottom grade has no separate floor.
}

export function gradeFromScore(score: number, thresholds: GradeThresholds): Grade {
  if (score >= thresholds.aPlus) return "A+";
  if (score >= thresholds.a) return "A";
  if (score >= thresholds.b) return "B";
  if (score >= thresholds.c) return "C";
  return "D";
}

// ---------------------------------------------------------------------
// Top-level config bundle + defaults
// ---------------------------------------------------------------------

export interface ScoringConfig {
  weights: ScoreWeights;
  grade: GradeThresholds;
  funding: FundingScoreConfig;
  investor: InvestorScoreConfig;
  market: MarketScoreConfig;
  tvl: TvlScoreConfig;
  revenue: RevenueScoreConfig;
  unlock: UnlockScoreConfig;
  momentum: MomentumScoreConfig;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  // Spec's default weights — funding 20, investor 20, market 20, tvl 15, revenue 10, unlock 5, momentum 10 (sums to 100).
  weights: {
    funding: 0.2,
    investor: 0.2,
    market: 0.2,
    tvl: 0.15,
    revenue: 0.1,
    unlock: 0.05,
    momentum: 0.1,
  },

  grade: { aPlus: 90, a: 80, b: 65, c: 50 },

  funding: {
    subWeights: { amount: 0.3, stage: 0.2, recency: 0.2, rounds: 0.15, investors: 0.15 },
    amountCurveUsd: [
      { at: 0, score: 0 },
      { at: 100_000, score: 20 },
      { at: 1_000_000, score: 40 },
      { at: 10_000_000, score: 60 },
      { at: 50_000_000, score: 80 },
      { at: 200_000_000, score: 100 },
    ],
    stageScores: {
      pre_seed: 30,
      seed: 45,
      private: 55,
      strategic: 60,
      series_a: 65,
      series_b: 75,
      series_c_plus: 90,
      ido: 50,
      unknown: 40,
    },
    recencyCurveDays: [
      { at: 0, score: 100 },
      { at: 90, score: 100 },
      { at: 365, score: 80 },
      { at: 730, score: 60 },
      { at: 1825, score: 40 },
      { at: 3650, score: 20 },
    ],
    roundsCountCurve: [
      { at: 0, score: 0 },
      { at: 1, score: 40 },
      { at: 2, score: 60 },
      { at: 3, score: 75 },
      { at: 4, score: 90 },
      { at: 6, score: 100 },
    ],
    investorsCountCurve: [
      { at: 0, score: 0 },
      { at: 1, score: 30 },
      { at: 3, score: 55 },
      { at: 5, score: 70 },
      { at: 10, score: 85 },
      { at: 20, score: 100 },
    ],
  },

  investor: {
    subWeights: { tierQuality: 0.4, repeatParticipation: 0.2, leadPresence: 0.2, fundDiversity: 0.2 },
    tierScores: { tier_1: 100, tier_2: 70, tier_3: 40, untiered: 20 },
    repeatParticipationCurve: [
      { at: 1, score: 30 },
      { at: 1.5, score: 60 },
      { at: 2, score: 80 },
      { at: 3, score: 100 },
    ],
    leadPresentScore: 100,
    leadAbsentScore: 30,
    fundDiversityCurve: [
      { at: 0, score: 0 },
      { at: 1, score: 30 },
      { at: 3, score: 55 },
      { at: 5, score: 75 },
      { at: 10, score: 100 },
    ],
  },

  market: {
    subWeights: { marketCap: 0.3, fdvRatio: 0.15, volume: 0.2, liquidity: 0.15, priceTrend: 0.2 },
    marketCapCurveUsd: [
      { at: 0, score: 0 },
      { at: 1_000_000, score: 15 },
      { at: 10_000_000, score: 35 },
      { at: 100_000_000, score: 60 },
      { at: 1_000_000_000, score: 85 },
      { at: 10_000_000_000, score: 100 },
    ],
    // ratio = fdv / marketCap. 1.0 (fully circulating) scores highest;
    // a high ratio (most supply still locked) scores low.
    fdvRatioCurve: [
      { at: 1, score: 100 },
      { at: 1.5, score: 80 },
      { at: 2, score: 60 },
      { at: 4, score: 35 },
      { at: 8, score: 15 },
      { at: 15, score: 0 },
    ],
    volumeCurveUsd: [
      { at: 0, score: 0 },
      { at: 100_000, score: 20 },
      { at: 1_000_000, score: 45 },
      { at: 10_000_000, score: 70 },
      { at: 100_000_000, score: 90 },
      { at: 500_000_000, score: 100 },
    ],
    // turnover = volume24h / marketCap. Healthy liquidity is a few
    // percent of market cap traded daily; extremely high turnover often
    // signals thin float / volatility rather than depth, so the curve
    // peaks and is not monotonic — handled directly by the curve shape.
    turnoverCurve: [
      { at: 0, score: 10 },
      { at: 0.01, score: 40 },
      { at: 0.05, score: 80 },
      { at: 0.15, score: 100 },
      { at: 0.5, score: 60 },
      { at: 1, score: 30 },
    ],
    priceTrendWeights: { d1: 0.5, d7: 0.3, d30: 0.2 },
    priceChangeCurve: [
      { at: -50, score: 0 },
      { at: -10, score: 35 },
      { at: 0, score: 50 },
      { at: 10, score: 65 },
      { at: 50, score: 100 },
    ],
  },

  tvl: {
    subWeights: { tvl: 0.5, growth: 0.35, chainDiversity: 0.15 },
    tvlCurveUsd: [
      { at: 0, score: 0 },
      { at: 1_000_000, score: 25 },
      { at: 10_000_000, score: 50 },
      { at: 100_000_000, score: 75 },
      { at: 1_000_000_000, score: 95 },
      { at: 10_000_000_000, score: 100 },
    ],
    growthWeights: { d1: 0.4, d7: 0.6 },
    tvlChangeCurve: [
      { at: -50, score: 0 },
      { at: -10, score: 35 },
      { at: 0, score: 50 },
      { at: 10, score: 70 },
      { at: 50, score: 100 },
    ],
    chainCountCurve: [
      { at: 1, score: 40 },
      { at: 2, score: 60 },
      { at: 4, score: 80 },
      { at: 8, score: 100 },
    ],
  },

  revenue: {
    subWeights: { revenue: 0.4, fees: 0.3, trend: 0.3 },
    revenueCurveUsd: [
      { at: 0, score: 0 },
      { at: 1_000, score: 20 },
      { at: 10_000, score: 40 },
      { at: 100_000, score: 65 },
      { at: 1_000_000, score: 90 },
      { at: 5_000_000, score: 100 },
    ],
    feesCurveUsd: [
      { at: 0, score: 0 },
      { at: 1_000, score: 20 },
      { at: 10_000, score: 40 },
      { at: 100_000, score: 65 },
      { at: 1_000_000, score: 90 },
      { at: 5_000_000, score: 100 },
    ],
    trendCurve: [
      { at: -50, score: 0 },
      { at: -10, score: 35 },
      { at: 0, score: 50 },
      { at: 10, score: 70 },
      { at: 50, score: 100 },
    ],
  },

  unlock: {
    subWeights: { timing: 0.4, magnitude: 0.35, value: 0.25 },
    timingCurveDays: [
      { at: 0, score: 0 },
      { at: 7, score: 20 },
      { at: 30, score: 50 },
      { at: 90, score: 80 },
      { at: 180, score: 100 },
    ],
    magnitudeCurvePercent: [
      { at: 0, score: 100 },
      { at: 1, score: 85 },
      { at: 5, score: 55 },
      { at: 10, score: 25 },
      { at: 20, score: 0 },
    ],
    valueCurveUsd: [
      { at: 0, score: 100 },
      { at: 1_000_000, score: 80 },
      { at: 10_000_000, score: 50 },
      { at: 50_000_000, score: 20 },
      { at: 200_000_000, score: 0 },
    ],
    noUpcomingUnlockScore: 100,
  },

  momentum: {
    subWeights: { fundingRecency: 0.25, priceMomentum: 0.3, tvlMomentum: 0.25, revenueMomentum: 0.2 },
    fundingRecencyCurveDays: [
      { at: 0, score: 100 },
      { at: 30, score: 90 },
      { at: 90, score: 70 },
      { at: 180, score: 50 },
      { at: 365, score: 30 },
      { at: 730, score: 10 },
    ],
    priceMomentumCurvePercent: [
      { at: -30, score: 0 },
      { at: -5, score: 35 },
      { at: 0, score: 50 },
      { at: 5, score: 65 },
      { at: 30, score: 100 },
    ],
    tvlMomentumCurvePercent: [
      { at: -20, score: 0 },
      { at: -5, score: 35 },
      { at: 0, score: 50 },
      { at: 5, score: 65 },
      { at: 20, score: 100 },
    ],
    revenueMomentumCurvePercent: [
      { at: -50, score: 0 },
      { at: -10, score: 35 },
      { at: 0, score: 50 },
      { at: 10, score: 70 },
      { at: 50, score: 100 },
    ],
  },
};
