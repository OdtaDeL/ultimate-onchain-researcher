// Data source for useMarkets(). Platforms tab has no backend DTO at all
// (DECISION_LOG.md R-12) and stays on mock data.
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
// Platforms tab stays mock: no backend DTO at all.
import type { ProjectRowCardProps, FundRowCardProps, PlatformRowCardProps } from "@/components/features/markets";
import { mockMarketsPlatforms } from "@/components/features/markets/mock-data";
import { apiFetch } from "../client";
import type { TopFundDto, WeeklyPickDto } from "../dto";

export interface MarketsData {
  projects: Omit<ProjectRowCardProps, "isLoading" | "onPress">[];
  funds: Omit<FundRowCardProps, "isLoading" | "onPress">[];
  platforms: Omit<PlatformRowCardProps, "isLoading" | "onPress">[];
}

type ProjectRow = Omit<ProjectRowCardProps, "isLoading" | "onPress">;
type FundRow = Omit<FundRowCardProps, "isLoading" | "onPress">;

/**
 * Maps a ranked project to a Projects-tab row, or `null` if any field the
 * card requires as non-optional (score/grade/tvl/marketCap/24h change)
 * isn't available for this project yet — e.g. it's been scored but has no
 * project_metrics row. Dropping the row is the honest choice: there's no
 * "unknown" representation in ProjectRowCardProps, so showing 0 instead
 * would fabricate a value the backend never reported.
 */
function mapWeeklyPickToProjectRow(pick: WeeklyPickDto): ProjectRow | null {
  if (
    pick.totalScore === null ||
    pick.grade === null ||
    pick.tvlUsd === null ||
    pick.marketCapUsd === null ||
    pick.priceChange24hPercent === null
  ) {
    return null;
  }
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
function mapTopFundToFundRow(fund: TopFundDto): FundRow {
  return {
    slug: fund.slug,
    name: fund.name,
    logoUrl: fund.logoUrl,
    portfolioProjectCount: fund.portfolioProjectCount,
  };
}

// Throws on failure — callers must handle errors. Previously caught and
// returned null so the page could silently fall back to mock projects, but
// silently rendering stale mock data on a backend failure masks the outage.
// Now the error propagates through useQuery to the page, which renders
// ErrorState + Retry instead.
async function fetchRealProjectRows(signal?: AbortSignal): Promise<ProjectRow[]> {
  const picks = await apiFetch<WeeklyPickDto[]>("/api/rankings/weekly", { searchParams: { pageSize: 50 }, signal });
  return picks.map(mapWeeklyPickToProjectRow).filter((row): row is ProjectRow => row !== null);
}

async function fetchRealFundRows(signal?: AbortSignal): Promise<FundRow[]> {
  const funds = await apiFetch<TopFundDto[]>("/api/rankings/funds", { searchParams: { limit: 50 }, signal });
  return funds.map(mapTopFundToFundRow);
}

export async function fetchMarketsData(signal?: AbortSignal): Promise<MarketsData> {
  const [realProjects, realFunds] = await Promise.all([
    fetchRealProjectRows(signal),
    fetchRealFundRows(signal),
  ]);

  return {
    projects: realProjects,
    funds: realFunds,
    platforms: mockMarketsPlatforms,
  };
}
