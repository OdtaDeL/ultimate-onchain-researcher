// Investor Score — pure function of the investor syndicate's
// composition only. Never reads any other score's output.

import { clampScore, interpolateCurve, DEFAULT_SCORING_CONFIG, type InvestorScoreConfig } from "./config";
import type { InvestorScoreInput } from "./types";

function tierScore(tier: InvestorScoreInput["investors"][number]["tier"], config: InvestorScoreConfig): number {
  if (tier === "tier_1") return config.tierScores.tier_1;
  if (tier === "tier_2") return config.tierScores.tier_2;
  if (tier === "tier_3") return config.tierScores.tier_3;
  return config.tierScores.untiered;
}

export function calculateInvestorScore(
  input: InvestorScoreInput,
  config: InvestorScoreConfig = DEFAULT_SCORING_CONFIG.investor,
): number {
  const { investors } = input;

  if (investors.length === 0) {
    return clampScore(0);
  }

  const avgTierScore =
    investors.reduce((sum, inv) => sum + tierScore(inv.tier, config), 0) / investors.length;

  const avgRoundsParticipated =
    investors.reduce((sum, inv) => sum + Math.max(1, inv.roundsParticipated), 0) / investors.length;
  const repeatScore = interpolateCurve(config.repeatParticipationCurve, avgRoundsParticipated);

  const hasLead = investors.some((inv) => inv.isLead);
  const leadScore = hasLead ? config.leadPresentScore : config.leadAbsentScore;

  const uniqueFundCount = new Set(investors.map((inv) => inv.fundId)).size;
  const diversityScore = interpolateCurve(config.fundDiversityCurve, uniqueFundCount);

  const { tierQuality, repeatParticipation, leadPresence, fundDiversity } = config.subWeights;
  const combined =
    avgTierScore * tierQuality +
    repeatScore * repeatParticipation +
    leadScore * leadPresence +
    diversityScore * fundDiversity;

  return clampScore(combined);
}
