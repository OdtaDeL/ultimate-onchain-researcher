// Orchestrates the ChainBroker client (fetch) -> mapper (Raw normalized ->
// Draft) -> normalize (dedup) -> upsert-service (write) pipeline. Four
// entry points, one per practical ingestion flow. No scoring, no UI —
// this only gets ChainBroker data into projects/funds/funding_rounds/
// funding_investors/token_unlock_events.
//
// Dependency order matters: `ingestProjects` and `ingestFunds` populate
// the base directory with real names (the only endpoints that have them).
// `ingestRecentFundingRounds` and `ingestUpcomingUnlocks` reference
// projects by slug but do NOT create them — a project referenced by
// those feeds that hasn't been ingested yet is skipped and reported in
// `skippedUnknownProjectSlugs`, never fabricated with a placeholder name.
// `ingestProjectFundingData` has the same prerequisite, enforced by
// throwing `IngestionPrerequisiteError` instead of guessing.

import { mapFund, mapFundingRound, mapProjectRef, mapUnlockEvent } from "./mapper";
import {
  normalizeFundDrafts,
  normalizeFundingInvestorPairs,
  normalizeFundingRoundDrafts,
  normalizeProjectDrafts,
  normalizeUnlockEventDrafts,
} from "./normalize";
import type { FundingInvestorPair } from "./normalize";
import type {
  ProjectDirectoryIngestionResult,
  ProjectFundingIngestionResult,
  FundsIngestionResult,
  RecentFundingRoundsIngestionResult,
  UpcomingUnlocksIngestionResult,
} from "./types";
import { IngestionPrerequisiteError } from "./errors";
import type { ChainBrokerUpsertService } from "./upsert-service";
import type { ChainBrokerClient } from "../../providers/chainbroker/client";

export class ChainBrokerIngestionService {
  constructor(
    private readonly client: ChainBrokerClient,
    private readonly upserts: ChainBrokerUpsertService,
  ) {}

  /** Populates/refreshes the project directory. Run before the other three methods. */
  async ingestProjects(page = 1): Promise<ProjectDirectoryIngestionResult> {
    const result = await this.client.listProjects(page);
    const drafts = normalizeProjectDrafts(result.items.map(mapProjectRef));
    const idsBySlug = await this.upserts.upsertProjects(drafts);
    return {
      page: result.page,
      totalPages: result.totalPages,
      projectsUpserted: idsBySlug.size,
    };
  }

  /** Populates/refreshes the fund directory. */
  async ingestFunds(): Promise<FundsIngestionResult> {
    const funds = await this.client.listFunds();
    const drafts = normalizeFundDrafts(funds.map(mapFund));
    const idsBySlug = await this.upserts.upsertFunds(drafts);
    return { fundsUpserted: idsBySlug.size };
  }

  /**
   * Funding rounds, investors, and unlocks for a single project.
   * Requires the project to already exist (see `ingestProjects`).
   */
  async ingestProjectFundingData(projectSlug: string): Promise<ProjectFundingIngestionResult> {
    const projectIds = await this.upserts.findProjectIdsBySlug([projectSlug]);
    const projectId = projectIds.get(projectSlug);
    if (!projectId) {
      throw new IngestionPrerequisiteError(
        `Project "${projectSlug}" has not been ingested yet — run ingestProjects() first.`,
      );
    }

    const [fundingRounds, investors, pastUnlocks, upcomingUnlocks] = await Promise.all([
      this.client.getProjectFundingRounds(projectSlug),
      this.client.getProjectInvestors(projectSlug),
      this.client.getProjectUnlocks(projectSlug, "past"),
      this.client.getProjectUnlocks(projectSlug, "upcoming"),
    ]);

    const fundDrafts = normalizeFundDrafts([
      ...investors.map(mapFund),
      ...fundingRounds.flatMap((r) => [...r.investors, ...r.leadInvestors].map(mapFund)),
    ]);
    const fundIdsBySlug = await this.upserts.upsertFunds(fundDrafts);

    const roundDrafts = normalizeFundingRoundDrafts(fundingRounds.map(mapFundingRound));
    const fundingInvestorPairs: FundingInvestorPair[] = [];
    for (const draft of roundDrafts) {
      const fundingRoundId = await this.upserts.upsertFundingRound(projectId, draft);
      for (const fundSlug of draft.investorFundSlugs) {
        const fundId = fundIdsBySlug.get(fundSlug);
        if (fundId) fundingInvestorPairs.push({ fundingRoundId, fundId });
      }
    }
    const dedupedPairs = normalizeFundingInvestorPairs(fundingInvestorPairs);
    await this.upserts.upsertFundingInvestors(dedupedPairs);

    const unlockDrafts = normalizeUnlockEventDrafts(
      [...pastUnlocks, ...upcomingUnlocks].map(mapUnlockEvent),
    ).filter((draft) => draft.unlockDate !== null);
    for (const draft of unlockDrafts) {
      await this.upserts.upsertTokenUnlockEvent(projectId, draft);
    }

    return {
      projectSlug,
      fundingRoundsUpserted: roundDrafts.length,
      investorsUpserted: fundIdsBySlug.size,
      fundingInvestorLinksUpserted: dedupedPairs.length,
      unlockEventsUpserted: unlockDrafts.length,
    };
  }

