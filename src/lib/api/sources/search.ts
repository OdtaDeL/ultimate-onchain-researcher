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
// Pagination: Projects and Funds each use page-based pagination
// (SEARCH_PAGE_SIZE items on page 1). Use fetchMoreSearchProjects /
// fetchMoreSearchFunds to append subsequent pages.
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
import { apiFetchPaginated } from "../client";
import type { FundSearchResultDto, ProjectSearchResultDto } from "../dto";

export type SearchProjectRow = Omit<ProjectRowCardProps, "isLoading" | "onPress">;
export type SearchFundRow = Omit<FundRowCardProps, "isLoading" | "onPress">;

export interface SearchData {
  query: string;
  projects: SearchProjectRow[];
  funds: SearchFundRow[];
  platforms: Omit<PlatformRowCardProps, "isLoading" | "onPress">[];
  trendingSearches: string[];
  /** Next page to fetch for projects results, or null when all loaded. */
  projectsNextPage: number | null;
  /** Next page to fetch for funds results, or null when all loaded. */
  fundsNextPage: number | null;
}

/** Shape of the fields this source reads from GET /api/search's response data with type=projects. */
interface SearchProjectsResponseData {
  projects: ProjectSearchResultDto[];
  pagination: { projects: { hasNextPage: boolean } };
}

/** Shape of the fields this source reads from GET /api/search's response data with type=funds. */
interface SearchFundsResponseData {
  funds: FundSearchResultDto[];
  pagination: { funds: { hasNextPage: boolean } };
}

function matches(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.toLowerCase());
}

const SEARCH_PAGE_SIZE = 20;

/**
 * Maps a project search result to a Projects-row, or `null` only when the
 * project isn't scored yet (score/grade missing) — same convention as
 * src/lib/api/sources/markets.ts's mapWeeklyPickToProjectRow. TVL/market
 * cap/24h change are passed through as-is (often null); the card renders
 * "—" for each rather than dropping an otherwise-matching search result.
 */
function mapSearchResultToProjectRow(result: ProjectSearchResultDto): SearchProjectRow | null {
  if (result.totalScore === null || result.grade === null) return null;
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

function mapSearchResultToFundRow(result: FundSearchResultDto): SearchFundRow | null {
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
async function fetchRealProjectResults(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: SearchProjectRow[]; hasNextPage: boolean }> {
  const { data } = await apiFetchPaginated<SearchProjectsResponseData>("/api/search", {
    searchParams: { q: query, type: "projects", page, pageSize: SEARCH_PAGE_SIZE },
    signal,
  });
  const rows = data.projects.map(mapSearchResultToProjectRow).filter((row): row is SearchProjectRow => row !== null);
  return { rows, hasNextPage: data.pagination.projects.hasNextPage };
}

async function fetchRealFundResults(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: SearchFundRow[]; hasNextPage: boolean }> {
  const { data } = await apiFetchPaginated<SearchFundsResponseData>("/api/search", {
    searchParams: { q: query, type: "funds", page, pageSize: SEARCH_PAGE_SIZE },
    signal,
  });
  const rows = data.funds.map(mapSearchResultToFundRow).filter((row): row is SearchFundRow => row !== null);
  return { rows, hasNextPage: data.pagination.funds.hasNextPage };
}

/** Fetches a subsequent page of project search results. Append `rows` to the existing list. */
export async function fetchMoreSearchProjects(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: SearchProjectRow[]; hasNextPage: boolean }> {
  return fetchRealProjectResults(query, page, signal);
}

/** Fetches a subsequent page of fund search results. Append `rows` to the existing list. */
export async function fetchMoreSearchFunds(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: SearchFundRow[]; hasNextPage: boolean }> {
  return fetchRealFundResults(query, page, signal);
}

export async function fetchSearchData(query: string, signal?: AbortSignal): Promise<SearchData> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: trimmed,
      projects: [],
      funds: [],
      platforms: [],
      trendingSearches: mockTrendingSearches,
      projectsNextPage: null,
      fundsNextPage: null,
    };
  }

  const [projectsResult, fundsResult] = await Promise.all([
    fetchRealProjectResults(trimmed, 1, signal),
    fetchRealFundResults(trimmed, 1, signal),
  ]);

  return {
    query: trimmed,
    projects: projectsResult.rows,
    funds: fundsResult.rows,
    platforms: mockMarketsPlatforms.filter((p) => matches(p.protocol, trimmed)),
    trendingSearches: mockTrendingSearches,
    projectsNextPage: projectsResult.hasNextPage ? 2 : null,
    fundsNextPage: fundsResult.hasNextPage ? 2 : null,
  };
}
