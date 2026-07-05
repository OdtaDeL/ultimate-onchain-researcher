import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../../app/api/health/route";

test("GET /api/health returns 200 with status ok", async () => {
  const response = await GET();
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.ok(typeof body.timestamp === "string", "timestamp should be a string");
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)), "timestamp should be a valid ISO date");
});
