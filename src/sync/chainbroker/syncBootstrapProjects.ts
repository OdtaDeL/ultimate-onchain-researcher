// Bootstrap sync: populates the ENTIRE ChainBroker project catalog (no
// page cap), unlike syncProjects which accepts a maxPages option for
// partial/dev runs.
//
// Pure data-sync wrapper — no metadata persistence here. Metadata
// recording is a separate, best-effort phase owned by runBootstrap.ts,
// which runs after ALL bootstrap data jobs complete. See runBootstrap.ts
// for why: a metadata write failing must never prevent this or any other
// job from running.

import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { syncProjects } from "./syncProjects";
import type { BootstrapProjectsReport, SyncJobOptions } from "./types";

export async function syncBootstrapProjects(
  ingestion: ChainBrokerIngestionService,
  options: Omit<SyncJobOptions, "maxPages"> = {},
): Promise<BootstrapProjectsReport> {
  const result = await syncProjects(ingestion, { ...options, maxPages: undefined });

  return {
    job: "syncBootstrapProjects",
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    succeeded: result.succeeded,
    totalPages: result.totalPages,
    totalProjects: result.projectsUpserted,
    failedPages: result.failedPages,
  };
}
