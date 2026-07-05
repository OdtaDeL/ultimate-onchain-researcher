// Mock data for the Markets screen — display-shaped, matching each row
// card's own Props type, never a backend DTO.
// mockMarketsPlatforms is imported by search.ts (no platforms API yet).
// mockMarketsProjects and mockMarketsFunds are dead exports — replaced by
// real API data in D-033 and D-034; nothing imports them.
import type { ProjectRowCardProps } from "./project-row-card";
import type { FundRowCardProps } from "./fund-row-card";
import type { PlatformRowCardProps } from "./platform-row-card";

export const mockMarketsProjects: Omit<ProjectRowCardProps, "isLoading" | "onPress">[] = [
  { name: "Celestia", score: 82, grade: "A", tvl: 412_000_000, marketCap: 1_900_000_000, changePercent24h: 8.2, fundingStage: "Series A" },
  { name: "EigenLayer", score: 71, grade: "B", tvl: 9_800_000_000, marketCap: 3_100_000_000, changePercent24h: 4.1, fundingStage: "Series A" },
  { name: "Manta Network", score: 64, grade: "B", tvl: 88_000_000, marketCap: 410_000_000, changePercent24h: -2.6, fundingStage: "Seed" },
  { name: "Berachain", score: 58, grade: "C", tvl: 1_200_000_000, marketCap: 720_000_000, changePercent24h: 1.4, fundingStage: "Series B" },
  { name: "Wormhole", score: 76, grade: "A", tvl: 0, marketCap: 2_400_000_000, changePercent24h: -0.8, fundingStage: "Public" },
];

export const mockMarketsFunds: Omit<FundRowCardProps, "isLoading" | "onPress">[] = [
  { name: "a16z Crypto", portfolioProjectCount: 12, recentInvestmentCount: 3 },
  { name: "Paradigm", portfolioProjectCount: 8, recentInvestmentCount: 2 },
  { name: "Polychain Capital", portfolioProjectCount: 15, recentInvestmentCount: 1 },
];

export const mockMarketsPlatforms: Omit<PlatformRowCardProps, "isLoading" | "onPress">[] = [
  { protocol: "Ethereum", tvl: 58_000_000_000, revenue: 2_100_000, fees: 5_400_000 },
  { protocol: "Solana", tvl: 6_200_000_000, revenue: 980_000, fees: 1_200_000 },
  { protocol: "Arbitrum", tvl: 3_400_000_000, revenue: 410_000, fees: 690_000 },
];
