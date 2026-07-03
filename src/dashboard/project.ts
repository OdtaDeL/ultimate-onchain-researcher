// Dashboard Query Layer — project detail screen. Read-only: never
// inserts, updates, or deletes. See home.ts header for the layering rule
// and the note on reading beyond the task's literal 6-source list.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { deriveGrade } from "./types";
import type {
  ProjectFundingDto,
  ProjectFundingInvestorDto,
  ProjectFundingRoundDto,
  ProjectMetricsDto,
  ProjectOverviewDto,
  ProjectUnlocksDto,
} from "./types";

/**
 * Identity, profile fields, and latest score/rank for one project. Null
 * if the slug doesn't exist.
 *
 * No `chain` field: the `projects` table has no chain/network column and
 * `metadata` (jsonb) is never populated by ingestion (verified — no
 * provider mapping writes to it), so there is no honest source for it.
 * Adding one needs a schema change, which is out of scope here.
 */
export async function getProjectOverview(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ProjectOverviewDto | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, slug, name, ticker, category, description, logo_url, website, twitter")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProjectOverview: failed to load project: ${error.message}`);
  if (!project) return null;

  const [scoreResult, rankResult] = await Promise.all([
    supabase
      .from("project_scores")
      .select(
        "funding_score, investor_score, market_score, tvl_score, revenue_score, unlock_score, momentum_score, total_score, score_date",
      )
      .eq("project_id", project.id)
      .order("score_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("top_projects").select("rank").eq("project_id", project.id).maybeSingle(),
  ]);
  if (scoreResult.error) {
    throw new Error(`getProjectOverview: failed to load project_scores: ${scoreResult.error.message}`);
  }
  if (rankResult.error) {
    throw new Error(`getProjectOverview: failed to load top_projects: ${rankResult.error.message}`);
  }

  const score = scoreResult.data;
  return {
    projectId: project.id,
    slug: project.slug,
    name: project.name,
    ticker: project.ticker,
    category: project.category,
    description: project.description,
    logoUrl: project.logo_url,
    website: project.website,
    twitter: project.twitter,
    score: score
      ? {
          totalScore: score.total_score,
          fundingScore: score.funding_score,
          investorScore: score.investor_score,
          marketScore: score.market_score,
          tvlScore: score.tvl_score,
          revenueScore: score.revenue_score,
          unlockScore: score.unlock_score,
          momentumScore: score.momentum_score,
          grade: deriveGrade(score.total_score),
          scoreDate: score.score_date,
        }
      : null,
    rank: rankResult.data?.rank ?? null,
  };
}

/** All funding rounds for a project, each with its investor funds attached. Null if the slug doesn't exist. */
export async function getProjectFunding(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ProjectFundingDto | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProjectFunding: failed to load project: ${error.message}`);
  if (!project) return null;

  const { data: rounds, error: roundsError } = await supabase
    .from("funding_rounds")
    .select("id, round_type, amount_raised, fdv, announced_date")
    .eq("project_id", project.id)
    .order("announced_date", { ascending: false });
  if (roundsError) throw new Error(`getProjectFunding: failed to load funding_rounds: ${roundsError.message}`);

  const roundIds = rounds.map((r) => r.id);
  const { data: investors, error: investorsError } =
    roundIds.length === 0
      ? { data: [] as { funding_round_id: string; fund_id: string }[], error: null }
      : await supabase.from("funding_investors").select("funding_round_id, fund_id").in("funding_round_id", roundIds);
  if (investorsError) {
    throw new Error(`getProjectFunding: failed to load funding_investors: ${investorsError.message}`);
  }

  const fundIds = [...new Set(investors.map((i) => i.fund_id))];
  const { data: funds, error: fundsError } =
    fundIds.length === 0
      ? { data: [] as { id: string; slug: string; name: string; logo_url: string | null }[], error: null }
      : await supabase.from("funds").select("id, slug, name, logo_url").in("id", fundIds);
  if (fundsError) throw new Error(`getProjectFunding: failed to load funds: ${fundsError.message}`);

  const fundById = new Map(funds.map((f) => [f.id, f]));
  const investorsByRound = new Map<string, ProjectFundingInvestorDto[]>();
  for (const investor of investors) {
    const fund = fundById.get(investor.fund_id);
    if (!fund) continue;
    const list = investorsByRound.get(investor.funding_round_id) ?? [];
    list.push({ fundId: fund.id, slug: fund.slug, name: fund.name, logoUrl: fund.logo_url });
    investorsByRound.set(investor.funding_round_id, list);
  }

  let totalRaisedUsd: number | null = null;
  for (const r of rounds) {
    if (r.amount_raised != null) totalRaisedUsd = (totalRaisedUsd ?? 0) + r.amount_raised;
  }

  return {
    projectId: project.id,
    slug: project.slug,
    totalRaisedUsd,
    rounds: rounds.map((r): ProjectFundingRoundDto => ({
      fundingRoundId: r.id,
      roundType: r.round_type,
      amountRaisedUsd: r.amount_raised,
      fdvUsd: r.fdv,
      announcedDate: r.announced_date,
      investors: investorsByRound.get(r.id) ?? [],
    })),
  };
}

/** Latest market/TVL/revenue metrics row for a project. Null if the slug or its metrics row doesn't exist. */
export async function getProjectMetrics(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ProjectMetricsDto | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProjectMetrics: failed to load project: ${error.message}`);
  if (!project) return null;

  const { data: metrics, error: metricsError } = await supabase
    .from("project_metrics")
    .select(
      "market_cap, fdv, price, volume_24h, market_cap_rank, price_change_24h, price_change_7d, price_change_30d, ath, atl, tvl, tvl_change_1d, tvl_change_7d, revenue_24h, revenue_30d, fees_24h, fees_30d, circulating_supply, total_supply, updated_at",
    )
    .eq("project_id", project.id)
    .maybeSingle();
  if (metricsError) throw new Error(`getProjectMetrics: failed to load project_metrics: ${metricsError.message}`);
  if (!metrics) return null;

  return {
    projectId: project.id,
    slug: project.slug,
    marketCapUsd: metrics.market_cap,
    fdvUsd: metrics.fdv,
    price: metrics.price,
    volume24hUsd: metrics.volume_24h,
    marketCapRank: metrics.market_cap_rank,
    priceChange24hPercent: metrics.price_change_24h,
    priceChange7dPercent: metrics.price_change_7d,
    priceChange30dPercent: metrics.price_change_30d,
    ath: metrics.ath,
    atl: metrics.atl,
    tvlUsd: metrics.tvl,
    tvlChange1dPercent: metrics.tvl_change_1d,
    tvlChange7dPercent: metrics.tvl_change_7d,
    revenue24hUsd: metrics.revenue_24h,
    revenue30dUsd: metrics.revenue_30d,
    fees24hUsd: metrics.fees_24h,
    fees30dUsd: metrics.fees_30d,
    circulatingSupply: metrics.circulating_supply,
    totalSupply: metrics.total_supply,
    updatedAt: metrics.updated_at,
  };
}

/** All token unlock events for a project, earliest first. Null if the slug doesn't exist. */
export async function getProjectUnlocks(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ProjectUnlocksDto | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProjectUnlocks: failed to load project: ${error.message}`);
  if (!project) return null;

  const { data: events, error: eventsError } = await supabase
    .from("token_unlock_events")
    .select("unlock_date, unlock_type, amount_tokens, amount_usd, percent_of_supply")
    .eq("project_id", project.id)
    .order("unlock_date", { ascending: true });
  if (eventsError) {
    throw new Error(`getProjectUnlocks: failed to load token_unlock_events: ${eventsError.message}`);
  }

  return {
    projectId: project.id,
    slug: project.slug,
    unlocks: events.map((e) => ({
      unlockDate: e.unlock_date,
      unlockType: e.unlock_type,
      amountTokens: e.amount_tokens,
      amountUsd: e.amount_usd,
      percentOfSupply: e.percent_of_supply,
    })),
  };
}
