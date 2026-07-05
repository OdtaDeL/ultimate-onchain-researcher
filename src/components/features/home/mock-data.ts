// Mock data for Home feature components — display-shaped, matching each
// component's own prop types (not any backend DTO).
//
// Live exports (imported by src/lib/api/sources/home.ts; no backend DTO yet):
//   mockMarketOverview, mockFearGreed
//
// Dead exports (nothing imports them; replaced by real API data):
//   mockWeeklyPicks    — replaced by /api/home weeklyPicks in D-029
//   mockRecentFundraises — replaced by /api/home newFunding in D-022
//   mockUnlockAlerts   — replaced by /api/home unlockAlerts in D-031
//   mockWatchlistSummary — removed from HomeData in D-020 (reads Zustand store)
import type { MarketOverviewCardProps } from "./market-overview-card";
import type { FearGreedCardProps } from "./fear-greed-card";
import type { TrendingItem } from "./trending-section";
import type { WeeklyPickCardProps } from "./weekly-pick-card";
import type { TopGainerCardProps } from "./top-gainer-card";
import type { RecentFundraiseCardProps } from "./recent-fundraise-card";
import type { UnlockAlertCardProps } from "./unlock-alert-card";
import type { RecentlyAddedCardProps } from "./recently-added-card";
import type { WatchlistSummaryCardProps } from "./watchlist-summary-card";

export const mockMarketOverview: MarketOverviewCardProps = {
  assets: [
    { symbol: "BTC", price: 67420, changePercent24h: 1.2 },
    { symbol: "ETH", price: 3610, changePercent24h: -0.4 },
    { symbol: "BNB", price: 580, changePercent24h: 0.8 },
  ],
  totalMarketCap: 2_340_000_000_000,
  totalMarketCapChangePercent24h: 0.9,
};

export const mockFearGreed: FearGreedCardProps = {
  value: 62,
  asOfLabel: "Updated today",
};

export const mockTrendingProjects: TrendingItem[] = [
  { id: "celestia", name: "Celestia", metricLabel: "Score 82", changePercent: 8.2 },
  { id: "eigenlayer", name: "EigenLayer", metricLabel: "Score 71", changePercent: 4.1 },
  { id: "monad", name: "Monad", metricLabel: "Score 65", changePercent: 3.0 },
];

export const mockTrendingFunds: TrendingItem[] = [
  { id: "a16z", name: "a16z Crypto", metricLabel: "12 projects" },
  { id: "paradigm", name: "Paradigm", metricLabel: "8 projects" },
  { id: "pantera", name: "Pantera Capital", metricLabel: "21 projects" },
];

export const mockWeeklyPicks: WeeklyPickCardProps[] = [
  {
    rank: 1,
    name: "Celestia",
    score: 78,
    grade: "A+",
    fundingQuality: "strong",
    tvlChangePercent: 12,
    unlockRiskLevel: "moderate",
    unlockRiskLabel: "14 days",
  },
  {
    rank: 2,
    name: "EigenLayer",
    score: 71,
    grade: "B",
    fundingQuality: "moderate",
    tvlChangePercent: -3,
    unlockRiskLevel: "low",
    unlockRiskLabel: "Low risk",
  },
];

export const mockTopGainers: TopGainerCardProps[] = [
  { rank: 1, name: "Project A", changePercent: 28.4 },
  { rank: 2, name: "Project B", changePercent: 19.1 },
  { rank: 3, name: "Project C", changePercent: 14.7 },
  { rank: 4, name: "Project D", changePercent: 11.2 },
  { rank: 5, name: "Project E", changePercent: 8.8 },
];

export const mockRecentFundraises: RecentFundraiseCardProps[] = [
  { name: "Project A", amountUsd: 25_000_000, roundType: "Seed", announcedLabel: "2d ago", investorNames: ["a16z Crypto", "Paradigm"] },
  { name: "Project B", amountUsd: 10_000_000, roundType: "Series A", announcedLabel: "4d ago", investorNames: ["Pantera Capital"] },
  { name: "Project C", amountUsd: 50_000_000, roundType: "Series B", announcedLabel: "6d ago", investorNames: ["a16z Crypto", "Coinbase Ventures", "Multicoin Capital"] },
];

export const mockUnlockAlerts: UnlockAlertCardProps[] = [
  { name: "Project A", dateLabel: "Jul 2", percentOfSupply: 1.2, riskLevel: "high" },
  { name: "Project B", dateLabel: "Jul 5", percentOfSupply: 0.8, riskLevel: "low" },
  { name: "Project C", dateLabel: "Jul 9", percentOfSupply: 2.1, riskLevel: "moderate" },
];

export const mockRecentlyAdded: RecentlyAddedCardProps[] = [
  { name: "Monad", category: "L2 Network", addedLabel: "1d ago" },
  { name: "Initia", category: "Infrastructure", addedLabel: "3d ago" },
  { name: "Story Protocol", category: "IP Protocol", addedLabel: "5d ago" },
];

export const mockWatchlistSummary: WatchlistSummaryCardProps[] = [
  { kind: "project", name: "Ethereum", score: 82, grade: "A+", price: 3610, changePercent24h: -0.4, hasAlert: true },
  { kind: "project", name: "Aave", score: 65, grade: "B", price: 190, changePercent24h: 1.2 },
  { kind: "fund", name: "a16z Crypto", portfolioProjectCount: 12 },
];
