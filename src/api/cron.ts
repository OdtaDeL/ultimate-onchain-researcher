// Cron handler — called by Vercel Cron on the schedule in vercel.json.
// Runs the full sync pipeline: ChainBroker (projects/funds/rounds/unlocks)
// → market metrics (CoinGecko + DefiLlama) → scoring engine → freshness check.
//
// Each phase is isolated: a ChainBroker failure does NOT abort metrics or
// scoring. Per-phase results are logged and returned in the response body so
// failures are visible in Vercel function logs without Sentry.
//
// Security: when CRON_SECRET is set, requires Authorization: Bearer <secret>.
// Vercel sets that header automatically on cron invocations; absent the var,
// auth is skipped (safe for development). Mirrors the TELEGRAM_BOT_TOKEN
// pattern in src/proxy.ts.
//
// Testability: callers inject `runSync` so tests verify auth and response
// shape without triggering real network/DB calls.

import { env } from "@/config/env";
import { ChainBrokerClient } from "../providers/chainbroker/client";
import { ChainBrokerIngestionService } from "../ingestion/chainbroker/ingestion-service";
import { ChainBrokerUpsertService } from "../ingestion/chainbroker/upsert-service";
import { createIngestionSupabaseClient } from "../ingestion/chainbroker/supabase-client";
import { syncFunds } from "../sync/chainbroker/syncFunds";
import { syncFundingRounds } from "../sync/chainbroker/syncFundingRounds";
import { syncProjects } from "../sync/chainbroker/syncProjects";
import { syncUnlocks } from "../sync/chainbroker/syncUnlocks";
import { syncCoinGeckoMetrics, syncDefiLlamaMetrics } from "../ingestion/metrics/syncMetrics";
import { CoinGeckoClient } from "../providers/coingecko/client";
import { DefiLlamaClient } from "../providers/defillama/client";
import { runScoringSync } from "../scoring-sync/scoring-sync";

export interface PhaseResult {
  succeeded: boolean;
  durationMs: number;
  error?: string;
}

export interface FreshnessResult {
  /** Most recent score_date from project_scores, or null if no rows exist. */
  latestScoreDate: string | null;
  /** True when latestScoreDate is null or older than thresholdHours. */
  isStale: boolean;
  thresholdHours: number;
}

export interface SyncResult {
  chainbroker: PhaseResult;
  metrics: PhaseResult;
  scoring: PhaseResult;
  freshness: FreshnessResult;
}

async function runPhase(label: string, fn: () => Promise<unknown>): Promise<PhaseResult> {
  const start = Date.now();
  try {
    await fn();
    const result: PhaseResult = { succeeded: true, durationMs: Date.now() - start };
    console.log(JSON.stringify({ event: "cron.phase.complete", phase: label, ...result }));
    return result;
  } catch (error) {
    const message = (error as { message?: string })?.message ?? String(error);
    const result: PhaseResult = { succeeded: false, durationMs: Date.now() - start, error: message };
    console.error(JSON.stringify({ event: "cron.phase.failed", phase: label, ...result }));
    return result;
  }
}

// 25 h = 24 h cadence + 1 h grace period.
const FRESHNESS_THRESHOLD_HOURS = 25;

type IngestionClient = ReturnType<typeof createIngestionSupabaseClient>;

/** Queries project_scores for the most recent score_date. Never throws. */
async function checkFreshness(supabase: IngestionClient): Promise<FreshnessResult> {
  try {
    const { data, error } = await supabase
      .from("project_scores")
      .select("score_date")
      .order("score_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(JSON.stringify({ event: "cron.freshness.error", error: error.message }));
      return { latestScoreDate: null, isStale: true, thresholdHours: FRESHNESS_THRESHOLD_HOURS };
    }

    const latestScoreDate = data?.score_date ?? null;
    const ageMs = latestScoreDate === null ? Infinity : Date.now() - new Date(latestScoreDate).getTime();
    const isStale = ageMs > FRESHNESS_THRESHOLD_HOURS * 3_600_000;

    if (isStale) {
      console.warn(JSON.stringify({ event: "cron.freshness.stale", latestScoreDate, thresholdHours: FRESHNESS_THRESHOLD_HOURS }));
    } else {
      console.log(JSON.stringify({ event: "cron.freshness.ok", latestScoreDate, thresholdHours: FRESHNESS_THRESHOLD_HOURS }));
    }

    return { latestScoreDate, isStale, thresholdHours: FRESHNESS_THRESHOLD_HOURS };
  } catch (error) {
    const message = (error as { message?: string })?.message ?? String(error);
    console.error(JSON.stringify({ event: "cron.freshness.error", error: message }));
    return { latestScoreDate: null, isStale: true, thresholdHours: FRESHNESS_THRESHOLD_HOURS };
  }
}

// Page-level retry options for ChainBroker jobs (retries each page independently,
// not the whole job). 3 attempts with 2 s base delay and exponential back-off + jitter.
const CHAINBROKER_RETRY = { maxAttempts: 3, baseDelayMs: 2_000 };

/** Runs all three sync phases with per-phase isolation. Never throws. */
export async function runFullSync(): Promise<SyncResult> {
  const supabase = createIngestionSupabaseClient();

  const chainbroker = await runPhase("chainbroker", async () => {
    const client = new ChainBrokerClient();
    const upserts = new ChainBrokerUpsertService(supabase);
    const ingestion = new ChainBrokerIngestionService(client, upserts);
    await syncProjects(ingestion, { retry: CHAINBROKER_RETRY });
    await syncFunds(ingestion, { retry: CHAINBROKER_RETRY });
    await syncFundingRounds(ingestion, { retry: CHAINBROKER_RETRY });
    await syncUnlocks(ingestion, { retry: CHAINBROKER_RETRY });
  });

  const metrics = await runPhase("metrics", async () => {
    await syncCoinGeckoMetrics(supabase, new CoinGeckoClient());
    await syncDefiLlamaMetrics(supabase, new DefiLlamaClient());
  });

  const scoring = await runPhase("scoring", async () => {
    await runScoringSync(supabase, {});
  });

  const freshness = await checkFreshness(supabase);

  return { chainbroker, metrics, scoring, freshness };
}

export async function handleCronSync(
  request: Request,
  runSync: () => Promise<SyncResult> = runFullSync,
): Promise<Response> {
  const cronSecret = env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing cron secret." } },
        { status: 401 },
      );
    }
  }

  const start = Date.now();
  const { chainbroker, metrics, scoring, freshness } = await runSync();
  const success = chainbroker.succeeded && metrics.succeeded && scoring.succeeded;
  const durationMs = Date.now() - start;

  console.log(JSON.stringify({ event: "cron.sync.complete", success, durationMs, freshnessStale: freshness.isStale }));

  return Response.json({ success, durationMs, phases: { chainbroker, metrics, scoring }, freshness });
}
