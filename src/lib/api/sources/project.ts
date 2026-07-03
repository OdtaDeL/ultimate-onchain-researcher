// Data source for useProject(). Calls the real GET /api/projects/:slug
// endpoint so invalid slugs return a 404 (propagated as ApiClientError →
// ErrorState) instead of silently showing another project's mock data.
//
// Fields without a backend source:
//   - project.chain: no chain/network column on projects table. Field is
//     absent from ProjectData — the page omits the chain Pill entirely.
//   - relatedProjects: no backend query exists; stays [].
//   - FundingRoundRowProps.leadInvestor: funding_investors has no is_lead
//     flag. All investors are listed equally via otherInvestorsSummary.
//   - nextUnlock.riskLevel: no backend-authoritative threshold. Field is
//     absent from nextUnlock — the page omits the risk Pill entirely.
import { apiFetch } from "../client";
import type {
  Grade,
  ProjectOverviewDto,
  ProjectFundingDto,
  ProjectFundingRoundDto,
  ProjectMetricsDto,
  ProjectUnlocksDto,
  ProjectUnlockEventDto,
  ScoreSummaryDto,
} from "../dto";
import type { TrendingItem } from "@/components/features/home";
import type { ScoreCategory } from "@/components/features/project-detail";
import type { FundingRoundRowProps } from "@/components/features/project-detail";

interface ProjectApiResponse {
  overview: ProjectOverviewDto;
  funding: ProjectFundingDto | null;
  metrics: ProjectMetricsDto | null;
  unlocks: ProjectUnlocksDto | null;
}

export interface ProjectData {
  project: {
    /** Backend slug (e.g. "aave-v3") — used for navigation so watchlist entries reach the correct URL even when the DB slug differs from toSlug(name). */
    slug: string;
    name: string;
    logoUrl: string | null;
    /** Null when backend does not provide a category for this project. */
    category: string | null;
    /** Null when the project has not been scored yet. */
    score: number | null;
    /** Null when the project has not been scored yet. */
    grade: Grade | null;
    /** Null when no market metrics row exists for this project. */
    marketCap: number | null;
    fdv: number | null;
    tvl: number | null;
    changePercent24h: number | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    athPrice: number | null;
    atlPrice: number | null;
    volume24h: number | null;
    /** Null when the backend does not provide a website URL. */
    website: string | null;
    /** Null when the backend does not provide a Twitter/X handle. */
    twitter: string | null;
  };
  scoreCategories: ScoreCategory[];
  fundingRounds: Omit<FundingRoundRowProps, "isLoading" | "isLast">[];
  /** percentOfSupply is null when the event has no supply data. riskLevel is
   *  absent — no backend-authoritative threshold exists in this codebase. */
  nextUnlock: { dateLabel: string; percentOfSupply: number | null };
  relatedProjects: TrendingItem[];
}

function formatFundingDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatUnlockDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function mapScoreCategories(score: ScoreSummaryDto | null): ScoreCategory[] {
  if (!score) return [];
  const cats: ScoreCategory[] = [];
  if (score.marketScore !== null) cats.push({ key: "market", label: "Market", score: score.marketScore });
  if (score.fundingScore !== null) cats.push({ key: "funding", label: "Funding", score: score.fundingScore });
  if (score.investorScore !== null) cats.push({ key: "investor", label: "Investor", score: score.investorScore });
  if (score.unlockScore !== null) cats.push({ key: "unlock", label: "Unlock", score: score.unlockScore });
  if (score.tvlScore !== null) cats.push({ key: "tvl", label: "TVL", score: score.tvlScore });
  if (score.revenueScore !== null) cats.push({ key: "revenue", label: "Revenue", score: score.revenueScore });
  if (score.momentumScore !== null) cats.push({ key: "momentum", label: "Momentum", score: score.momentumScore });
  if (score.totalScore !== null) cats.push({ key: "overall", label: "Overall", score: score.totalScore });
  return cats;
}

function mapFundingRound(
  round: ProjectFundingRoundDto,
): Omit<FundingRoundRowProps, "isLoading" | "isLast"> {
  // funding_investors has no is_lead flag — all investors are listed equally.
  const investors = round.investors;
  let othersSummary: string | null = null;
  if (investors.length === 1) {
    othersSummary = investors[0].name;
  } else if (investors.length === 2) {
    othersSummary = `${investors[0].name}, ${investors[1].name}`;
  } else if (investors.length > 2) {
    othersSummary = `${investors[0].name}, ${investors[1].name} +${investors.length - 2} more`;
  }
  return {
    round: round.roundType ?? "Unknown",
    dateLabel: formatFundingDate(round.announcedDate),
    amountUsd: round.amountRaisedUsd,
    otherInvestorsSummary: othersSummary,
  };
}

function mapNextUnlock(
  unlocks: ProjectUnlocksDto | null,
): { dateLabel: string; percentOfSupply: number | null } {
  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = (unlocks?.unlocks ?? [])
    .filter((u: ProjectUnlockEventDto) => u.unlockDate >= todayISO)
    .sort((a: ProjectUnlockEventDto, b: ProjectUnlockEventDto) =>
      a.unlockDate.localeCompare(b.unlockDate),
    );
  const next = upcoming[0] ?? null;
  if (!next) return { dateLabel: "—", percentOfSupply: null };
  return {
    dateLabel: formatUnlockDate(next.unlockDate),
    percentOfSupply: next.percentOfSupply,
  };
}

export async function fetchProjectData(slug: string, signal?: AbortSignal): Promise<ProjectData> {
  const { overview, funding, metrics, unlocks } = await apiFetch<ProjectApiResponse>(
    `/api/projects/${encodeURIComponent(slug)}`,
    { signal },
  );

  return {
    project: {
      slug: overview.slug,
      name: overview.name,
      logoUrl: overview.logoUrl,
      category: overview.category,
      score: overview.score?.totalScore ?? null,
      grade: overview.score?.grade ?? null,
      marketCap: metrics?.marketCapUsd ?? null,
      fdv: metrics?.fdvUsd ?? null,
      tvl: metrics?.tvlUsd ?? null,
      changePercent24h: metrics?.priceChange24hPercent ?? null,
      circulatingSupply: metrics?.circulatingSupply ?? null,
      totalSupply: metrics?.totalSupply ?? null,
      athPrice: metrics?.ath ?? null,
      atlPrice: metrics?.atl ?? null,
      volume24h: metrics?.volume24hUsd ?? null,
      website: overview.website ?? null,
      twitter: overview.twitter ?? null,
    },
    scoreCategories: mapScoreCategories(overview.score),
    fundingRounds: (funding?.rounds ?? []).map(mapFundingRound),
    nextUnlock: mapNextUnlock(unlocks),
    relatedProjects: [],
  };
}
