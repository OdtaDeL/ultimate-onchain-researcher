import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGetHome } from "../home";
import { createMockSupabase, rows } from "./mock-supabase";

test("GET /api/home returns all seven sections", async () => {
  const supabase = createMockSupabase({
    weekly_rankings_mv: () => rows([{ project_id: "p1", week_start: "2026-06-22", total_score: 91, rank: 1 }]),
    monthly_rankings_mv: () => rows([{ project_id: "p1", month_start: "2026-07-01", total_score: 88, rank: 1 }]),
    top_funds: () =>
      rows([
        { fund_id: "f1", name: "Acme Capital", logo_url: null, portfolio_project_count: 5, avg_investor_score: 80, rank: 1 },
      ]),
    project_metrics: () => rows([{ project_id: "p1", price_change_24h: 12.5, market_cap: 1_000_000_000, price: 50000 }]),
    funding_rounds: () =>
      rows([{ id: "r1", project_id: "p1", round_type: "Seed", amount_raised: 5_000_000, fdv: null, announced_date: "2026-06-20" }]),
    funding_investors: () => rows([{ funding_round_id: "r1", fund_id: "f1" }]),
    token_unlock_events: () =>
      rows([
        {
          project_id: "p1",
          unlock_date: "2026-07-01",
          unlock_type: "Ecosystem",
          amount_tokens: 1000,
          amount_usd: 2000,
          percent_of_supply: 1,
        },
      ]),
    projects: () => rows([{ id: "p1", slug: "acme", name: "Acme", logo_url: null, ticker: "ACM", category: "DeFi", created_at: "2026-06-01T00:00:00Z" }]),
    funds: () => rows([{ id: "f1", slug: "acme-capital", name: "Acme Capital", logo_url: null }]),
  });

  const response = await handleGetHome(new Request("http://localhost/api/home?limit=5"), supabase);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.weeklyPicks.length, 1);
  assert.equal(body.data.weeklyPicks[0].slug, "acme");
  assert.equal(body.data.monthlyPicks.length, 1);
  assert.equal(body.data.monthlyPicks[0].slug, "acme");
  assert.equal(body.data.topFunds[0].slug, "acme-capital");
  assert.equal(body.data.topGainers.length, 1);
  assert.equal(body.data.topGainers[0].slug, "acme");
  assert.equal(body.data.topGainers[0].priceChange24hPercent, 12.5);
  assert.equal(body.data.recentlyAdded.length, 1);
  assert.equal(body.data.recentlyAdded[0].slug, "acme");
  assert.equal(body.data.recentlyAdded[0].createdAt, "2026-06-01T00:00:00Z");
  assert.equal(body.data.newFunding[0].investorNames[0], "Acme Capital");
  assert.equal(body.data.unlockAlerts[0].unlockType, "Ecosystem");
  assert.ok(body.data.marketOverview);
  assert.equal(body.data.marketOverview.assets[0].symbol, "ACM");
  assert.equal(body.data.marketOverview.assets[0].priceUsd, 50000);
  assert.equal(body.data.marketOverview.totalMarketCapUsd, 1_000_000_000);
});

test("GET /api/home returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    weekly_rankings_mv: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetHome(new Request("http://localhost/api/home"), supabase);
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});
