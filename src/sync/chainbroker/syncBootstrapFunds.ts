// Bootstrap sync: populates the ENTIRE ChainBroker fund directory.
// syncFunds is already a full, unpaginated sync (the source API returns
// all funds in one response — see SOURCE.md), so this wrapper's only job
// is relabeling the report under the "syncBootstrapFunds" job name,
// distinct from a plain incremental "syncFunds" run.
//
// Pure data-sync wrapper — no metadata persistence here, same reasoning
// as syncBootstrapProjects.ts. See runBootstrap.ts.

import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { syncFunds } from "./syncFunds";
import type { BootstrapFundsReport, SyncJobOptions } from "./types";

export async function syncBootstrapFunds(
  ingestion: ChainBrokerIngestionService,
  options: SyncJobOptions = {},
): Promise<BootstrapFundsReport> {
  const result = await syncFunds(ingestion, options);

  return {
    job: "syncBootstrapFunds",
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    succeeded: result.succeeded,
    totalPages: 1,
    totalFunds: result.fundsUpserted,
  };
}
