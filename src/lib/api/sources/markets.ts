// Data source for useMarkets(). Two tabs: Projects and Funds.
//
// Phase 3: Projects tab wired to GET /api/rankings/weekly (WeeklyPickDto
// carries grade/tvlUsd/marketCapUsd/priceChange24hPercent). `fundingStage`
// stays unset — absent from the schema (see src/dashboard/fund.ts).
//
// Phase 4: Funds tab wired to GET /api/rankings/funds (TopFundDto via
// top_funds materialized view). `recentInvestmentCount` is intentionally
// absent — no "recent" time-window concept exists in the DB schema;
// FundRowCardProps now makes it optional and the card renders "—" when
// absent, consistent with all other nullable fields in this codebase.
//
// Pagination: Projects tab uses page-based pagination (page 1 on initial
// load, PROJECTS_PAGE_SIZE items per page). Callers use
// fetchMoreMarketProjects(page) to append subsequent pages.
//
// Platforms tab removed (Phase 3): no backend DTO exists for DeFi protocols;
// showing mock data to real users would be misleading.
import type { ProjectRowCardProps, FundRowCardProps } from "@/components/features/markets";
import { apiFetch, apiFetchPaginated } from "../client";
import type { TopFundDto, WeeklyPickDto } from "../dto";

export type MarketProjectRow = Omit<ProjectRowCardProps, "isLoading" | "onPress">;
export type MarketFundRow = Omit<FundRowCardProps, "isLoading" | "onPress">;

export interface MarketsData {
  projects: MarketProjectRow[];
  funds: MarketFundRow[];
  /** Next page number to fetch for the projects list, or null when all pages have been loaded. */
  projectsNextPage: number | null;
}

const PROJECTS_PAGE_SIZE = 20;

/**
 * Maps a ranked project to a Projects-tab row, or `null` only when the
 * project's core identity — score/grade — isn't available yet (unscored).
 * TVL/market cap/24h change are frequently null (not every project is a
 * TVL-bearing protocol, or DefiLlama/CoinGecko hasn't synced it yet) and
 * are passed through as-is; ProjectRowCardProps renders "—" for each,
 * rather than dropping an otherwise-valid, scored project from the list.
 */
function mapWeeklyPickToProjectRow(pick: WeeklyPickDto): MarketProjectRow | null {
  if (pick.totalScore === null || pick.grade === null) return null;
  return {
    slug: pick.slug,
    name: pick.name,
    logoUrl: pick.logoUrl,
    score: pick.totalScore,
    grade: pick.grade,
    tvl: pick.tvlUsd,
    marketCap: pick.marketCapUsd,
    changePercent24h: pick.priceChange24hPercent,
  };
}

/**
 * Maps a top-ranked fund to a Funds-tab row.
 * recentInvestmentCount is intentionally absent — FundRowCardProps makes
 * it optional and the card renders "—" when missing.
 */
function mapTopFundToFundRow(fund: TopFundDto): MarketFundRow {
  return {
    slug: fund.slug,
    name: fund.name,
    logoUrl: fund.logoUrl,
    portfolioProjectCount: fund.portfolioProjectCount,
  };
}

async function fetchRealProjectRows(
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: MarketProjectRow[]; hasNextPage: boolean }> {
  const { data: picks, pagination } = await apiFetchPaginated<WeeklyPickDto[]>("/api/rankings/weekly", {
    searchParams: { page, pageSize: PROJECTS_PAGE_SIZE },
    signal,
  });
  const rows = picks.map(mapWeeklyPickToProjectRow).filter((row): row is MarketProjectRow => row !== null);
  return { rows, hasNextPage: pagination?.hasNextPage ?? false };
}

/**
 * Fetches a subsequent page of ranked projects for the Markets Projects tab.
 * Append the returned `rows` to the existing list; set `nextPage` to null
 * when `hasNextPage` is false.
 */
export async function fetchMoreMarketProjects(
  page: number,
  signal?: AbortSignal,
): Promise<{ rows: MarketProjectRow[]; hasNextPage: boolean }> {
  return fetchRealProjectRows(page, signal);
}

async function fetchRealFundRows(signal?: AbortSignal): Promise<MarketFundRow[]> {
  const funds = await apiFetch<TopFundDto[]>("/api/rankings/funds", { searchParams: { limit: 50 }, signal });
  return funds.map(mapTopFundToFundRow);
}

// Throws on failure — callers must handle errors. Previously caught and
// returned null so the page could silently fall back to mock projects, but
// silently rendering stale mock data on a backend failure masks the outage.
// Now the error propagates through useQuery to the page, which renders
// ErrorState + Retry instead.
export async function fetchMarketsData(signal?: AbortSignal): Promise<MarketsData> {
  const [{ rows: projects, hasNextPage }, realFunds] = await Promise.all([
    fetchRealProjectRows(1, signal),
    fetchRealFundRows(signal),
  ]);

  return {
    projects,
    funds: realFunds,
    projectsNextPage: hasNextPage ? 2 : null,
  };
}
