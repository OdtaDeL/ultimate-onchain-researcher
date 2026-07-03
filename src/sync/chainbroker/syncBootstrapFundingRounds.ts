// Bootstrap sync: populates the ENTIRE ChainBroker funding-rounds feed
// (no page cap) — the third step in the bootstrap sequence, after
// projects and funds have populated the base directory those rounds
// reference by slug.
//
// Pure data-sync wrapper — no metadata persistence here, same reasoning
// as syncBootstrapProjects.ts. See runBootstrap.ts.

import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { syncFundingRounds } from "./syncFundingRounds";
import type { BootstrapFundingRoundsReport, SyncJobOptions } from "./types";

export async function syncBootstrapFundingRounds(
  ingestion: ChainBrokerIngestionService,
  options: Omit<SyncJobOptions, "maxPages"> = {},
): Promise<BootstrapFundingRoundsReport> {
  const result = await syncFundingRounds(ingestion, { ...options, maxPages: undefined });

  return {
    job: "syncBootstrapFundingRounds",
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    succeeded: result.succeeded,
    pagesProcessed: result.pagesProcessed,
    totalPages: result.totalPages,
    failedPages: result.failedPages,
    fundingRoundsUpserted: result.fundingRoundsUpserted,
    investorsUpserted: result.investorsUpserted,
    fundingInvestorLinksUpserted: result.fundingInvestorLinksUpserted,
    skippedUnknownProjectSlugs: result.skippedUnknownProjectSlugs,
  };
}
