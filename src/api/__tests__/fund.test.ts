import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGetFund } from "../fund";
import { createMockSupabase, getEq, rows, type RecordedFilter } from "./mock-supabase";

const FUND_ROW = {
  id: "f1",
  slug: "acme-capital",
  name: "Acme Capital",
  logo_url: null,
  website: null,
  twitter: null,
  description: "A fund.",
};

function fundsHandler(filters: RecordedFilter[]) {
  const slug = getEq(filters, "slug");
  if (slug !== undefined) {
    return slug === FUND_ROW.slug ? { data: FUND_ROW, error: null } : { data: null, error: null };
  }
  return rows([FUND_ROW]);
}

test("GET /api/funds/:slug returns overview and a paginated portfolio", async () => {
  const supabase = createMockSupabase({
    funds: fundsHandler,
    top_funds: () => ({ data: { portfolio_project_count: 2, avg_investor_score: 80, rank: 2 }, error: null }),
    funding_investors: () => rows([{ funding_round_id: "r1" }, { funding_round_id: "r2" }]),
    funding_rounds: () =>
      rows([
        { id: "r1", project_id: "p1", round_type: "Seed", announced_date: "2026-01-01" },
        { id: "r2", project_id: "p2", round_type: "Series A", announced_date: "2026-02-01" },
      ]),
    projects: () =>
      rows([
        { id: "p1", slug: "acme", name: "Acme", logo_url: null },
        { id: "p2", slug: "beta", name: "Beta", logo_url: null },
      ]),
    project_scores: () =>
      rows([
        { project_id: "p1", total_score: 88, score_date: "2026-06-20" },
        { project_id: "p2", total_score: 70, score_date: "2026-06-21" },
      ]),
  });

  const response = await handleGetFund(
    new Request("http://localhost/api/funds/acme-capital?page=1&pageSize=1"),
    supabase,
    { slug: "acme-capital" },
  );
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.overview.name, "Acme Capital");
  assert.equal(body.data.portfolio.projects.length, 1);
  assert.equal(body.pagination.totalItems, 2);
  assert.equal(body.pagination.totalPages, 2);
  assert.equal(body.pagination.hasNextPage, true);
});

test("GET /api/funds/:slug returns 404 for an unknown slug", async () => {
  const supabase = createMockSupabase({ funds: fundsHandler });

  const response = await handleGetFund(new Request("http://localhost/api/funds/does-not-exist"), supabase, {
    slug: "does-not-exist",
  });
  assert.equal(response.status, 404);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("GET /api/funds/:slug returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    funds: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetFund(new Request("http://localhost/api/funds/acme-capital"), supabase, {
    slug: "acme-capital",
  });
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});
