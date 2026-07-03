import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { runPagedSync } from "./paged-sync";
import type { SyncJobOptions, UnlocksSyncReport } from "./types";

/**
 * Full sync of the global upcoming-unlocks feed into `token_unlock_events`.
 * Requires `syncProjects` to have run first — same skip-don't-fabricate
 * rule as syncFundingRounds.
 * Idempotent via find-or-create (no unique constraint on this table yet
 * — see upsert-service.ts for the matching heuristic used).
 */
export async function syncUnlocks(
  ingestion: ChainBrokerIngestionService,
  options: SyncJobOptions = {},
): Promise<UnlocksSyncReport> {
  const outcome = await runPagedSync(
    "syncUnlocks",
    (page) => ingestion.ingestUpcomingUnlocks(page),
    (result) => result.unlockEventsUpserted,
    options,
  );

  const skippedUnknownProjectSlugs = [
    ...new Set(outcome.pageResults.flatMap((r) => r.skippedUnknownProjectSlugs)),
  ];

  return {
    job: "syncUnlocks",
    startedAt: outcome.startedAt,
    finishedAt: outcome.finishedAt,
    durationMs: outcome.durationMs,
    succeeded: outcome.succeeded,
    pagesProcessed: outcome.pagesProcessed,
    totalPages: outcome.totalPages,
    failedPages: outcome.failedPages,
    unlockEventsUpserted: outcome.pageResults.reduce((sum, r) => sum + r.unlockEventsUpserted, 0),
    skippedUnknownProjectSlugs,
  };
}
