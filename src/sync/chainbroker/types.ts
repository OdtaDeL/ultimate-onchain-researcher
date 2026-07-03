import type { Logger } from "./logger";
import type { RetryOptions } from "./retry";

export interface SyncProgress {
  job: string;
  page: number;
  totalPages: number;
  /** Cumulative count of the job's primary upserted entity, through this page. */
  itemsUpserted: number;
}

export type ProgressReporter = (progress: SyncProgress) => void;

export interface SyncJobOptions {
  /** Caps how many pages a paged job processes — omit for a full sync. Mainly for dev/test runs. */
  maxPages?: number;
  logger?: Logger;
  onProgress?: ProgressReporter;
  retry?: Omit<RetryOptions, "onRetry">;
}

export interface BaseSyncJobReport {
  job: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  /** False if any page/operation failed all retry attempts — see failedPages where applicable. */
  succeeded: boolean;
}

export interface PagedSyncJobReport extends BaseSyncJobReport {
  pagesProcessed: number;
  totalPages: number;
  failedPages: number[];
}

export interface ProjectsSyncReport extends PagedSyncJobReport {
  projectsUpserted: number;
}

export interface FundsSyncReport extends BaseSyncJobReport {
  fundsUpserted: number;
}

export interface FundingRoundsSyncReport extends PagedSyncJobReport {
  fundingRoundsUpserted: number;
  investorsUpserted: number;
  fundingInvestorLinksUpserted: number;
  skippedUnknownProjectSlugs: string[];
}

export interface UnlocksSyncReport extends PagedSyncJobReport {
  unlockEventsUpserted: number;
  skippedUnknownProjectSlugs: string[];
}

export interface BootstrapProjectsReport extends BaseSyncJobReport {
  totalPages: number;
  totalProjects: number;
  failedPages: number[];
}

export interface BootstrapFundsReport extends BaseSyncJobReport {
  /** Always 1 — ChainBroker's fund directory has no native pagination, see SOURCE.md. */
  totalPages: number;
  totalFunds: number;
}

export interface BootstrapFundingRoundsReport extends PagedSyncJobReport {
  fundingRoundsUpserted: number;
  investorsUpserted: number;
  fundingInvestorLinksUpserted: number;
  skippedUnknownProjectSlugs: string[];
}

export interface BootstrapUnlocksReport extends PagedSyncJobReport {
  unlockEventsUpserted: number;
  skippedUnknownProjectSlugs: string[];
}

/** Combined report for the full ChainBroker bootstrap orchestration — see runBootstrap.ts. */
export interface ChainBrokerBootstrapReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  /** Reflects only the 4 data-sync jobs — metadata persistence failures never affect this. */
  succeeded: boolean;
  projects: BootstrapProjectsReport;
  funds: BootstrapFundsReport;
  fundingRounds: BootstrapFundingRoundsReport;
  unlocks: BootstrapUnlocksReport;
}
