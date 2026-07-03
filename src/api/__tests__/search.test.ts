import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGetSearch } from "../search";
import { createMockSupabase, rows } from "./mock-supabase";

test("GET /api/search returns matching projects and funds", async () => {
  const supabase = createMockSupabase({
    projects: () => rows([{ id: "p1", slug: "aave-v3", name: "Aave V3", ticker: "AAVE", logo_url: null }]),
    project_scores: () => rows([{ project_id: "p1", total_score: 76, score_date: "2026-06-25" }]),
    funds: () => rows([{ id: "f1", slug: "aave-fund", name: "Aave Fund", logo_url: null }]),
  });

  const response = await handleGetSearch(new Request("http://localhost/api/search?q=aave"), supabase);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.projects[0].slug, "aave-v3");
  assert.equal(body.data.projects[0].totalScore, 76);
  assert.equal(body.data.funds[0].slug, "aave-fund");
  assert.equal(body.data.pagination.projects.totalItems, 1);
  assert.equal(body.data.pagination.funds.totalItems, 1);
});

test("GET /api/search returns 400 when q is missing", async () => {
  const supabase = createMockSupabase({});

  const response = await handleGetSearch(new Request("http://localhost/api/search"), supabase);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "BAD_REQUEST");
});

test("GET /api/search returns 400 when q exceeds 200 characters", async () => {
  const supabase = createMockSupabase({});
  const longQuery = "a".repeat(201);

  const response = await handleGetSearch(new Request(`http://localhost/api/search?q=${longQuery}`), supabase);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "BAD_REQUEST");
});

test("GET /api/search returns 500 when the Dashboard Query Layer fails", async () => {
  const supabase = createMockSupabase({
    projects: () => ({ data: null, error: { message: "connection refused" } }),
  });

  const response = await handleGetSearch(new Request("http://localhost/api/search?q=aave"), supabase);
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INTERNAL_ERROR");
});

test("GET /api/search?type=funds skips the projects search entirely", async () => {
  let projectsQueryCount = 0;
  const supabase = createMockSupabase({
    funds: () => rows([{ id: "f1", slug: "aave-fund", name: "Aave Fund", logo_url: null }]),
    projects: () => {
      projectsQueryCount += 1;
      return rows([]);
    },
  });

  const response = await handleGetSearch(new Request("http://localhost/api/search?q=aave&type=funds"), supabase);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.data.projects.length, 0);
  assert.equal(body.data.funds.length, 1);
  assert.equal(projectsQueryCount, 0, "searchProjects should not run when type=funds");
});
