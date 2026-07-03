// Data source for useFund(). Calls the real GET /api/funds/:slug endpoint
// so invalid slugs return a 404 (propagated as ApiClientError → ErrorState)
// instead of silently showing another fund's mock data.
//
// Fields without a backend source:
//   - fund.activeInvestments / fund.leadInvestments: schema has no
//     active/exited status and no is_lead flag. Both fields are absent.
//   - fund.activityStatus: no official recency threshold exists in this
//     codebase. Field is absent — the page omits the activity Pill.
//   - topChains: no chain/network tagging in the Dashboard Query Layer.
//     Stays [] so the "Top Chains" section renders its empty state.
//   - recentInvestments: derived as the 5 most recently announced portfolio
//     projects by announced_date descending (no separate "recent" endpoint).
import { apiFetch } from "../client";
import type { FundInsightsDto, FundOverviewDto, FundPortfolioDto } from "../dto";
import type { FundInsight } from "@/components/features/fund-detail";
import type { InvestmentRowProps } from "@/components/features/fund-detail";

interface FundApiResponse {
  overview: FundOverviewDto;
  portfolio: FundPortfolioDto;
  insights: FundInsightsDto | null;
}

type PortfolioItem = Omit<InvestmentRowProps, "isLoading" | "onPress" | "variant" | "isLast"> & {
  /** DB slug for navigation — falls back to toSlug(projectName) at the callsite when absent (backward-compat with any persisted state written before this field existed). */
  projectSlug?: string;
};

export interface FundData {
  fund: {
    /** Backend slug (e.g. "paradigm") — used for navigation so watchlist entries reach the correct URL even when the DB slug differs from toSlug(name). */
    slug: string;
    name: string;
    logoUrl: string | null;
    /** Null when the backend does not provide a website URL. */
    website: string | null;
    /** Null when the backend does not provide a Twitter handle. */
    twitterHandle: string | null;
    /** Null when backend does not provide a portfolio project count. */
    portfolioSize: number | null;
    lastInvestmentLabel: string;
  };
  topSectors: string[];
  topChains: string[];
  insights: FundInsight[];
  portfolio: PortfolioItem[];
  recentInvestments: PortfolioItem[];
}

function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function formatUsd(usd: number | null): string {
  if (usd === null) return "—";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}

function mapInsights(insights: FundInsightsDto | null): FundInsight[] {
  if (!insights) return [];
  return [
    { key: "most-active", label: "Active this month", value: `${insights.dealsThisMonthCount} deals` },
    { key: "largest", label: "Largest investment", value: formatUsd(insights.largestInvestmentUsd) },
    { key: "favorite-sector", label: "Favorite sector", value: insights.topCategories[0] ?? "—" },
    { key: "average-stage", label: "Most common stage", value: insights.mostCommonRoundType ?? "—" },
  ];
}

function mapPortfolioProject(p: {
  slug: string;
  name: string;
  logoUrl: string | null;
  roundType: string | null;
  announcedDate: string | null;
}): PortfolioItem {
  return {
    projectSlug: p.slug,
    projectName: p.name,
    projectLogoUrl: p.logoUrl,
    round: p.roundType ?? "Unknown",
    dateLabel: formatRelativeDate(p.announcedDate),
  };
}

export async function fetchFundData(slug: string, signal?: AbortSignal): Promise<FundData> {
  const { overview, portfolio, insights } = await apiFetch<FundApiResponse>(
    `/api/funds/${encodeURIComponent(slug)}`,
    { searchParams: { pageSize: 200 }, signal },
  );

  const allPortfolio = (portfolio?.projects ?? []).map(mapPortfolioProject);

  const recentInvestments = [...(portfolio?.projects ?? [])]
    .sort((a, b) => {
      if (!a.announcedDate && !b.announcedDate) return 0;
      if (!a.announcedDate) return 1;
      if (!b.announcedDate) return -1;
      return b.announcedDate.localeCompare(a.announcedDate);
    })
    .slice(0, 5)
    .map(mapPortfolioProject);

  return {
    fund: {
      slug: overview.slug,
      name: overview.name,
      logoUrl: overview.logoUrl,
      website: overview.website ?? null,
      twitterHandle: overview.twitter ?? null,
      portfolioSize: overview.portfolioProjectCount ?? null,
      lastInvestmentLabel: formatRelativeDate(overview.lastInvestmentDate),
    },
    topSectors: insights?.topCategories ?? [],
    topChains: [],
    insights: mapInsights(insights),
    portfolio: allPortfolio,
    recentInvestments,
  };
}
