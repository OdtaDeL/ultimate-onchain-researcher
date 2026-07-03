// Data source for useSearch(). Recent Searches are deliberately NOT part
// of this source — they're local-only, never server-backed (DESIGN_SYSTEM:
// "stored locally"), so the page keeps that as its own local state.
// Trending Searches stay mock: still no backend DTO for them.
//
// Phase 4: Both Projects and Funds results are now wired to the real
// GET /api/search endpoint. Platforms results stay mock: the real
// /api/search has no "platforms" concept at all (searchProjects/
// searchFunds only).
//
// Funds: FundSearchResultDto carries portfolioProjectCount (nullable) —
// funds with null portfolioProjectCount are dropped (honest-drop, same
// convention as mapSearchResultToProjectRow). recentInvestmentCount is
// absent from the DTO (no "recent" time window defined in the backend),
// and FundRowCardProps.recentInvestmentCount is optional — card renders
// "—" for that field, which is correct.
import type { ProjectRowCardProps, FundRowCardProps, PlatformRowCardProps } from "@/components/features/markets";
import { mockMarketsPlatforms } from "@/components/features/markets/mock-data";
import { mockTrendingSearches } from "@/components/features/search/mock-data";
import { apiFetch } from "../client";
import type { FundSearchResultDto, ProjectSearchResultDto } from "../dto";

export interface SearchData {
  query: string;
  projects: Omit<ProjectRowCardProps, "isLoading" | "onPress">[];
  funds: Omit<FundRowCardProps, "isLoading" | "onPress">[];
  platforms: Omit<PlatformRowCardProps, "isLoading" | "onPress">[];
  trendingSearches: string[];
}

type ProjectRow = Omit<ProjectRowCardProps, "isLoading" | "onPress">;
type FundRow = Omit<FundRowCardProps, "isLoading" | "onPress">;

/** Shape of the fields this source reads from GET /api/search's response data with type=projects. */
interface SearchProjectsResponseData {
  projects: ProjectSearchResultDto[];
}

/** Shape of the fields this source reads from GET /api/search's response data with type=funds. */
interface SearchFundsResponseData {
  funds: FundSearchResultDto[];
}

function matches(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.toLowerCase());
}

/**
 * Maps a project search result to a Projects-row, or `null` if any field
 * the card requires as non-optional (score/grade/tvl/marketCap/24h
 * change) isn't available for this project yet — same honest-drop
 * convention as src/lib/api/sources/markets.ts's mapWeeklyPickToProjectRow.
 */
function mapSearchResultToProjectRow(result: ProjectSearchResultDto): ProjectRow | null {
  if (
    result.totalScore === null ||
    result.grade === null ||
    result.tvlUsd === null ||
    result.marketCapUsd === null ||
    result.priceChange24hPercent === null
  ) {
    return null;
  }
  return {
    slug: result.slug,
    name: result.name,
    logoUrl: result.logoUrl,
    score: result.totalScore,
    grade: result.grade,
    tvl: result.tvlUsd,
    marketCap: result.marketCapUsd,
    changePercent24h: result.priceChange24hPercent,
  };
}

function mapSearchResultToFundRow(result: FundSearchResultDto): FundRow | null {
  if (result.portfolioProjectCount === null) return null;
  return {
    slug: result.slug,
    name: result.name,
    logoUrl: result.logoUrl,
    portfolioProjectCount: result.portfolioProjectCount,
  };
}

// Throws on failure — callers must handle errors. Error propagates through
// useQuery to the page, which renders ErrorState + Retry instead of
// silently falling back to stale mock data.
async function fetchRealProjectResults(query: string, signal?: AbortSignal): Promise<ProjectRow[]> {
  const data = await apiFetch<SearchProjectsResponseData>("/api/search", {
    searchParams: { q: query, type: "projects" },
    signal,
  });
  return data.projects.map(mapSearchResultToProjectRow).filter((row): row is ProjectRow => row !== null);
}

async function fetchRealFundResults(query: string, signal?: AbortSignal): Promise<FundRow[]> {
  const data = await apiFetch<SearchFundsResponseData>("/api/search", {
    searchParams: { q: query, type: "funds" },
    signal,
  });
  return data.funds.map(mapSearchResultToFundRow).filter((row): row is FundRow => row !== null);
}

export async function fetchSearchData(query: string, signal?: AbortSignal): Promise<SearchData> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, projects: [], funds: [], platforms: [], trendingSearches: mockTrendingSearches };
  }

  const [realProjects, realFunds] = await Promise.all([
    fetchRealProjectResults(trimmed, signal),
    fetchRealFundResults(trimmed, signal),
  ]);

  return {
    query: trimmed,
    projects: realProjects,
    funds: realFunds,
    platforms: mockMarketsPlatforms.filter((p) => matches(p.protocol, trimmed)),
    trendingSearches: mockTrendingSearches,
  };
}
