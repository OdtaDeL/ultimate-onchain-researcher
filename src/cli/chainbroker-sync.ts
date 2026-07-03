#!/usr/bin/env node
// CLI for the ChainBroker sync jobs. Run via the npm scripts in
// package.json (`npm run sync:projects`, etc.) or directly:
//
//   tsx src/cli/chainbroker-sync.ts <projects|funds|funding-rounds|unlocks|bootstrap|all> [--max-pages=N]
//
// `bootstrap` runs syncBootstrapProjects then syncBootstrapFunds — the
// full, uncapped catalog sync meant to run once before any incremental
// sync. --max-pages is ignored for it (bootstrap always does every page)
// and a warning is logged if it was passed.
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
// (see src/ingestion/chainbroker/supabase-client.ts).
//
// Structured logs go to stderr; the final JSON report goes to stdout, so
// `... | jq` or redirecting stdout to a file gets a clean result with no
// log noise mixed in.

import { ChainBrokerClient } from "../providers/chainbroker/client";
import { ChainBrokerIngestionService } from "../ingestion/chainbroker/ingestion-service";
import { ChainBrokerUpsertService } from "../ingestion/chainbroker/upsert-service";
import { createIngestionSupabaseClient } from "../ingestion/chainbroker/supabase-client";
import { createLogger } from "../sync/chainbroker/logger";
import { runChainBrokerBootstrap } from "../sync/chainbroker/runBootstrap";
import { syncFunds } from "../sync/chainbroker/syncFunds";
import { syncFundingRounds } from "../sync/chainbroker/syncFundingRounds";
import { syncProjects } from "../sync/chainbroker/syncProjects";
import { syncUnlocks } from "../sync/chainbroker/syncUnlocks";
import type { SyncJobOptions } from "../sync/chainbroker/types";

const COMMANDS = ["projects", "funds", "funding-rounds", "unlocks", "bootstrap", "all"] as const;
type Command = (typeof COMMANDS)[number];

function printUsage(): void {
  console.error(`Usage: chainbroker-sync <${COMMANDS.join("|")}> [--max-pages=N]`);
}

function parseArgs(argv: string[]): { command: string | undefined; maxPages: number | undefined } {
  const [command, ...rest] = argv;
  let maxPages: number | undefined;
  for (const arg of rest) {
    const match = arg.match(/^--max-pages=(\d+)$/);
    if (match) maxPages = Number(match[1]);
  }
  return { command, maxPages };
}

async function main(): Promise<void> {
  const { command, maxPages } = parseArgs(process.argv.slice(2));

  if (!command || !COMMANDS.includes(command as Command)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const rootLogger = createLogger({ cli: "chainbroker-sync" });

  try {
    const supabase = createIngestionSupabaseClient();
    const client = new ChainBrokerClient();
    const upserts = new ChainBrokerUpsertService(supabase);
    const ingestion = new ChainBrokerIngestionService(client, upserts);

    const progressOptions = (job: string): SyncJobOptions => ({
      maxPages,
      logger: rootLogger.child({ job }),
      onProgress: (progress) =>
        rootLogger.info("sync.progress", {
          job: progress.job,
          page: progress.page,
          totalPages: progress.totalPages,
          itemsUpserted: progress.itemsUpserted,
        }),
    });

    if (command === "bootstrap") {
      if (maxPages !== undefined) {
        rootLogger.warn("bootstrap.max_pages_ignored", { maxPages });
      }

      const report = await runChainBrokerBootstrap(ingestion, supabase, {
        logger: rootLogger,
        onProgress: (progress) => rootLogger.info("sync.progress", { ...progress }),
      });

      console.log(JSON.stringify(report, null, 2));
      process.exitCode = report.succeeded ? 0 : 1;
      return;
    }

    const jobs: Record<Exclude<Command, "bootstrap" | "all">, () => Promise<unknown>> = {
      projects: () => syncProjects(ingestion, progressOptions("syncProjects")),
      funds: () => syncFunds(ingestion, progressOptions("syncFunds")),
      "funding-rounds": () => syncFundingRounds(ingestion, progressOptions("syncFundingRounds")),
      unlocks: () => syncUnlocks(ingestion, progressOptions("syncUnlocks")),
    };

    // Dependency order: projects/funds populate the base directory that
    // funding-rounds/unlocks reference by slug (see ingestion-service.ts).
    const runOrder: Exclude<Command, "bootstrap" | "all">[] = [
      "projects",
      "funds",
      "funding-rounds",
      "unlocks",
    ];

    const reports =
      command === "all"
        ? await runSequentially(runOrder, jobs)
        : [await jobs[command as Exclude<Command, "bootstrap" | "all">]()];

    console.log(JSON.stringify(command === "all" ? reports : reports[0], null, 2));

    const anyFailed = reports.some(
      (r) => typeof r === "object" && r !== null && "succeeded" in r && !(r as { succeeded: boolean }).succeeded,
    );
    process.exitCode = anyFailed ? 1 : 0;
  } catch (error) {
    rootLogger.error("cli.failed", { error: String(error) });
    process.exitCode = 1;
  }
}

async function runSequentially(
  order: Exclude<Command, "bootstrap" | "all">[],
  jobs: Record<Exclude<Command, "bootstrap" | "all">, () => Promise<unknown>>,
): Promise<unknown[]> {
  const reports: unknown[] = [];
  for (const name of order) {
    reports.push(await jobs[name]());
  }
  return reports;
}

main();