  /** Global recent-funding-rounds feed — projects not already ingested are skipped, not created. */
  async ingestRecentFundingRounds(page = 1): Promise<RecentFundingRoundsIngestionResult> {
    const result = await this.client.listRecentFundingRounds(page);
    const roundDrafts = normalizeFundingRoundDrafts(result.items.map(mapFundingRound));

    const projectIds = await this.upserts.findProjectIdsBySlug(
      roundDrafts.map((d) => d.projectSlug),
    );

    const fundDrafts = normalizeFundDrafts(
      result.items.flatMap((r) => [...r.investors, ...r.leadInvestors].map(mapFund)),
    );
    const fundIdsBySlug = await this.upserts.upsertFunds(fundDrafts);

    const skipped = new Set<string>();
    const fundingInvestorPairs: FundingInvestorPair[] = [];
    let fundingRoundsUpserted = 0;

    for (const draft of roundDrafts) {
      const projectId = projectIds.get(draft.projectSlug);
      if (!projectId) {
        skipped.add(draft.projectSlug);
        continue;
      }
      const fundingRoundId = await this.upserts.upsertFundingRound(projectId, draft);
      fundingRoundsUpserted++;
      for (const fundSlug of draft.investorFundSlugs) {
        const fundId = fundIdsBySlug.get(fundSlug);
        if (fundId) fundingInvestorPairs.push({ fundingRoundId, fundId });
      }
    }
    const dedupedPairs = normalizeFundingInvestorPairs(fundingInvestorPairs);
    await this.upserts.upsertFundingInvestors(dedupedPairs);

    return {
      page: result.page,
      totalPages: result.totalPages,
      fundingRoundsUpserted,
      investorsUpserted: fundIdsBySlug.size,
      fundingInvestorLinksUpserted: dedupedPairs.length,
      skippedUnknownProjectSlugs: [...skipped],
    };
  }

  /** Global upcoming-unlocks feed — projects not already ingested are skipped, not created. */
  async ingestUpcomingUnlocks(page = 1): Promise<UpcomingUnlocksIngestionResult> {
    const result = await this.client.listUpcomingUnlocks(page);
    const unlockDrafts = normalizeUnlockEventDrafts(result.items.map(mapUnlockEvent)).filter(
      (draft) => draft.unlockDate !== null,
    );

    const projectIds = await this.upserts.findProjectIdsBySlug(
      unlockDrafts.map((d) => d.projectSlug),
    );

    const skipped = new Set<string>();
    let unlockEventsUpserted = 0;
    for (const draft of unlockDrafts) {
      const projectId = projectIds.get(draft.projectSlug);
      if (!projectId) {
        skipped.add(draft.projectSlug);
        continue;
      }
      await this.upserts.upsertTokenUnlockEvent(projectId, draft);
      unlockEventsUpserted++;
    }

    return {
      page: result.page,
      totalPages: result.totalPages,
      unlockEventsUpserted,
      skippedUnknownProjectSlugs: [...skipped],
    };
  }
}
