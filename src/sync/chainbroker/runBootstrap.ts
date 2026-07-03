// Orchestrates the full ChainBroker bootstrap:
//
//   Projects -> Funds -> Funding Rounds -> Unlock Events -> Persist Sync Metadata
//
// This is the fix for the bug the bootstrap verification run exposed:
// metadata persistence used to happen *inside* syncBootstrapProjects,
// before syncBootstrapFunds ran, with a throwing contract — so a failed
// metadata write (sync_runs not existing) silently skipped every job
// after the first. Here, metadata persistence is its own phase, after
// every data job has already run, using recordSyncRun() which never
// throws (src/sync/sync-metadata.ts). A metadata failure can be logged,
// but by the time it happens, ingestion has already completed — there is
// nothing left for it to block.
//
// None of the four syncBootstrapX wrappers called below can throw either
// (paged-sync.ts and syncFunds.ts already catch their own failures into
// `succeeded`/`failedPages`) — confirmed by reading both before this
// change. So phases 1-4 always run to completion regardless of any
// individual job's outcome.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { createLogger, type Logger } from "./logger";
import { recordSyncRun, type SyncRunRecord } from "../sync-metadata";
import { syncBootstrapFunds } from "./syncBootstrapFunds";
import { syncBootstrapFundingRounds } from "./syncBootstrapFundingRounds";
import { syncBootstrapProjects } from "./syncBootstrapProjects";
import { syncBootstrapUnlocks } from "./syncBootstrapUnlocks";
import type {
  BootstrapFundingRoundsReport,
  BootstrapFundsReport,
  BootstrapProjectsReport,
  BootstrapUnlocksReport,
  ChainBrokerBootstrapReport,
  SyncJobOptions,
} from "./types";

const PROVIDER = "chainbroker";

function summarizeFailure(failedPages: number[]): string | null {
  if (failedPages.length === 0) return null;
  return `${failedPages.length} page(s) failed after retries: [${failedPages.join(", ")}] — see structured logs for the underlying error on each.`;
}

function projectsToRecord(report: BootstrapProjectsReport): SyncRunRecord {
  return {
    provider: PROVIDER,
    jobName: report.job,
    status: report.succeeded ? "succeeded" : "failed",
    startedAt: report.startedAt,
    completedAt: report.finishedAt,
    durationMs: report.durationMs,
    pagesProcessed: report.totalPages,
    itemsProcessed: report.totalProjects,
    itemsInserted: null,
    itemsUpdated: null,
    itemsSkipped: 0,
    failedPages: report.failedPages,
    lastError: summarizeFailure(report.failedPages),
  };
}

function fundsToRecord(report: BootstrapFundsReport): SyncRunRecord {
  return {
    provider: PROVIDER,
    jobName: report.job,
    status: report.succeeded ? "succeeded" : "failed",
    startedAt: report.startedAt,
    completedAt: report.finishedAt,
    durationMs: report.durationMs,
    pagesProcessed: report.totalPages,
    itemsProcessed: report.totalFunds,
    itemsInserted: null,
    itemsUpdated: null,
    itemsSkipped: 0,
    failedPages: [],
    lastError: report.succeeded ? null : "syncFunds reported failure — see structured logs.",
  };
}

function fundingRoundsToRecord(report: BootstrapFundingRoundsReport): SyncRunRecord {
  return {
    provider: PROVIDER,
    jobName: report.job,
    status: report.succeeded ? "succeeded" : "failed",
    startedAt: report.startedAt,
    completedAt: report.finishedAt,
    durationMs: report.durationMs,
    pagesProcessed: report.pagesProcessed,
    itemsProcessed: report.fundingRoundsUpserted,
    itemsInserted: null,
    itemsUpdated: null,
    itemsSkipped: report.skippedUnknownProjectSlugs.length,
    failedPages: report.failedPages,
    lastError: summarizeFailure(report.failedPages),
  };
}

function unlocksToRecord(report: BootstrapUnlocksReport): SyncRunRecord {
  return {
    provider: PROVIDER,
    jobName: report.job,
    status: report.succeeded ? "succeeded" : "failed",
    startedAt: report.startedAt,
    completedAt: report.finishedAt,
    durationMs: report.durationMs,
    pagesProcessed: report.pagesProcessed,
    itemsProcessed: report.unlockEventsUpserted,
    itemsInserted: null,
    itemsUpdated: null,
    itemsSkipped: report.skippedUnknownProjectSlugs.length,
    failedPages: report.failedPages,
    lastError: summarizeFailure(report.failedPages),
  };
}

export async function runChainBrokerBootstrap(
  ingestion: ChainBrokerIngestionService,
  supabase: SupabaseClient<Database>,
  options: SyncJobOptions = {},
): Promise<ChainBrokerBootstrapReport> {
  const logger: Logger = options.logger ?? createLogger({ job: "bootstrap" });
  const startedAt = new Date();

  // --- Phase 1: data ingestion, in dependency order. -------------------
  const projects = await syncBootstrapProjects(ingestion, {
    ...options,
    logger: logger.child({ job: "syncBootstrapProjects" }),
  });
  const funds = await syncBootstrapFunds(ingestion, {
    ...options,
    logger: logger.child({ job: "syncBootstrapFunds" }),
  });
  const fundingRounds = await syncBootstrapFundingRounds(ingestion, {
    ...options,
    logger: logger.child({ job: "syncBootstrapFundingRounds" }),
  });
  const unlocks = await syncBootstrapUnlocks(ingestion, {
    ...options,
    logger: logger.child({ job: "syncBootstrapUnlocks" }),
  });

  // --- Phase 2: best-effort metadata persistence. -----------------------
  // Runs unconditionally, after phase 1 has already fully completed.
  // recordSyncRun() never throws — a failure here is logged and moved
  // past, exactly per "metadata failures must never prevent ingestion."
  for (const record of [
    projectsToRecord(projects),
    fundsToRecord(funds),
    fundingRoundsToRecord(fundingRounds),
    unlocksToRecord(unlocks),
  ]) {
    await recordSyncRun(supabase, logger, record);
  }

  const finishedAt = new Date();

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    succeeded: projects.succeeded && funds.succeeded && fundingRounds.succeeded && unlocks.succeeded,
    projects,
    funds,
    fundingRounds,
    unlocks,
  };
}
