// Bootstrap sync: populates the ENTIRE ChainBroker unlocks feed (no page
// cap) — the fourth and final data-sync step in the bootstrap sequence.
//
// Pure data-sync wrapper — no metadata persistence here, same reasoning
// as syncBootstrapProjects.ts. See runBootstrap.ts.

import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { syncUnlocks } from "./syncUnlocks";
import type { BootstrapUnlocksReport, SyncJobOptions } from "./types";

export async function syncBootstrapUnlocks(
  ingestion: ChainBrokerIngestionService,
  options: Omit<SyncJobOptions, "maxPages"> = {},
): Promise<BootstrapUnlocksReport> {
  const result = await syncUnlocks(ingestion, { ...options, maxPages: undefined });

  return {
    job: "syncBootstrapUnlocks",
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    succeeded: result.succeeded,
    pagesProcessed: result.pagesProcessed,
    totalPages: result.totalPages,
    failedPages: result.failedPages,
    unlockEventsUpserted: result.unlockEventsUpserted,
    skippedUnknownProjectSlugs: result.skippedUnknownProjectSlugs,
  };
}
