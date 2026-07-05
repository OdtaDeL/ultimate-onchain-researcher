// Dashboard Query Layer — home screen. Read-only: never inserts, updates,
// or deletes. src/dashboard/ is the ONLY place allowed to aggregate data
// for frontend consumption (see DEVELOPER_GUIDE.md layering — this column
// sits to the right of everything else and must not be imported by any
// provider/ingestion/sync/scoring/scoring-sync module).
//
// Reads beyond the task's literal 6-source list (projects, funding_rounds,
// funding_investors, funds, token_unlock_events) where a responsibility
// requires it — see this task's final report, "Architecture concerns."

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { deriveGrade } from "./types";
import type { MarketOverviewAssetDto, MarketOverviewDto, MonthlyPickDto, NewFundingDto, RecentlyAddedDto, TopFundDto, TopGainerDto, UnlockAlertDto, WeeklyPickDto } from "./types";

/** Shape of the project_metrics columns every ranked-project DTO below joins in for market-metric fields (tvl/marketCap/24h change/7d TVL change) and the grade derived from project_scores. */
interface RankedProjectMetrics {
  tvl: number | null;
  market_cap: number | null;
  price_change_24h: number | null;
  tvl_change_7d: number | null;
}

/** ISO-8601 week start (Monday) for the given date, formatted YYYY-MM-DD. Matches Postgres date_trunc('week', ...) which always anchors on Monday. */
function isoWeekStart(d: Date = new Date()): string {
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - daysFromMonday);
  return monday.toISOString().slice(0, 10);
}

/** Calendar month start for the given date, formatted YYYY-MM-DD. */
function calendarMonthStart(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** Top-ranked projects for the current week, per weekly_rankings_mv. */
export async function getWeeklyPicks(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<WeeklyPickDto[]> {
  const { data: rankings, error } = await supabase
    .from("weekly_rankings_mv")
    .select("project_id, week_start, total_score, rank")
    .eq("week_start", isoWeekStart())
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getWeeklyPicks: failed to load weekly_rankings_mv: ${error.message}`);
  if (rankings.length === 0) return [];

  const projectIds = rankings.map((r) => r.project_id);
  const [{ data: projects, error: projectsError }, { data: metrics, error: metricsError }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, logo_url").in("id", projectIds),
    supabase.from("project_metrics").select("project_id, tvl, market_cap, price_change_24h, tvl_change_7d").in("project_id", projectIds),
  ]);
  if (projectsError) throw new Error(`getWeeklyPicks: failed to load projects: ${projectsError.message}`);
  if (metricsError) throw new Error(`getWeeklyPicks: failed to load project_metrics: ${metricsError.message}`);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const metricsByProject = new Map<string, RankedProjectMetrics>(metrics.map((m) => [m.project_id, m]));
  return rankings
    .map((r): WeeklyPickDto | null => {
      const project = projectById.get(r.project_id);
      if (!project) return null;
      const m = metricsByProject.get(r.project_id);
      return {
        projectId: r.project_id,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        rank: r.rank,
        totalScore: r.total_score,
        grade: deriveGrade(r.total_score),
        tvlUsd: m?.tvl ?? null,
        marketCapUsd: m?.market_cap ?? null,
        priceChange24hPercent: m?.price_change_24h ?? null,
        tvlChangePercent: m?.tvl_change_7d ?? null,
        weekStart: r.week_start,
      };
    })
    .filter((x): x is WeeklyPickDto => x !== null);
}

/** Top-ranked projects for the current month, per monthly_rankings_mv. Symmetrical with getWeeklyPicks — same join against `projects` for slug/name/logo, same null-filtering for a ranked project that's since been deleted. */
export async function getMonthlyPicks(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<MonthlyPickDto[]> {
  const { data: rankings, error } = await supabase
    .from("monthly_rankings_mv")
    .select("project_id, month_start, total_score, rank")
    .eq("month_start", calendarMonthStart())
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getMonthlyPicks: failed to load monthly_rankings_mv: ${error.message}`);
  if (rankings.length === 0) return [];

  const projectIds = rankings.map((r) => r.project_id);
  const [{ data: projects, error: projectsError }, { data: metrics, error: metricsError }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, logo_url").in("id", projectIds),
    supabase.from("project_metrics").select("project_id, tvl, market_cap, price_change_24h, tvl_change_7d").in("project_id", projectIds),
  ]);
  if (projectsError) throw new Error(`getMonthlyPicks: failed to load projects: ${projectsError.message}`);
  if (metricsError) throw new Error(`getMonthlyPicks: failed to load project_metrics: ${metricsError.message}`);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const metricsByProject = new Map<string, RankedProjectMetrics>(metrics.map((m) => [m.project_id, m]));
  return rankings
    .map((r): MonthlyPickDto | null => {
      const project = projectById.get(r.project_id);
      if (!project) return null;
      const m = metricsByProject.get(r.project_id);
      return {
        projectId: r.project_id,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        rank: r.rank,
        totalScore: r.total_score,
        grade: deriveGrade(r.total_score),
        tvlUsd: m?.tvl ?? null,
        marketCapUsd: m?.market_cap ?? null,
        priceChange24hPercent: m?.price_change_24h ?? null,
        tvlChangePercent: m?.tvl_change_7d ?? null,
        monthStart: r.month_start,
      };
    })
    .filter((x): x is MonthlyPickDto => x !== null);
}

