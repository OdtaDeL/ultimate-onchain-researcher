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
  Confidence,
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
    /** Overall (pillars-combined) data completeness, 0-100. Null alongside `score`. */
    completenessPercent: number | null;
    /** Weakest-link(completeness tier, freshness tier) — never completeness alone. Null alongside `score`. */
    confidence: Confidence | null;
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

// Display labels for the 6 research pillars (src/scoring/types.ts
// PillarKey) — "Chart" surfaces price-momentum only today, not real
// technical analysis (see momentum-score.ts).
const PILLAR_LABELS: Record<string, string> = {
  vc_market_makers: "VC & Market Makers",
  business_model: "Business Model",
  tokenomics: "Tokenomics",
  chart: "Chart",
  team: "Team",
  community: "Community",
};

/**
 * Maps the 6 research pillars into the flat ScoreCategory[] shape the
 * radar chart / progress-bar list already render. A pillar with
 * `value: null` (no present signal at all — e.g. Team/Community, both
 * fully `not_implemented` today) is omitted here, same convention the
 * old 7-flat-score mapping used — this list is a "what we can show as a
 * number" view. The full per-signal state (missing/not_applicable/
 * not_implemented/provider_error, never collapsed to a bare null) stays
 * available on `score.pillars` for any surface that needs it.
 */
function mapScoreCategories(score: ScoreSummaryDto | null): ScoreCategory[] {
  if (!score) return [];
  const cats: ScoreCategory[] = score.pillars
    .filter((pillar) => pillar.value !== null)
    .map((pillar) => ({
      key: pillar.key,
      label: PILLAR_LABELS[pillar.key] ?? pillar.key,
      score: pillar.value as number,
    }));
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
      completenessPercent: overview.score?.completenessPercent ?? null,
      confidence: overview.score?.confidence ?? null,
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
