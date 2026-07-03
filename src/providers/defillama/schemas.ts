// Runtime validation for every shape the client receives, mirroring
// types.ts. Deliberately not `.strict()` — DefiLlama's responses
// (especially /protocol/{slug}) carry many fields and multi-megabyte
// historical series this provider doesn't consume; only declaring the
// fields actually used keeps validation cheap despite the payload size
// (see SOURCE.md). Missing/mistyped *known* fields are still caught.

import { z } from "zod";

const chainTvlsSchema = z.record(z.string(), z.number());

export const protocolListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  // DefiLlama omits `chain` entirely for multi-chain aggregator protocols
  // added after the original schema was written. Treat absent as null
  // (same semantic as NormalizedDefiLlamaMetrics.chain: "aggregate across all chains").
  chain: z.string().optional(),
  chains: z.array(z.string()),
  tvl: z.number().nullable(),
  change_1d: z.number().nullable(),
  change_7d: z.number().nullable(),
  chainTvls: chainTvlsSchema,
});

export const protocolsListSchema = z.array(protocolListItemSchema);

const tvlHistoryPointSchema = z.object({
  date: z.number(),
  totalLiquidityUSD: z.number(),
});

export const protocolDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  chain: z.string().optional(),
  chains: z.array(z.string()),
  currentChainTvls: chainTvlsSchema,
  tvl: z.array(tvlHistoryPointSchema),
});

const feesChartPointSchema = z.tuple([z.number(), z.number()]);

export const feesSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  chain: z.string().nullable(),
  total24h: z.number().nullable(),
  total30d: z.number().nullable(),
  totalDataChart: z.array(feesChartPointSchema),
});

export const chainListItemSchema = z.object({
  name: z.string(),
  tvl: z.number().nullable(),
  tokenSymbol: z.string().nullable(),
  chainId: z.union([z.number(), z.string()]).nullable(),
});

export const chainsListSchema = z.array(chainListItemSchema);