/** Top-ranked funds by scoring-weighted portfolio quality, per top_funds. */
export async function getTopFunds(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<TopFundDto[]> {
  const { data, error } = await supabase
    .from("top_funds")
    .select("fund_id, name, logo_url, portfolio_project_count, avg_investor_score, rank")
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getTopFunds: failed to load top_funds: ${error.message}`);
  if (data.length === 0) return [];

  // top_funds (supabase/migrations/008_scoring_materialized_views.sql) has
  // no slug column of its own — join against funds for the real,
  // ingestion-populated slug (supabase/migrations/010_funds_slug.sql)
  // rather than deriving one.
  const fundIds = data.map((f) => f.fund_id);
  const { data: funds, error: fundsError } = await supabase.from("funds").select("id, slug").in("id", fundIds);
  if (fundsError) throw new Error(`getTopFunds: failed to load funds: ${fundsError.message}`);
  const slugById = new Map(funds.map((f) => [f.id, f.slug]));

  return data
    .map((f): TopFundDto | null => {
      const slug = slugById.get(f.fund_id);
      if (!slug) return null;
      return {
        fundId: f.fund_id,
        slug,
        name: f.name,
        logoUrl: f.logo_url,
        portfolioProjectCount: f.portfolio_project_count,
        avgInvestorScore: f.avg_investor_score,
        rank: f.rank,
      };
    })
    .filter((x): x is TopFundDto => x !== null);
}

/** Projects with the highest 24h price change, descending. Excludes projects with no price_change_24h in project_metrics. */
export async function getTopGainers(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<TopGainerDto[]> {
  const { data: metrics, error } = await supabase
    .from("project_metrics")
    .select("project_id, price_change_24h")
    .not("price_change_24h", "is", null)
    .order("price_change_24h", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getTopGainers: failed to load project_metrics: ${error.message}`);
  if (metrics.length === 0) return [];

  const projectIds = metrics.map((m) => m.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, logo_url")
    .in("id", projectIds);
  if (projectsError) throw new Error(`getTopGainers: failed to load projects: ${projectsError.message}`);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  return metrics
    .map((m): TopGainerDto | null => {
      const project = projectById.get(m.project_id);
      if (!project || m.price_change_24h === null) return null;
      return {
        projectId: m.project_id,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        priceChange24hPercent: m.price_change_24h,
      };
    })
    .filter((x): x is TopGainerDto => x !== null);
}

/** Most recently onboarded projects, newest first. */
export async function getRecentlyAdded(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<RecentlyAddedDto[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, logo_url, category, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentlyAdded: failed to load projects: ${error.message}`);
  return data.map((p) => ({
    projectId: p.id,
    slug: p.slug,
    name: p.name,
    logoUrl: p.logo_url,
    category: p.category,
    createdAt: p.created_at,
  }));
}

/**
 * Aggregate market overview: top-N projects by market cap (as named assets),
 * plus total market cap and weighted 24h change across all tracked projects.
 * Returns null when project_metrics has no rows with market_cap + price set.
 */
export async function getMarketOverview(
  supabase: SupabaseClient<Database>,
  limit: number = 3,
): Promise<MarketOverviewDto | null> {
  const { data: metrics, error } = await supabase
    .from("project_metrics")
    .select("project_id, market_cap, price, price_change_24h")
    .not("market_cap", "is", null)
    .not("price", "is", null)
    .not("price_change_24h", "is", null);
  if (error) throw new Error(`getMarketOverview: failed to load project_metrics: ${error.message}`);
  if (metrics.length === 0) return null;

  // PostgREST filter narrowing doesn't remove null from the TS type; the .not() filters above guarantee these are numbers.
  const valid = metrics as Array<{ project_id: string; market_cap: number; price: number; price_change_24h: number }>;
  const sorted = [...valid].sort((a, b) => b.market_cap - a.market_cap);
  const totalMarketCapUsd = valid.reduce((sum, m) => sum + m.market_cap, 0);
  const topN = sorted.slice(0, limit);
  const totalMarketCapChangePercent24h = topN.reduce((sum, m) => sum + m.price_change_24h, 0) / topN.length;

  const topNIds = topN.map((m) => m.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, ticker, logo_url")
    .in("id", topNIds);
  if (projectsError) throw new Error(`getMarketOverview: failed to load projects: ${projectsError.message}`);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const assets = topN
    .map((m): MarketOverviewAssetDto | null => {
      const project = projectById.get(m.project_id);
      if (!project?.ticker) return null;
      return {
        symbol: project.ticker,
        logoUrl: project.logo_url,
        priceUsd: m.price,
        changePercent24h: m.price_change_24h,
      };
    })
    .filter((a): a is MarketOverviewAssetDto => a !== null);

  if (assets.length === 0) return null;
  return { assets, totalMarketCapUsd, totalMarketCapChangePercent24h };
}

/** Most recently announced funding rounds, with investor names attached. */
export async function getNewFunding(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<NewFundingDto[]> {
  const { data: rounds, error } = await supabase
    .from("funding_rounds")
    .select("id, project_id, round_type, amount_raised, fdv, announced_date")
    .not("announced_date", "is", null)
    .order("announced_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getNewFunding: failed to load funding_rounds: ${error.message}`);
  if (rounds.length === 0) return [];

  const projectIds = [...new Set(rounds.map((r) => r.project_id))];
  const roundIds = rounds.map((r) => r.id);

  const [projectsResult, investorsResult] = await Promise.all([
    supabase.from("projects").select("id, slug, name, logo_url").in("id", projectIds),
    supabase.from("funding_investors").select("funding_round_id, fund_id").in("funding_round_id", roundIds),
  ]);
  if (projectsResult.error) {
    throw new Error(`getNewFunding: failed to load projects: ${projectsResult.error.message}`);
  }
  if (investorsResult.error) {
    throw new Error(`getNewFunding: failed to load funding_investors: ${investorsResult.error.message}`);
  }

  const fundIds = [...new Set(investorsResult.data.map((i) => i.fund_id))];
  const { data: funds, error: fundsError } =
    fundIds.length === 0
      ? { data: [] as { id: string; name: string }[], error: null }
      : await supabase.from("funds").select("id, name").in("id", fundIds);
  if (fundsError) throw new Error(`getNewFunding: failed to load funds: ${fundsError.message}`);

  const projectById = new Map(projectsResult.data.map((p) => [p.id, p]));
  const fundNameById = new Map(funds.map((f) => [f.id, f.name]));
  const investorNamesByRound = new Map<string, string[]>();
  for (const investor of investorsResult.data) {
    const fundName = fundNameById.get(investor.fund_id);
    if (!fundName) continue;
    const list = investorNamesByRound.get(investor.funding_round_id) ?? [];
    list.push(fundName);
    investorNamesByRound.set(investor.funding_round_id, list);
  }

  return rounds
    .map((r): NewFundingDto | null => {
      const project = projectById.get(r.project_id);
      if (!project) return null;
      return {
        fundingRoundId: r.id,
        projectId: r.project_id,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        roundType: r.round_type,
        amountRaisedUsd: r.amount_raised,
        fdvUsd: r.fdv,
        announcedDate: r.announced_date,
        investorNames: investorNamesByRound.get(r.id) ?? [],
      };
    })
    .filter((x): x is NewFundingDto => x !== null);
}

/** Soonest upcoming token unlocks, nearest date first. */
export async function getUnlockAlerts(
  supabase: SupabaseClient<Database>,
  limit: number = 10,
): Promise<UnlockAlertDto[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: events, error } = await supabase
    .from("token_unlock_events")
    .select("project_id, unlock_date, unlock_type, amount_tokens, amount_usd, percent_of_supply")
    .gte("unlock_date", todayIso)
    .order("unlock_date", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getUnlockAlerts: failed to load token_unlock_events: ${error.message}`);
  if (events.length === 0) return [];

  const projectIds = [...new Set(events.map((e) => e.project_id))];
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, logo_url")
    .in("id", projectIds);
  if (projectsError) throw new Error(`getUnlockAlerts: failed to load projects: ${projectsError.message}`);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  return events
    .map((e): UnlockAlertDto | null => {
      const project = projectById.get(e.project_id);
      if (!project) return null;
      return {
        projectId: e.project_id,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        unlockDate: e.unlock_date,
        unlockType: e.unlock_type,
        amountTokens: e.amount_tokens,
        amountUsd: e.amount_usd,
        percentOfSupply: e.percent_of_supply,
      };
    })
    .filter((x): x is UnlockAlertDto => x !== null);
}
