#!/usr/bin/env node
// CLI for the Scoring Sync Pipeline. Run via `npm run sync:scores` or
// directly:
//
//   tsx src/cli/scoring-sync.ts --all
//   tsx src/cli/scoring-sync.ts --project=aave-v3
//   tsx src/cli/scoring-sync.ts --refresh-only
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
// (see src/ingestion/chainbroker/supabase-client.ts — reused here, same
// as src/cli/metrics-sync.ts, since it's already provider-agnostic).
//
// Final JSON report goes to stdout; nothing else is written there.

import { createIngestionSupabaseClient } from "../ingestion/chainbroker/supabase-client";
import { runRefreshOnly, runScoringSync } from "../scoring-sync/scoring-sync";

function parseArgs(argv: string[]): { all: boolean; refreshOnly: boolean; projectSlug: string | undefined } {
  let all = false;
  let refreshOnly = false;
  let projectSlug: string | undefined;

  for (const arg of argv) {
    if (arg === "--all") all = true;
    else if (arg === "--refresh-only") refreshOnly = true;
    else {
      const match = arg.match(/^--project=(.+)$/);
      if (match) projectSlug = match[1];
    }
  }

  return { all, refreshOnly, projectSlug };
}

function printUsage(): void {
  console.error("Usage: scoring-sync <--all|--project=<slug>|--refresh-only>");
}

async function main(): Promise<void> {
  const { all, refreshOnly, projectSlug } = parseArgs(process.argv.slice(2));

  if (!all && !refreshOnly && !projectSlug) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const supabase = createIngestionSupabaseClient();

    const report = refreshOnly
      ? await runRefreshOnly(supabase)
      : await runScoringSync(supabase, { projectSlug });

    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(JSON.stringify({ error: String((error as { message?: string })?.message ?? error) }));
    process.exitCode = 1;
  }
}

main();
