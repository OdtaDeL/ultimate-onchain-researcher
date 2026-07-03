// Persists sync job outcomes into `sync_runs` (supabase/migrations/
// 004_sync_metadata.sql). Lives outside src/sync/chainbroker/ on purpose:
// this table and this helper are provider-agnostic — ChainBroker is the
// only caller today, but CoinGecko/DefiLlama/future providers' sync jobs
// should write to the same table through this same function.
//
// Metadata persistence is best-effort: recordSyncRun() never throws. A
// failed write is logged and swallowed. The whole point of this module
// existing separately from the data-sync jobs is that bookkeeping must
// never be able to abort or block ingestion — see runBootstrap.ts for the
// orchestration that depends on this guarantee.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { Logger } from "./chainbroker/logger";

// Supabase/Postgrest errors are plain objects with a `.message`, not
// `Error` instances — `String(error)` on them gives "[object Object]".
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export interface SyncRunRecord {
  provider: string;
  jobName: string;
  status: "succeeded" | "failed";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pagesProcessed: number | null;
  itemsProcessed: number | null;
  itemsInserted: number | null;
  itemsUpdated: number | null;
  itemsSkipped: number | null;
  failedPages: number[];
  lastError: string | null;
}

export async function recordSyncRun(
  supabase: SupabaseClient<Database>,
  logger: Logger,
  record: SyncRunRecord,
): Promise<void> {
  try {
    const { error } = await supabase.from("sync_runs").insert({
      provider: record.provider,
      job_name: record.jobName,
      status: record.status,
      started_at: record.startedAt,
      completed_at: record.completedAt,
      duration_ms: record.durationMs,
      pages_processed: record.pagesProcessed,
      items_processed: record.itemsProcessed,
      items_inserted: record.itemsInserted,
      items_updated: record.itemsUpdated,
      items_skipped: record.itemsSkipped,
      failed_pages: record.failedPages,
      last_error: record.lastError,
    });
    if (error) throw error;
  } catch (error) {
    logger.error("sync_metadata.persist_failed", {
      provider: record.provider,
      jobName: record.jobName,
      error: describeError(error),
    });
  }
}

/**
 * For future use: lets a dependent job check whether a prerequisite
 * bootstrap job has ever succeeded, instead of assuming it blindly. Not
 * currently called by any job. Fail-soft like recordSyncRun, for the same
 * reason — a metadata read going wrong shouldn't be able to break a sync
 * job either.
 */
export async function hasJobEverSucceeded(
  supabase: SupabaseClient<Database>,
  logger: Logger,
  provider: string,
  jobName: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("sync_runs")
      .select("id")
      .eq("provider", provider)
      .eq("job_name", jobName)
      .eq("status", "succeeded")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  } catch (error) {
    logger.error("sync_metadata.query_failed", { provider, jobName, error: describeError(error) });
    return false;
  }
}
