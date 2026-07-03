// Mock data for the Fund Detail screen — one illustrative fund (Paradigm),
// display-shaped to match each consuming component's own Props type. Not
// re-exported from index.ts, same isolation convention as every other
// feature's mock-data.
import type { InvestmentRowProps } from "./investment-row";

export type FundActivityStatus = "active" | "inactive";

export const mockFund = {
  name: "Paradigm",
  logoUrl: null as string | null,
  website: "paradigm.xyz",
  twitterHandle: "@paradigm",
  portfolioSize: 8,
  activeInvestments: 6,
  leadInvestments: 3,
  lastInvestmentLabel: "2 weeks ago",
  activityStatus: "active" as FundActivityStatus,
};

export const mockTopSectors: string[] = ["DeFi", "Infra", "L1", "AI"];

export const mockTopChains: string[] = ["Ethereum", "Solana", "Base"];

export interface FundInsight {
  key: string;
  label: string;
  value: string;
}

export const mockFundInsights: FundInsight[] = [
  { key: "most-active", label: "Most active this month", value: "3 deals" },
  { key: "largest", label: "Largest investment", value: "$55M" },
  { key: "favorite-sector", label: "Favorite sector", value: "DeFi" },
  { key: "average-stage", label: "Average stage", value: "Series A" },
];

export const mockPortfolio: Omit<InvestmentRowProps, "isLoading" | "onPress" | "variant" | "isLast">[] = [
  { projectName: "Celestia", round: "Series A", dateLabel: "Mar 2024", amountUsd: 55_000_000 },
  { projectName: "EigenLayer", round: "Series A", dateLabel: "Feb 2024", amountUsd: 30_000_000 },
  { projectName: "Manta Network", round: "Seed", dateLabel: "Nov 2023", amountUsd: 6_000_000 },
  { projectName: "Berachain", round: "Series B", dateLabel: "Jun 2023", amountUsd: 42_000_000 },
  { projectName: "Wormhole", round: "Strategic", dateLabel: "Jan 2023" },
];

export const mockRecentInvestments: Omit<InvestmentRowProps, "isLoading" | "onPress" | "variant" | "isLast">[] = [
  { projectName: "Celestia", round: "Series A", dateLabel: "Mar 2024", amountUsd: 55_000_000 },
  { projectName: "EigenLayer", round: "Series A", dateLabel: "Feb 2024", amountUsd: 30_000_000 },
  { projectName: "Manta Network", round: "Seed", dateLabel: "Nov 2023", amountUsd: 6_000_000 },
];
