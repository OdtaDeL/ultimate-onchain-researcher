import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { handleCronSync } from "../cron";
import type { SyncResult, FreshnessResult } from "../cron";

// Restore CRON_SECRET after each test that modifies it.
const originalCronSecret = process.env.CRON_SECRET;
afterEach(() => {
  if (originalCronSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }
});

const freshResult: FreshnessResult = {
  latestScoreDate: "2026-07-03",
  isStale: false,
  thresholdHours: 25,
};

const staleResult: FreshnessResult = {
  latestScoreDate: null,
  isStale: true,
  thresholdHours: 25,
};

const allSucceeded: SyncResult = {
  chainbroker: { succeeded: true, durationMs: 10 },
  metrics: { succeeded: true, durationMs: 5 },
  scoring: { succeeded: true, durationMs: 3 },
  freshness: freshResult,
};

const chainbrokerFailed: SyncResult = {
  chainbroker: { succeeded: false, durationMs: 10, error: "connection refused" },
  metrics: { succeeded: true, durationMs: 5 },
  scoring: { succeeded: true, durationMs: 3 },
  freshness: staleResult,
};

const noopSync = async (): Promise<SyncResult> => allSucceeded;

test("GET /api/cron/sync passes through when CRON_SECRET is not configured", async () => {
  delete process.env.CRON_SECRET;
  const response = await handleCronSync(new Request("http://localhost/api/cron/sync"), noopSync);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.durationMs === "number");
  assert.ok(body.phases);
  assert.ok(body.freshness);
  assert.equal(body.freshness.isStale, false);
  assert.equal(body.freshness.thresholdHours, 25);
});

test("GET /api/cron/sync returns 401 when CRON_SECRET is set and Authorization header is absent", async () => {
  process.env.CRON_SECRET = "test-secret-abc";
  const response = await handleCronSync(new Request("http://localhost/api/cron/sync"), noopSync);
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("GET /api/cron/sync returns 401 when CRON_SECRET is set and Bearer token is wrong", async () => {
  process.env.CRON_SECRET = "test-secret-abc";
  const response = await handleCronSync(
    new Request("http://localhost/api/cron/sync", {
      headers: { Authorization: "Bearer wrong-token" },
    }),
    noopSync,
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("GET /api/cron/sync returns 200 when CRON_SECRET is set and Bearer token is correct", async () => {
  process.env.CRON_SECRET = "test-secret-abc";
  const response = await handleCronSync(
    new Request("http://localhost/api/cron/sync", {
      headers: { Authorization: "Bearer test-secret-abc" },
    }),
    noopSync,
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(body.phases.chainbroker.succeeded);
  assert.ok(body.phases.metrics.succeeded);
  assert.ok(body.phases.scoring.succeeded);
  assert.equal(body.freshness.latestScoreDate, "2026-07-03");
});

test("GET /api/cron/sync returns 200 with success: false when a phase fails", async () => {
  delete process.env.CRON_SECRET;
  const response = await handleCronSync(
    new Request("http://localhost/api/cron/sync"),
    async () => chainbrokerFailed,
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.phases.chainbroker.succeeded, false);
  assert.equal(body.phases.chainbroker.error, "connection refused");
  // metrics and scoring still ran
  assert.equal(body.phases.metrics.succeeded, true);
  assert.equal(body.phases.scoring.succeeded, true);
  // freshness is stale when chainbroker failed
  assert.equal(body.freshness.isStale, true);
  assert.equal(body.freshness.latestScoreDate, null);
});
