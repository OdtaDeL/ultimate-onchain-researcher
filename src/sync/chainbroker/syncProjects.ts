import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { runPagedSync } from "./paged-sync";
import type { ProjectsSyncReport, SyncJobOptions } from "./types";

/**
 * Full sync of the ChainBroker project directory into `projects`.
 * Idempotent: each page upserts on the table's unique `slug` constraint
 * (see src/ingestion/chainbroker/upsert-service.ts), so re-running this
 * job — in full or resumed via maxPages — never creates duplicates.
 */
export async function syncProjects(
  ingestion: ChainBrokerIngestionService,
  options: SyncJobOptions = {},
): Promise<ProjectsSyncReport> {
  const outcome = await runPagedSync(
    "syncProjects",
    (page) => ingestion.ingestProjects(page),
    (result) => result.projectsUpserted,
    options,
  );

  return {
    job: "syncProjects",
    startedAt: outcome.startedAt,
    finishedAt: outcome.finishedAt,
    durationMs: outcome.durationMs,
    succeeded: outcome.succeeded,
    pagesProcessed: outcome.pagesProcessed,
    totalPages: outcome.totalPages,
    failedPages: outcome.failedPages,
    projectsUpserted: outcome.pageResults.reduce((sum, r) => sum + r.projectsUpserted, 0),
  };
}
