// Runtime validation for every shape the client receives, mirroring
// types.ts. Deliberately not `.strict()` — CoinPaprika's responses carry
// more fields than this provider consumes (beta_value, first_data_at,
// additional percent_change windows, etc.); unknown extra fields are not
// an error. Missing/mistyped *known* fields are.

import { z } from "zod";

export const coinPaprikaQuoteUsdSchema = z.object({
  price: z.number().nullable(),
  volume_24h: z.number().nullable(),
  market_cap: z.number().nullable(),
  percent_change_24h: z.number().nullable(),
  percent_change_7d: z.number().nullable(),
  percent_change_30d: z.number().nullable(),
  ath_price: z.number().nullable(),
  ath_date: z.string().nullable(),
});

export const coinPaprikaTickerSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  rank: z.number(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  last_updated: z.string().nullable(),
  quotes: z.object({
    USD: coinPaprikaQuoteUsdSchema,
  }),
});

export const coinPaprikaTickersListSchema = z.array(coinPaprikaTickerSchema);
