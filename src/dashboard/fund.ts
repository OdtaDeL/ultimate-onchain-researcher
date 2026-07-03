// Dashboard Query Layer — fund detail screen. Read-only: never inserts,
// updates, or deletes. See home.ts header for the layering rule.
//
// `funds.slug` is a real, indexed, unique column populated directly by
// ingestion (supabase/migrations/010_funds_slug.sql) — every function
// here resolves the `slug` parameter with a direct `.eq("slug", ...)`
// lookup, no derivation or full-table scan needed.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { FundInsightsDto, FundOverviewDto, FundPortfolioDto, FundPortfolioProjectDto } from "./types";

/**
 * Fund profile fields plus its scoring-aware portfolio summary, per
 * top_funds, and its most recent investment date, per fund_leaderboard
 * (supabase/migrations — both views already existed; fund_leaderboard
 * just wasn't queried anywhere until now). Null if the slug doesn't
 * resolve to a fund.
 *
 * No `activeInvestments`/`leadInvestments`/`activityStatus`: the schema
 * has no investment-status column and no defined recency threshold for
 * "active" — fabricating either would mean inventing a product rule, not
 * reporting one. `lastInvestmentDate` below is the real data point a
 * future `activityStatus` could be built on, once that threshold exists.
 */
export async function getFundOverview(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<FundOverviewDto | null> {
  const { data: fund, error } = await supabase
    .from("funds")
    .select("id, slug, name, logo_url, website, twitter, description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getFundOverview: failed to load fund: ${error.message}`);
  if (!fund) return null;

  const [topFundResult, leaderboardResult] = await Promise.all([
    supabase.from("top_funds").select("portfolio_project_count, avg_investor_score, rank").eq("fund_id", fund.id).maybeSingle(),
    supabase.from("fund_leaderboard").select("last_investment_date").eq("fund_id", fund.id).maybeSingle(),
  ]);
  if (topFundResult.error) throw new Error(`getFundOverview: failed to load top_funds: ${topFundResult.error.message}`);
  if (leaderboardResult.error) {
    throw new Error(`getFundOverview: failed to load fund_leaderboard: ${leaderboardResult.error.message}`);
  }

  return {
    fundId: fund.id,
    slug: fund.slug,
    name: fund.name,
    logoUrl: fund.logo_url,
    website: fund.website,
    twitter: fund.twitter,
    description: fund.description,
    portfolioProjectCount: topFundResult.data?.portfolio_project_count ?? null,
    avgInvestorScore: topFundResult.data?.avg_investor_score ?? null,
    rank: topFundResult.data?.rank ?? null,
    lastInvestmentDate: leaderboardResult.data?.last_investment_date ?? null,
  };
}

/** Every project this fund has invested in, with each project's latest total score attached. Null if the slug doesn't resolve to a fund. */
export async function getFundPortfolio(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<FundPortfolioDto | null> {
  const { data: fund, error } = await supabase.from("funds").select("id, slug").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getFundPortfolio: failed to load fund: ${error.message}`);
  if (!fund) return null;

  const { data: investments, error: investmentsError } = await supabase
    .from("funding_investors")
    .select("funding_round_id")
    .eq("fund_id", fund.id);
  if (investmentsError) {
    throw new Error(`getFundPortfolio: failed to load funding_investors: ${investmentsError.message}`);
  }
  if (investments.length === 0) return { fundId: fund.id, slug, projects: [] };

  const roundIds = [...new Set(investments.map((i) => i.funding_round_id))];
  const { data: rounds, error: roundsError } = await supabase
    .from("funding_rounds")
    .select("id, project_id, round_type, announced_date")
    .in("id", roundIds);
  if (roundsError) throw new Error(`getFundPortfolio: failed to load funding_rounds: ${roundsError.message}`);
  if (rounds.length === 0) return { fundId: fund.id, slug, projects: [] };

  const projectIds = [...new Set(rounds.map((r) => r.project_id))];
  const [projectsResult, scoresResult] = await Promise.all([
    supabase.from("projects").select("id, slug, name, logo_url").in("id", projectIds),
    supabase.from("project_scores").select("project_id, total_score, score_date").in("project_id", projectIds),
  ]);
  if (projectsResult.error) {
    throw new Error(`getFundPortfolio: failed to load projects: ${projectsResult.error.message}`);
  }
  if (scoresResult.error) {
    throw new Error(`getFundPortfolio: failed to load project_scores: ${scoresResult.error.message}`);
  }

  const latestScoreByProject = new Map<string, { total_score: number | null; score_date: string }>();
  for (const s of scoresResult.data) {
    const existing = latestScoreByProject.get(s.project_id);
    if (!existing || s.score_date > existing.score_date) latestScoreByProject.set(s.project_id, s);
  }

  const projectById = new Map(projectsResult.data.map((p) => [p.id, p]));
  const roundByProject = new Map(rounds.map((r) => [r.project_id, r]));

  const projects = projectIds
    .map((projectId): FundPortfolioProjectDto | null => {
      const project = projectById.get(projectId);
      if (!project) return null;
      const round = roundByProject.get(projectId);
      return {
        projectId,
        slug: project.slug,
        name: project.name,
        logoUrl: project.logo_url,
        roundType: round?.round_type ?? null,
        announcedDate: round?.announced_date ?? null,
        totalScore: latestScoreByProject.get(projectId)?.total_score ?? null,
      };
    })
    .filter((x): x is FundPortfolioProjectDto => x !== null);

  return { fundId: fund.id, slug, projects };
}

/** Picks the most frequent value in `values`, ties broken by first occurrence. Returns null for an empty input or when every value is null. */
function mostFrequent<T>(values: (T | null)[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v === null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/** Every portfolio-project category, ordered most-frequent-first, ties broken by first occurrence. */
function rankedByFrequency(values: (string | null)[]): string[] {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const v of values) {
    if (v === null) continue;
    if (!counts.has(v)) order.push(v);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...order].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
}

/**
 * Real aggregates over a fund's own funding_rounds and portfolio projects
 * — every field is a count/max/mode of rows already attributable to this
 * fund (joined the same way getFundPortfolio already joins
 * funding_investors -> funding_rounds -> projects), never an invented
 * value. No `topChains`: no chain/network column exists anywhere on
 * `projects`, so there's nothing honest to aggregate. Null if the slug
 * doesn't resolve to a fund.
 */
export async function getFundInsights(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<FundInsightsDto | null> {
  const { data: fund, error } = await supabase.from("funds").select("id, slug").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getFundInsights: failed to load fund: ${error.message}`);
  if (!fund) return null;

  const { data: investments, error: investmentsError } = await supabase
    .from("funding_investors")
    .select("funding_round_id")
    .eq("fund_id", fund.id);
  if (investmentsError) {
    throw new Error(`getFundInsights: failed to load funding_investors: ${investmentsError.message}`);
  }
  if (investments.length === 0) {
    return { fundId: fund.id, slug, topCategories: [], mostCommonRoundType: null, largestInvestmentUsd: null, dealsThisMonthCount: 0 };
  }

  const roundIds = [...new Set(investments.map((i) => i.funding_round_id))];
  const { data: rounds, error: roundsError } = await supabase
    .from("funding_rounds")
    .select("id, project_id, round_type, amount_raised, announced_date")
    .in("id", roundIds);
  if (roundsError) throw new Error(`getFundInsights: failed to load funding_rounds: ${roundsError.message}`);

  const projectIds = [...new Set(rounds.map((r) => r.project_id))];
  const { data: projects, error: projectsError } =
    projectIds.length === 0
      ? { data: [] as { id: string; category: string | null }[], error: null }
      : await supabase.from("projects").select("id, category").in("id", projectIds);
  if (projectsError) throw new Error(`getFundInsights: failed to load projects: ${projectsError.message}`);

  const categoryByProject = new Map(projects.map((p) => [p.id, p.category]));

  let largestInvestmentUsd: number | null = null;
  for (const r of rounds) {
    if (r.amount_raised != null && (largestInvestmentUsd === null || r.amount_raised > largestInvestmentUsd)) {
      largestInvestmentUsd = r.amount_raised;
    }
  }

  const now = new Date();
  const dealsThisMonthCount = rounds.filter((r) => {
    if (!r.announced_date) return false;
    const announced = new Date(r.announced_date);
    return announced.getUTCFullYear() === now.getUTCFullYear() && announced.getUTCMonth() === now.getUTCMonth();
  }).length;

  return {
    fundId: fund.id,
    slug,
    topCategories: rankedByFrequency(rounds.map((r) => categoryByProject.get(r.project_id) ?? null)),
    mostCommonRoundType: mostFrequent(rounds.map((r) => r.round_type)),
    largestInvestmentUsd,
    dealsThisMonthCount,
  };
}
