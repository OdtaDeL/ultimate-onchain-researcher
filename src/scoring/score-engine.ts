// The top-level orchestrator — and the only file in this folder, besides
// weighted-score.ts, that sees more than one score at a time. Still 100%
// pure: no Supabase import, no provider import, no I/O. Assembling a
// ScoreEngineInput from real database rows is a future scoring sync
// job's job, not this one's — see DEVELOPER_GUIDE.md-equivalent note:
// src/scoring/ stays independent of providers AND of infrastructure in
// general, by design.
//
// Each of the 7 component scores is computed independently from raw
// input facts (calculateFundingScore, calculateInvestorScore, etc. never
// see each other's output) — only calculateWeightedScore combines them,
// exactly matching this folder's design principle.

import { calculateFundingScore } from "./funding-score";
import { calculateInvestorScore } from "./investor-score";
import { calculateMarketScore } from "./market-score";
import { calculateTvlScore } from "./tvl-score";
import { calculateRevenueScore } from "./revenue-score";
import { calculateUnlockScore } from "./unlock-score";
import { calculateMomentumScore } from "./momentum-score";
import { calculateWeightedScore } from "./weighted-score";
import { DEFAULT_SCORING_CONFIG, gradeFromScore, type ScoringConfig } from "./config";
import type {
  ScoreBreakdown,
  ScoreEngineInput,
  ScoreEngineResult,
  ScoreExplanation,
} from "./types";

export function calculateScoreBreakdown(
  input: ScoreEngineInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): ScoreBreakdown {
  return {
    funding: calculateFundingScore(input.funding, config.funding),
    investor: calculateInvestorScore(input.investor, config.investor),
    market: calculateMarketScore(input.market, config.market),
    tvl: calculateTvlScore(input.tvl, config.tvl),
    revenue: calculateRevenueScore(input.revenue, config.revenue),
    unlock: calculateUnlockScore(input.unlock, config.unlock),
    momentum: calculateMomentumScore(input.momentum, config.momentum),
  };
}

// ---------------------------------------------------------------------
// Explanation — plain phrases derived strictly from already-computed
// scores/inputs, for a future AI Summary feature to consume (see
// types.ts ScoreExplanation). No scoring logic lives here.
// ---------------------------------------------------------------------

function tierPhrase(score: number, high: string, mid: string, low: string): string {
  if (score >= 70) return high;
  if (score >= 40) return mid;
  return low;
}

function explainFunding(score: number): string {
  return tierPhrase(
    score,
    "Strong institutional backing.",
    "Moderate funding history.",
    "Limited or early-stage funding.",
  );
}

function explainInvestor(score: number): string {
  return tierPhrase(
    score,
    "Backed by high-quality, diversified investors.",
    "Backed by a moderate-quality investor syndicate.",
    "Weak or undiversified investor backing.",
  );
}

function explainMarket(score: number): string {
  return tierPhrase(
    score,
    "Healthy market capitalization and trading activity.",
    "Average market size and liquidity.",
    "Small market cap with limited liquidity.",
  );
}

function explainTvl(score: number): string {
  return tierPhrase(score, "High TVL growth.", "Stable TVL.", "Low or declining TVL.");
}

function explainRevenue(score: number): string {
  return tierPhrase(
    score,
    "Strong, growing protocol revenue.",
    "Moderate protocol revenue.",
    "Little to no protocol revenue.",
  );
}

function explainUnlock(score: number): string {
  // Inverted naming on purpose — see unlock-score.ts: this score is a
  // safety score, so a HIGH score means LOW unlock risk.
  return tierPhrase(
    score,
    "Low unlock risk.",
    "Moderate unlock risk in the near term.",
    "High unlock risk — a large or imminent unlock is scheduled.",
  );
}

function explainMomentum(score: number): string {
  return tierPhrase(
    score,
    "Strong recent momentum across funding, price, and TVL.",
    "Average market momentum.",
    "Weak or negative recent momentum.",
  );
}

function buildExplanation(breakdown: ScoreBreakdown): ScoreExplanation {
  const funding = explainFunding(breakdown.funding);
  const investor = explainInvestor(breakdown.investor);
  const market = explainMarket(breakdown.market);
  const tvl = explainTvl(breakdown.tvl);
  const revenue = explainRevenue(breakdown.revenue);
  const unlock = explainUnlock(breakdown.unlock);
  const momentum = explainMomentum(breakdown.momentum);

  // Highlights: the 3 most notable components (highest-magnitude
  // distance from a neutral 50), most notable first — a short summary
  // reel rather than repeating all 7 phrases.
  const entries: { phrase: string; distanceFromNeutral: number }[] = [
    { phrase: funding, distanceFromNeutral: Math.abs(breakdown.funding - 50) },
    { phrase: investor, distanceFromNeutral: Math.abs(breakdown.investor - 50) },
    { phrase: market, distanceFromNeutral: Math.abs(breakdown.market - 50) },
    { phrase: tvl, distanceFromNeutral: Math.abs(breakdown.tvl - 50) },
    { phrase: revenue, distanceFromNeutral: Math.abs(breakdown.revenue - 50) },
    { phrase: unlock, distanceFromNeutral: Math.abs(breakdown.unlock - 50) },
    { phrase: momentum, distanceFromNeutral: Math.abs(breakdown.momentum - 50) },
  ];
  const highlights = entries
    .sort((a, b) => b.distanceFromNeutral - a.distanceFromNeutral)
    .slice(0, 3)
    .map((e) => e.phrase);

  return { funding, investor, market, tvl, revenue, unlock, momentum, highlights };
}

/**
 * Runs the full scoring pipeline: 7 independent component scores ->
 * weighted overall score -> grade -> structured explanation.
 * Deterministic: identical input + config always produces an identical
 * result, with no I/O or hidden state anywhere in the call graph.
 */
export function runScoreEngine(
  input: ScoreEngineInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): ScoreEngineResult {
  const scoreBreakdown = calculateScoreBreakdown(input, config);
  const overallScore = calculateWeightedScore(scoreBreakdown, config.weights);
  const grade = gradeFromScore(overallScore, config.grade);
  const explanation = buildExplanation(scoreBreakdown);

  return { overallScore, grade, scoreBreakdown, explanation };
}
