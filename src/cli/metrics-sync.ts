#!/usr/bin/env node
// CLI for the unified Market Metrics sync. Run via `npm run sync:metrics`
// or directly:
//
//   tsx src/cli/metrics-sync.ts --provider=coingecko|defillama|coinpaprika|dexscreener|all
//
// `all` runs every provider in dependency order: coinpaprika -> dexscreener
// -> defillama (independent domain, TVL) -> coingecko. CoinPaprika and
// DexScreener are the primary market-data sources now (flipped 2026-07-06
// after CoinGecko's much larger 16,000+-coin catalog was found producing
// wrong data — colliding tickers within one CoinGecko batch, e.g. 24
// different unrelated tokens all named "HYPER" on DexScreener alone, could
// silently overwrite a project with the wrong coin's price — see
// ingestion-service.ts's batch-dedup guard and syncMetrics.ts's doc
// comments). CoinGecko now only fills what CoinPaprika/DexScreener left
// null (`fillNullsOnly`) and must run last; dexscreener must run after
// coinpaprika so its gap query reflects whatever coinpaprika just filled.
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
import { CoinPaprikaClient } from "../providers/coinpaprika/client";
import { DexScreenerClient } from "../providers/dexscreener/client";
import {
  syncCoinGeckoMetrics,
  syncCoinPaprikaMetrics,
  syncDefiLlamaMetrics,
  syncDexScreenerGapFill,
} from "../ingestion/metrics/syncMetrics";
import type { MetricsSyncReport } from "../ingestion/metrics/types";

// See chainbroker-sync.ts's identical block for why this is needed.
try {
  process.loadEnvFile();
} catch {
  // .env not found — fine when env vars come from the platform instead.
}

const PROVIDERS = ["coingecko", "defillama", "coinpaprika", "dexscreener", "all"] as const;
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

    if (provider === "coinpaprika" || provider === "all") {
      reports.push(await syncCoinPaprikaMetrics(supabase, new CoinPaprikaClient()));
    }
    if (provider === "dexscreener" || provider === "all") {
      reports.push(await syncDexScreenerGapFill(supabase, new DexScreenerClient()));
    }
    if (provider === "defillama" || provider === "all") {
      reports.push(await syncDefiLlamaMetrics(supabase, new DefiLlamaClient()));
    }
    if (provider === "coingecko" || provider === "all") {
      reports.push(await syncCoinGeckoMetrics(supabase, new CoinGeckoClient()));
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
