// Pure report-assembly helpers — no I/O. scoring-sync.ts accumulates
// outcomes as it goes and calls these to shape the final
// ScoringSyncReport; kept separate per the task's file list rather than
// inlined into the orchestrator.

import type {
  MaterializedViewName,
  ProjectScoreUpsertResult,
  ScoringSyncReport,
} from "./types";

export interface ReportTally {
  projectsProcessed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
}

export function emptyTally(): ReportTally {
  return { projectsProcessed: 0, inserted: 0, updated: 0, unchanged: 0, failed: 0 };
}

export function tallyUpsertResult(tally: ReportTally, outcome: ProjectScoreUpsertResult["outcome"]): ReportTally {
  const next = { ...tally, projectsProcessed: tally.projectsProcessed + 1 };
  if (outcome === "inserted") next.inserted += 1;
  else if (outcome === "updated") next.updated += 1;
  else next.unchanged += 1;
  return next;
}

export function tallyFailure(tally: ReportTally): ReportTally {
  return { ...tally, projectsProcessed: tally.projectsProcessed + 1, failed: tally.failed + 1 };
}

export function buildSyncReport(
  startedAt: Date,
  finishedAt: Date,
  tally: ReportTally,
  materializedViewsRefreshed: MaterializedViewName[],
): ScoringSyncReport {
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    projectsProcessed: tally.projectsProcessed,
    inserted: tally.inserted,
    updated: tally.updated,
    unchanged: tally.unchanged,
    failed: tally.failed,
    materializedViewsRefreshed,
  };
}
