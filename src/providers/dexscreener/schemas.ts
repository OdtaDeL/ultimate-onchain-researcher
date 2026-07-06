// Runtime validation for every shape the client receives, mirroring
// types.ts. Deliberately not `.strict()` — DexScreener's pair objects
// carry far more fields than this provider consumes (txns, info, labels,
// pairCreatedAt, etc.); unknown extra fields are not an error.

import { z } from "zod";

export const dexScreenerTokenSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
});

export const dexScreenerPairSchema = z.object({
  chainId: z.string(),
  dexId: z.string(),
  baseToken: dexScreenerTokenSchema,
  quoteToken: dexScreenerTokenSchema,
  priceUsd: z.string().nullable().optional(),
  priceChange: z.object({ h24: z.number().nullable().optional() }).nullable().optional(),
  volume: z.object({ h24: z.number().nullable().optional() }).nullable().optional(),
  liquidity: z.object({ usd: z.number().nullable().optional() }).nullable().optional(),
  fdv: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
});

export const dexScreenerSearchResponseSchema = z.object({
  schemaVersion: z.string(),
  pairs: z.array(dexScreenerPairSchema).nullable(),
});
