import type { ChainBrokerIngestionService } from "../../ingestion/chainbroker/ingestion-service";
import { createLogger } from "./logger";
import { withRetry } from "./retry";
import type { FundsSyncReport, SyncJobOptions } from "./types";

const DEFAULT_RETRY = { maxAttempts: 3, baseDelayMs: 1000 };

/**
 * Full sync of the ChainBroker fund directory into `funds`. Not paged —
 * ChainBroker's `/funds/simple-list/` returns the entire directory (417
 * funds as of the source investigation) in one response.
 * Idempotent: upserts on the table's unique `name` constraint.
 */
export async function syncFunds(
  ingestion: ChainBrokerIngestionService,
  options: SyncJobOptions = {},
): Promise<FundsSyncReport> {
  const logger = options.logger ?? createLogger({ job: "syncFunds" });
  const retryConfig = options.retry ?? DEFAULT_RETRY;
  const startedAt = new Date();
  logger.info("sync.start", {});

  let fundsUpserted = 0;
  let succeeded = true;
  try {
    const result = await withRetry(() => ingestion.ingestFunds(), {
      ...retryConfig,
      onRetry: (attempt, error) => logger.warn("sync.retry", { attempt, error: String(error) }),
    });
    fundsUpserted = result.fundsUpserted;
    options.onProgress?.({ job: "syncFunds", page: 1, totalPages: 1, itemsUpserted: fundsUpserted });
  } catch (error) {
    succeeded = false;
    logger.error("sync.failed", { error: String(error) });
  }

  const finishedAt = new Date();
  const report: FundsSyncReport = {
    job: "syncFunds",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    succeeded,
    fundsUpserted,
  };
  logger.info("sync.complete", { ...report });
  return report;
}
