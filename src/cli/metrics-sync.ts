#!/usr/bin/env node
// CLI for the unified Market Metrics sync. Run via `npm run sync:metrics`
// or directly:
//
//   tsx src/cli/metrics-sync.ts --provider=coingecko|defillama|all
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
// (see src/ingestion/chainbroker/supabase-client.ts — reused here since
// it's already provider-agnostic, just env-var plumbing; see
// DEVELOPER_GUIDE.md "src/lib/" note on this kind of shared infra).
//
// Final JSON report(s) go to stdout; this CLI does not log anything else,
// so its stdout is always clean, parseable JSON (`... | jq`-safe).

import { createIngestionSupabaseClient } from "../ingestion/chainbroker/supabase-client";
import { CoinGeckoClient } from "../providers/coingecko/client";
import { DefiLlamaClient } from "../providers/defillama/client";
import { syncCoinGeckoMetrics, syncDefiLlamaMetrics } from "../ingestion/metrics/syncMetrics";
import type { MetricsSyncReport } from "../ingestion/metrics/types";

const PROVIDERS = ["coingecko", "defillama", "all"] as const;
type ProviderArg = (typeof PROVIDERS)[number];

function parseArgs(argv: string[]): { provider: string | undefined } {
  let provider: string | undefined;
  for (const arg of argv) {
    const match = arg.match(/^--provider=(.+)$/);
    if (match) provider = match[1];
  }
  return { provider };
}

function printUsage(): void {
  console.error(`Usage: metrics-sync --provider=<${PROVIDERS.join("|")}>`);
}

async function main(): Promise<void> {
  const { provider } = parseArgs(process.argv.slice(2));

  if (!provider || !PROVIDERS.includes(provider as ProviderArg)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const supabase = createIngestionSupabaseClient();

    const reports: MetricsSyncReport[] = [];

    if (provider === "coingecko" || provider === "all") {
      reports.push(await syncCoinGeckoMetrics(supabase, new CoinGeckoClient()));
    }
    if (provider === "defillama" || provider === "all") {
      reports.push(await syncDefiLlamaMetrics(supabase, new DefiLlamaClient()));
    }

    console.log(JSON.stringify(provider === "all" ? reports : reports[0], null, 2));

    const anyFailed = reports.some((r) => r.failed > 0);
    process.exitCode = anyFailed ? 1 : 0;
  } catch (error) {
    console.error(JSON.stringify({ error: String((error as { message?: string })?.message ?? error) }));
    process.exitCode = 1;
  }
}

main();
