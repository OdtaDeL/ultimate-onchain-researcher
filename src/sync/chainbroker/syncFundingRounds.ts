import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { runPagedSync } from "./paged-sync";
import type { FundingRoundsSyncReport, SyncJobOptions } from "./types";

/**
 * Full sync of the global recent-funding-rounds feed into
 * `funding_rounds`/`funding_investors`. Requires `syncProjects` to have
 * run first — projects referenced by this feed that don't exist locally
 * yet are skipped (see ingestion-service.ts), not fabricated.
 * Idempotent: `funding_investors` upserts on its real unique constraint;
 * `funding_rounds` uses find-or-create (no unique constraint exists on
 * that table yet — see upsert-service.ts) which is idempotent in effect
 * but not enforced at the database level.
 */
export async function syncFundingRounds(
  ingestion: ChainBrokerIngestionService,
  options: SyncJobOptions = {},
): Promise<FundingRoundsSyncReport> {
  const outcome = await runPagedSync(
    "syncFundingRounds",
    (page) => ingestion.ingestRecentFundingRounds(page),
    (result) => result.fundingRoundsUpserted,
    options,
  );

  const skippedUnknownProjectSlugs = [
    ...new Set(outcome.pageResults.flatMap((r) => r.skippedUnknownProjectSlugs)),
  ];

  return {
    job: "syncFundingRounds",
    startedAt: outcome.startedAt,
    finishedAt: outcome.finishedAt,
    durationMs: outcome.durationMs,
    succeeded: outcome.succeeded,
    pagesProcessed: outcome.pagesProcessed,
    totalPages: outcome.totalPages,
    failedPages: outcome.failedPages,
    fundingRoundsUpserted: outcome.pageResults.reduce((sum, r) => sum + r.fundingRoundsUpserted, 0),
    investorsUpserted: outcome.pageResults.reduce((sum, r) => sum + r.investorsUpserted, 0),
    fundingInvestorLinksUpserted: outcome.pageResults.reduce(
      (sum, r) => sum + r.fundingInvestorLinksUpserted,
      0,
    ),
    skippedUnknownProjectSlugs,
  };
}
