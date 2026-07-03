import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGetProject } from "../project";
import { createMockSupabase, getEq, rows, type RecordedFilter } from "./mock-supabase";

const PROJECT_ROW = {
  id: "p1",
  slug: "aave-v3",
  name: "Aave V3",
  ticker: "AAVE",
  category: "Lending",
  description: "A lending protocol.",
  logo_url: null,
  website: null,
  twitter: null,
};

function projectsHandler(filters: RecordedFilter[]) {
  const slug = getEq(filters, "slug");
  if (slug !== undefined) {
    return slug === PROJECT_ROW.slug ? { data: PROJECT_ROW, error: null } : { data: null, error: null };
  }
  return rows([PROJECT_ROW]);
}

function buildSupabase() {
  return createMockSupabase({
    projects: projectsHandler,
    project_scores: () => ({
      data: {
        funding_score: 70,
        investor_score: 80,
        market_score: 60,
        tvl_score: 90,
        revenue_score: 50,
        unlock_score: 95,
        momentum_score: 65,
        total_score: 76,
        score_date: "2026-06-25",
      },
      error: null,
    }),
    top_projects: () => ({ data: { rank: 3 }, error: null }),
    funding_rounds: () =>
      rows([{ id: "r1", round_type: "Seed", amount_raised: 5_000_000, fdv: 50_000_000, announced_date: "2026-01-01" }]),
    funding_investors: () => rows([{ funding_round_id: "r1", fund_id: "f1" }]),
    funds: () => rows([{ id: "f1", slug: "acme-capital", name: "Acme Capital", logo_url: null }]),
    project_metrics: () => ({
      data: {
        market_cap: 1_000_000_000,
        fdv: 1_200_000_000,
        price: 100,
        volume_24h: 5_000_000,
        market_cap_rank: 12,
        price_change_24h: 1.2,
        price_change_7d: 3.4,
        price_change_30d: -2.1,
        ath: 600,
        atl: 30,
        tvl: 800_000_000,
        tvl_change_1d: 0.5,
        tvl_change_7d: 1.1,
        revenue_24h: 10_000,
        revenue_30d: 300_000,
        fees_24h: 12_000,
        fees_30d: 350_000,
        updated_at: "2026-06-26T00:00:00.000Z",
      },
      error: null,
    }),
    token_unlock_events: () =>
      rows([{ unlock_date: "2026-07-01", unlock_type: "Team", amount_tokens: 1000, amount_usd: 50_000, percent_of_supply: 0.5 }]),
  });
}

test("GET /api/projects/:slug returns overview, funding, metrics, and unlocks", async () => {
  const supabase = buildSupabase();

  const response = await handleGetProject(new Request("http://localhost/api/projects/aave-v3"), supabase, {
    slug: "aave-v3",
  });
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.overview.name, "Aave V3");
  assert.equal(body.data.overview.rank, 3);
  assert.equal(body.data.overview.score.totalScore, 76);
  assert.equal(body.data.funding.rounds[0].investors[0].slug, "acme-capital");
  assert.equal(body.data.metrics.marketCapUsd, 1_000_000_000);
  assert.equal(body.data.unlocks.unlocks[0].unlockType, "Team");
});

test("GET /api/projects/:slug returns 404 for an unknown slug", async () => {
  const supabase = buildSupabase();

  const response = await handleGetProject(new Request("http://localhost/api/projects/does-not-exist"), supabase, {
    slug: "does-not-exist",
  });
  assert.equal(response.status, 404);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("GET /api/projects/:slug returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    projects: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetProject(new Request("http://localhost/api/projects/aave-v3"), supabase, {
    slug: "aave-v3",
  });
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});
