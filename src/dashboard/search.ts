// Dashboard Query Layer — search. Read-only: never inserts, updates, or
// deletes. See home.ts header for the layering rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { FundSearchResultDto, ProjectSearchResultDto } from "./types";
import { deriveGrade, sanitizeSearchQuery } from "./types";

/**
 * Escapes ILIKE's own special characters (`%`, `_`) and its escape
 * character (`\`) so a literal `%`/`_`/`\` in user input can never act as
 * a wildcard or escape operator inside the `%...%` pattern this file
 * builds — without this, e.g. a search for "A_Capital" would match any
 * single character in place of `_` instead of the literal underscore.
 * Backslash must be escaped first, or escaping `%`/`_` afterwards would
 * double-escape the backslashes just inserted.
 */
function escapeIlikeSpecialChars(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Matches projects by name, slug, or ticker (case-insensitive substring), each with its latest total score attached. Empty query returns no results. */
export async function searchProjects(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<ProjectSearchResultDto[]> {
  const cleaned = sanitizeSearchQuery(query);
  if (!cleaned) return [];
  const pattern = `%${escapeIlikeSpecialChars(cleaned)}%`;

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, slug, name, ticker, logo_url")
    .or(`name.ilike.${pattern},slug.ilike.${pattern},ticker.ilike.${pattern}`)
    .limit(25);
  if (error) throw new Error(`searchProjects: failed to search projects: ${error.message}`);
  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const [scoresResult, metricsResult] = await Promise.all([
    supabase.from("project_scores").select("project_id, total_score, score_date").in("project_id", projectIds),
    supabase.from("project_metrics").select("project_id, tvl, market_cap, price_change_24h").in("project_id", projectIds),
  ]);
  if (scoresResult.error) throw new Error(`searchProjects: failed to load project_scores: ${scoresResult.error.message}`);
  if (metricsResult.error) throw new Error(`searchProjects: failed to load project_metrics: ${metricsResult.error.message}`);

  const latestScoreByProject = new Map<string, { total_score: number | null; score_date: string }>();
  for (const s of scoresResult.data) {
    const existing = latestScoreByProject.get(s.project_id);
    if (!existing || s.score_date > existing.score_date) latestScoreByProject.set(s.project_id, s);
  }
  const metricsByProject = new Map(metricsResult.data.map((m) => [m.project_id, m]));

  return projects.map((p): ProjectSearchResultDto => {
    const totalScore = latestScoreByProject.get(p.id)?.total_score ?? null;
    const m = metricsByProject.get(p.id);
    return {
      projectId: p.id,
      slug: p.slug,
      name: p.name,
      ticker: p.ticker,
      logoUrl: p.logo_url,
      totalScore,
      grade: deriveGrade(totalScore),
      tvlUsd: m?.tvl ?? null,
      marketCapUsd: m?.market_cap ?? null,
      priceChange24hPercent: m?.price_change_24h ?? null,
    };
  });
}

/**
 * Matches funds by name (case-insensitive substring). Empty query returns
 * no results.
 *
 * No `recentInvestmentCount`: that needs a defined "recent" time window
 * (e.g. "last 90 days"), which is a product decision with no existing
 * rule anywhere in this codebase — not implemented here to avoid
 * inventing one. `portfolioProjectCount` below is a real, unbounded
 * count and doesn't have this problem.
 */
export async function searchFunds(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<FundSearchResultDto[]> {
  const cleaned = sanitizeSearchQuery(query);
  if (!cleaned) return [];
  const pattern = `%${escapeIlikeSpecialChars(cleaned)}%`;

  const { data: funds, error } = await supabase
    .from("funds")
    .select("id, slug, name, logo_url")
    .ilike("name", pattern)
    .limit(25);
  if (error) throw new Error(`searchFunds: failed to search funds: ${error.message}`);
  if (funds.length === 0) return [];

  const fundIds = funds.map((f) => f.id);
  const { data: topFunds, error: topFundsError } = await supabase
    .from("top_funds")
    .select("fund_id, portfolio_project_count")
    .in("fund_id", fundIds);
  if (topFundsError) throw new Error(`searchFunds: failed to load top_funds: ${topFundsError.message}`);
  const portfolioCountByFund = new Map(topFunds.map((t) => [t.fund_id, t.portfolio_project_count]));

  return funds.map((f): FundSearchResultDto => ({
    fundId: f.id,
    slug: f.slug,
    name: f.name,
    logoUrl: f.logo_url,
    portfolioProjectCount: portfolioCountByFund.get(f.id) ?? null,
  }));
}
