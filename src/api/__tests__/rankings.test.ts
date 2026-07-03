import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGetFundRankings, handleGetMonthlyRankings, handleGetWeeklyRankings } from "../rankings";
import { createMockSupabase, rows } from "./mock-supabase";

test("GET /api/rankings/weekly paginates weekly_rankings_mv", async () => {
  const supabase = createMockSupabase({
    weekly_rankings_mv: () =>
      rows([
        { project_id: "p1", week_start: "2026-06-22", total_score: 91, rank: 1 },
        { project_id: "p2", week_start: "2026-06-22", total_score: 85, rank: 2 },
      ]),
    projects: () =>
      rows([
        { id: "p1", slug: "acme", name: "Acme", logo_url: null },
        { id: "p2", slug: "beta", name: "Beta", logo_url: null },
      ]),
  });

  const response = await handleGetWeeklyRankings(
    new Request("http://localhost/api/rankings/weekly?page=1&pageSize=1"),
    supabase,
  );
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].slug, "acme");
  assert.equal(body.pagination.pageSize, 1);
  assert.equal(body.pagination.hasNextPage, true);
});

test("GET /api/rankings/monthly paginates monthly_rankings_mv", async () => {
  const supabase = createMockSupabase({
    monthly_rankings_mv: () => rows([{ project_id: "p1", month_start: "2026-06-01", total_score: 91, rank: 1 }]),
    projects: () => rows([{ id: "p1", slug: "acme", name: "Acme", logo_url: null }]),
  });

  const response = await handleGetMonthlyRankings(new Request("http://localhost/api/rankings/monthly"), supabase);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data[0].slug, "acme");
  assert.equal(body.data[0].monthStart, "2026-06-01");
});

test("GET /api/rankings/monthly returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    monthly_rankings_mv: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetMonthlyRankings(new Request("http://localhost/api/rankings/monthly"), supabase);
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});

test("GET /api/rankings/weekly returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    weekly_rankings_mv: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetWeeklyRankings(new Request("http://localhost/api/rankings/weekly"), supabase);
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});

test("GET /api/rankings/funds returns top_funds list with slug", async () => {
  const supabase = createMockSupabase({
    top_funds: () =>
      rows([
        { fund_id: "f1", name: "Acme Capital", logo_url: null, portfolio_project_count: 5, avg_investor_score: 80, rank: 1 },
      ]),
    funds: () => rows([{ id: "f1", slug: "acme-capital" }]),
  });

  const response = await handleGetFundRankings(new Request("http://localhost/api/rankings/funds"), supabase);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].slug, "acme-capital");
  assert.equal(body.data[0].portfolioProjectCount, 5);
});

test("GET /api/rankings/funds returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    top_funds: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetFundRankings(new Request("http://localhost/api/rankings/funds"), supabase);
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});
