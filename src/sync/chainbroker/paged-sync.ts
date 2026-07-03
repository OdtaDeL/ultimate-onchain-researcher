// Shared control flow for the three paged sync jobs (syncProjects,
// syncFundingRounds, syncUnlocks). Each page-ingestion call is idempotent
// on its own (the ingestion service's upserts guarantee that — see
// src/ingestion/chainbroker/upsert-service.ts), so re-running this loop,
// in part or in full, never duplicates data. A failed page is retried
// with backoff, then recorded in `failedPages` and skipped rather than
// aborting the whole job — one bad page shouldn't block 94 good ones.

import { createLogger } from "./logger";
import { withRetry } from "./retry";
import type { SyncJobOptions } from "./types";

export interface PagedFetchResult {
  page: number;
  totalPages: number;
}

export interface PagedSyncOutcome<TPageResult> {
  pagesProcessed: number;
  totalPages: number;
  failedPages: number[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  succeeded: boolean;
  pageResults: TPageResult[];
}

const DEFAULT_RETRY = { maxAttempts: 3, baseDelayMs: 1000 };

export async function runPagedSync<TPageResult extends PagedFetchResult>(
  job: string,
  fetchPage: (page: number) => Promise<TPageResult>,
  /** Extracts the job-specific "items upserted on this page" count, for progress reporting. */
  getPageItemCount: (result: TPageResult) => number,
  options: SyncJobOptions,
): Promise<PagedSyncOutcome<TPageResult>> {
  const logger = options.logger ?? createLogger({ job });
  const retryConfig = options.retry ?? DEFAULT_RETRY;
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  const startedAt = new Date();
  logger.info("sync.start", { maxPages: options.maxPages ?? null });

  let page = 1;
  let totalPages = 1;
  let itemsUpserted = 0;
  const failedPages: number[] = [];
  const pageResults: TPageResult[] = [];

  while (page <= totalPages && page <= maxPages) {
    try {
      const result = await withRetry(() => fetchPage(page), {
        ...retryConfig,
        onRetry: (attempt, error) =>
          logger.warn("sync.page.retry", { page, attempt, error: String(error) }),
      });
      totalPages = result.totalPages;
      pageResults.push(result);
      itemsUpserted += getPageItemCount(result);
      logger.info("sync.page.complete", { page: result.page, totalPages });
      options.onProgress?.({ job, page: result.page, totalPages, itemsUpserted });
    } catch (error) {
      logger.error("sync.page.failed", { page, error: String(error) });
      failedPages.push(page);
    }
    page++;
  }

  const finishedAt = new Date();
  const outcome: PagedSyncOutcome<TPageResult> = {
    pagesProcessed: pageResults.length,
    totalPages,
    failedPages,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    succeeded: failedPages.length === 0,
    pageResults,
  };
  logger.info("sync.complete", {
    pagesProcessed: outcome.pagesProcessed,
    totalPages: outcome.totalPages,
    failedPages: outcome.failedPages,
    durationMs: outcome.durationMs,
    succeeded: outcome.succeeded,
  });
  return outcome;
}
