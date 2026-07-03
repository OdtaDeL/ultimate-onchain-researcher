// Mock data for the Project Detail screen — one illustrative project
// (Celestia), display-shaped to match each consuming component's own Props
// type. Not re-exported from index.ts, same isolation convention as every
// other feature's mock-data.
import type { ScoreGrade, RiskLevel } from "@/components/features/home";
import type { TrendingItem } from "@/components/features/home";
import type { FundingRoundRowProps } from "./funding-round-row";

export const mockProject = {
  name: "Celestia",
  logoUrl: null as string | null,
  category: "Modular Blockchain",
  chain: "Celestia",
  score: 82,
  grade: "A" as ScoreGrade,
  marketCap: 1_900_000_000,
  fdv: 2_600_000_000,
  tvl: 412_000_000,
  changePercent24h: 8.2,
  circulatingSupply: 150_000_000,
  totalSupply: 1_000_000_000,
  athPrice: 21.2,
  atlPrice: 1.85,
  volume24h: 88_000_000,
};

export interface ScoreCategory {
  key: string;
  label: string;
  score: number;
}

export const mockScoreCategories: ScoreCategory[] = [
  { key: "market", label: "Market", score: 78 },
  { key: "funding", label: "Funding", score: 88 },
  { key: "investor", label: "Investor", score: 91 },
  { key: "unlock", label: "Unlock", score: 64 },
  { key: "community", label: "Community", score: 73 },
  { key: "technology", label: "Technology", score: 85 },
  { key: "overall", label: "Overall", score: 82 },
];

export const mockFundingRounds: Omit<FundingRoundRowProps, "isLoading" | "isLast">[] = [
  { round: "Series A", dateLabel: "Mar 2024", amountUsd: 55_000_000, leadInvestor: "Bain Capital Crypto", otherInvestorsSummary: "Polychain, 1kx +4 more" },
  { round: "Seed", dateLabel: "Sep 2021", amountUsd: 1_500_000, leadInvestor: "Galileo Capital", otherInvestorsSummary: null },
];

export const mockNextUnlock = {
  dateLabel: "Jul 14",
  percentOfSupply: 4.2,
  riskLevel: "moderate" as RiskLevel,
};

export const mockRelatedProjects: TrendingItem[] = [
  { id: "eigenlayer", name: "EigenLayer", metricLabel: "Score 71", changePercent: 4.1 },
  { id: "manta", name: "Manta Network", metricLabel: "Score 64", changePercent: -2.6 },
  { id: "wormhole", name: "Wormhole", metricLabel: "Score 76", changePercent: -0.8 },
];
