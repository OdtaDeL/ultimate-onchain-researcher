// Data source for useHome(). Real sections from GET /api/home:
//   weeklyPicks    — WeeklyPickDto[], mapped via mapWeeklyPickToCardProps
//                    also mapped via mapWeeklyPickToTrendingItem → trendingProjects
//   monthlyPicks   — MonthlyPickDto[], mapped via mapMonthlyPickToCardProps
//   topFunds       — TopFundDto[], stored in HomeData.topFunds
//                    also mapped via mapTopFundToTrendingItem → trendingFunds
//   topGainers     — TopGainerDto[], mapped via mapTopGainerToCardProps
//   recentlyAdded  — RecentlyAddedDto[], mapped via mapRecentlyAddedToCardProps
//   newFunding     — NewFundingDto[], mapped via mapNewFundingToCardProps (→ recentFundraises)
//   unlockAlerts   — UnlockAlertDto[], mapped via mapUnlockAlertToCardProps
//   marketOverview — MarketOverviewDto | null; falls back to mockMarketOverview when null
//
// Synthetic signals absent from the DB (fundingQuality, unlockRiskLevel)
// are left out — cards render "—" when absent, consistent with every
// other nullable field in this codebase.
//
// fearGreed — now real via GET /api/fear-greed (Alternative.me), cached 1h.
//   Falls back to mockFearGreed if the request fails so a transient outage
//   at Alternative.me doesn't break the home page.
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
} from "@/components/features/home/mock-data";
import { apiFetch } from "../client";
import type { MarketOverviewDto, MonthlyPickDto, NewFundingDto, RecentlyAddedDto, TopFundDto, TopGainerDto, UnlockAlertDto, WeeklyPickDto } from "../dto";

export interface HomeData {
  marketOverview: MarketOverviewCardProps;
  fearGreed: FearGreedCardProps;
  trendingProjects: TrendingItem[];
  trendingFunds: TrendingItem[];
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
  topGainers: TopGainerDto[];
  recentlyAdded: RecentlyAddedDto[];
  newFunding: NewFundingDto[];
  unlockAlerts: UnlockAlertDto[];
  marketOverview: MarketOverviewDto | null;
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

function mapWeeklyPickToTrendingItem(pick: WeeklyPickDto): TrendingItem {
  return {
    id: pick.slug,
    name: pick.name,
    logoUrl: pick.logoUrl,
    metricLabel: pick.totalScore !== null ? `Score ${Math.round(pick.totalScore)}` : undefined,
    changePercent: pick.priceChange24hPercent ?? undefined,
  };
}

function mapTopGainerToCardProps(item: TopGainerDto, index: number): TopGainerCardProps {
  return {
    rank: index + 1,
    name: item.name,
    logoUrl: item.logoUrl,
    changePercent: item.priceChange24hPercent,
  };
}

function mapRecentlyAddedToCardProps(item: RecentlyAddedDto): RecentlyAddedCardProps {
  return {
    name: item.name,
    logoUrl: item.logoUrl,
    category: item.category,
    addedLabel: formatRelativeDate(item.createdAt),
  };
}

function mapMarketOverviewToCardProps(dto: MarketOverviewDto): MarketOverviewCardProps {
  return {
    assets: dto.assets.map((a) => ({
      symbol: a.symbol,
      logoUrl: a.logoUrl,
      price: a.priceUsd,
      changePercent24h: a.changePercent24h,
    })),
    totalMarketCap: dto.totalMarketCapUsd,
    totalMarketCapChangePercent24h: dto.totalMarketCapChangePercent24h,
  };
}

function mapTopFundToTrendingItem(fund: TopFundDto): TrendingItem {
  return {
    id: fund.slug,
    name: fund.name,
    logoUrl: fund.logoUrl,
    metricLabel: `${fund.portfolioProjectCount} projects`,
  };
}

/** Shape returned by GET /api/fear-greed. */
interface FearGreedResponseData {
  value: number;
  classification: string;
  updatedAt: number; // Unix seconds
}

function formatFearGreedLabel(unixSeconds: number): string {
  const diffDays = Math.floor((Date.now() - unixSeconds * 1000) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  return `Updated ${diffDays}d ago`;
}

function mapFearGreedToCardProps(data: FearGreedResponseData): FearGreedCardProps {
  return {
    value: data.value,
    asOfLabel: formatFearGreedLabel(data.updatedAt),
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
  const [real, fearGreedRaw] = await Promise.all([
    fetchRealHomeSections(signal),
    apiFetch<FearGreedResponseData>("/api/fear-greed", { signal }).catch(() => null),
  ]);

  return {
    marketOverview: real.marketOverview ? mapMarketOverviewToCardProps(real.marketOverview) : mockMarketOverview,
    fearGreed: fearGreedRaw ? mapFearGreedToCardProps(fearGreedRaw) : mockFearGreed,
    trendingProjects: real.weeklyPicks.map(mapWeeklyPickToTrendingItem),
    trendingFunds: real.topFunds.map(mapTopFundToTrendingItem),
    weeklyPicks: real.weeklyPicks
      .map(mapWeeklyPickToCardProps)
      .filter((p): p is WeeklyPickCardProps => p !== null),
    monthlyPicks: real.monthlyPicks
      .map(mapMonthlyPickToCardProps)
      .filter((p): p is WeeklyPickCardProps => p !== null),
    topGainers: real.topGainers.map(mapTopGainerToCardProps),
    recentlyAdded: real.recentlyAdded.map(mapRecentlyAddedToCardProps),
    recentFundraises: real.newFunding.map(mapNewFundingToCardProps),
    unlockAlerts: real.unlockAlerts.map(mapUnlockAlertToCardProps),
    topFunds: real.topFunds,
  };
}
