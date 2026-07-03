// Data source for useHome(). Real sections from GET /api/home:
//   weeklyPicks    — WeeklyPickDto[], mapped via mapWeeklyPickToCardProps
//   newFunding     — NewFundingDto[], mapped via mapNewFundingToCardProps (→ recentFundraises)
//   topFunds       — TopFundDto[], stored in HomeData.topFunds (no Home UI section yet)
//   unlockAlerts   — UnlockAlertDto[], mapped via mapUnlockAlertToCardProps
//
// Synthetic signals absent from the DB (fundingQuality, unlockRiskLevel)
// are left out — cards render "—" when absent, consistent with every
// other nullable field in this codebase.
//
// Still mock (no backend DTO at all per DECISION_LOG.md R-10/R-11/R-12):
//   marketOverview, fearGreed, trendingProjects/Funds/Platforms,
//   topGainers, recentlyAdded
//
// watchlistSummary was removed from HomeData: it is device-local state
// owned by the Zustand watchlist store and must never come from an API
// or be populated with mock data — the home page reads it directly from
// useWatchlistEntities() instead.
import type {
  MarketOverviewCardProps,
  FearGreedCardProps,
  TrendingItem,
  WeeklyPickCardProps,
  TopGainerCardProps,
  RecentFundraiseCardProps,
  UnlockAlertCardProps,
  RecentlyAddedCardProps,
} from "@/components/features/home";
import {
  mockFearGreed,
  mockMarketOverview,
  mockRecentlyAdded,
  mockTopGainers,
  mockTrendingFunds,
  mockTrendingPlatforms,
  mockTrendingProjects,
} from "@/components/features/home/mock-data";
import { apiFetch } from "../client";
import type { MonthlyPickDto, NewFundingDto, TopFundDto, UnlockAlertDto, WeeklyPickDto } from "../dto";

export interface HomeData {
  marketOverview: MarketOverviewCardProps;
  fearGreed: FearGreedCardProps;
  trendingProjects: TrendingItem[];
  trendingFunds: TrendingItem[];
  trendingPlatforms: TrendingItem[];
  weeklyPicks: WeeklyPickCardProps[];
  monthlyPicks: WeeklyPickCardProps[];
  topGainers: TopGainerCardProps[];
  recentlyAdded: RecentlyAddedCardProps[];
  recentFundraises: RecentFundraiseCardProps[];
  unlockAlerts: UnlockAlertCardProps[];
  /**
   * Real GET /api/home `topFunds` data — wired this phase but not yet
   * rendered anywhere (no "Top Funds" section exists on Home today). Kept
   * here so the data layer reflects the real backend shape ahead of a
   * future UI section, same pattern already used for other
   * built-ahead-of-UI plumbing in this codebase (e.g. favorites-store).
   */
  topFunds: TopFundDto[];
}

/** Full envelope returned by GET /api/home. */
interface RealHomeSections {
  weeklyPicks: WeeklyPickDto[];
  monthlyPicks: MonthlyPickDto[];
  topFunds: TopFundDto[];
  newFunding: NewFundingDto[];
  unlockAlerts: UnlockAlertDto[];
}

/** `RecentFundraiseCardProps.announcedLabel` is explicitly "the caller's concern" per that component's own doc comment — this is presentation date-math, not invented business data. */
function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function mapNewFundingToCardProps(item: NewFundingDto): RecentFundraiseCardProps {
  return {
    slug: item.slug,
    name: item.name,
    logoUrl: item.logoUrl,
    amountUsd: item.amountRaisedUsd,
    roundType: item.roundType,
    announcedLabel: formatRelativeDate(item.announcedDate),
    investorNames: item.investorNames,
  };
}

/** `UnlockAlertCardProps.dateLabel` is presentation date formatting — the caller's concern, not invented business data. Uses UTC to match how the DB stores dates. */
function formatUnlockDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function mapUnlockAlertToCardProps(item: UnlockAlertDto): UnlockAlertCardProps {
  return {
    slug: item.slug,
    name: item.name,
    logoUrl: item.logoUrl,
    dateLabel: formatUnlockDate(item.unlockDate),
    percentOfSupply: item.percentOfSupply,
  };
}

/**
 * Maps a ranked project from the weekly picks endpoint to card props.
 * Returns null when totalScore or grade is absent (un-scored project) —
 * dropping the card is the honest choice; showing 0 would fabricate a value.
 * fundingQuality/unlockRiskLevel/unlockRiskLabel are intentionally absent:
 * the card now renders "—" for those rows rather than requiring mock data.
 */
function mapWeeklyPickToCardProps(pick: WeeklyPickDto): WeeklyPickCardProps | null {
  if (pick.totalScore === null || pick.grade === null) return null;
  return {
    rank: pick.rank,
    slug: pick.slug,
    name: pick.name,
    logoUrl: pick.logoUrl,
    score: pick.totalScore,
    grade: pick.grade,
    tvlChangePercent: pick.tvlChangePercent,
  };
}

/** Same mapping as mapWeeklyPickToCardProps — MonthlyPickDto has the same card-relevant fields. */
function mapMonthlyPickToCardProps(pick: MonthlyPickDto): WeeklyPickCardProps | null {
  if (pick.totalScore === null || pick.grade === null) return null;
  return {
    rank: pick.rank,
    slug: pick.slug,
    name: pick.name,
    logoUrl: pick.logoUrl,
    score: pick.totalScore,
    grade: pick.grade,
    tvlChangePercent: pick.tvlChangePercent,
  };
}

// Throws on failure — callers must handle errors. Previously caught and
// returned null so the page could silently fall back to mock data, but
// silently rendering stale mock data on a backend failure masks the outage
// from users. Now the error propagates through useQuery to the page, which
// renders ErrorState + Retry instead.
async function fetchRealHomeSections(signal?: AbortSignal): Promise<RealHomeSections> {
  return await apiFetch<RealHomeSections>("/api/home", { signal });
}

export async function fetchHomeData(signal?: AbortSignal): Promise<HomeData> {
  const real = await fetchRealHomeSections(signal);

  return {
    marketOverview: mockMarketOverview,
    fearGreed: mockFearGreed,
    trendingProjects: mockTrendingProjects,
    trendingFunds: mockTrendingFunds,
    trendingPlatforms: mockTrendingPlatforms,
    weeklyPicks: real.weeklyPicks
      .map(mapWeeklyPickToCardProps)
      .filter((p): p is WeeklyPickCardProps => p !== null),
    monthlyPicks: real.monthlyPicks
      .map(mapMonthlyPickToCardProps)
      .filter((p): p is WeeklyPickCardProps => p !== null),
    topGainers: mockTopGainers,
    recentlyAdded: mockRecentlyAdded,
    recentFundraises: real.newFunding.map(mapNewFundingToCardProps),
    unlockAlerts: real.unlockAlerts.map(mapUnlockAlertToCardProps),
    topFunds: real.topFunds,
  };
}
