// Runtime validation for every shape the client receives, mirroring
// types.ts. Deliberately not `.strict()` — CoinGecko's responses carry
// far more fields than this provider consumes (extra currencies, ROI
// objects, sparkline data, etc.), and unknown extra fields are not an
// error. Missing/mistyped *known* fields are, which is what we actually
// want to catch.

import { z } from "zod";

export const coinMarketItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  price_change_percentage_7d_in_currency: z.number().nullable().optional(),
  price_change_percentage_30d_in_currency: z.number().nullable().optional(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(),
  atl_date: z.string().nullable(),
  last_updated: z.string().nullable(),
});

export const coinMarketsListSchema = z.array(coinMarketItemSchema);

const currencyRecordSchema = z.record(z.string(), z.number());

export const coinDetailSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_cap_rank: z.number().nullable(),
  last_updated: z.string().nullable(),
  market_data: z.object({
    current_price: currencyRecordSchema,
    market_cap: currencyRecordSchema,
    fully_diluted_valuation: currencyRecordSchema,
    total_volume: currencyRecordSchema,
    circulating_supply: z.number().nullable(),
    total_supply: z.number().nullable(),
    max_supply: z.number().nullable(),
    price_change_percentage_24h: z.number().nullable(),
    price_change_percentage_7d: z.number().nullable(),
    price_change_percentage_30d: z.number().nullable(),
    ath: currencyRecordSchema,
    ath_date: z.record(z.string(), z.string()),
    atl: currencyRecordSchema,
    atl_date: z.record(z.string(), z.string()),
  }),
});

export const trendingResponseSchema = z.object({
  coins: z.array(
    z.object({
      item: z.object({
        id: z.string(),
        name: z.string(),
        symbol: z.string(),
        market_cap_rank: z.number().nullable(),
        thumb: z.string().nullable().optional(),
        small: z.string().nullable().optional(),
        large: z.string().nullable().optional(),
        slug: z.string(),
        data: z.object({
          price: z.number().nullable(),
          price_change_percentage_24h: z.record(z.string(), z.number()).nullable().optional(),
          market_cap: z.string().nullable(),
          total_volume: z.string().nullable(),
        }),
      }),
    }),
  ),
  nfts: z.array(z.unknown()),
  categories: z.array(z.unknown()),
});

export const searchResponseSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      api_symbol: z.string(),
      symbol: z.string(),
      market_cap_rank: z.number().nullable(),
      thumb: z.string().nullable().optional(),
      large: z.string().nullable().optional(),
    }),
  ),
  exchanges: z.array(z.unknown()),
  icos: z.array(z.unknown()),
  categories: z.array(z.unknown()),
  nfts: z.array(z.unknown()),
});

export const globalResponseSchema = z.object({
  data: z.object({
    active_cryptocurrencies: z.number(),
    markets: z.number(),
    total_market_cap: currencyRecordSchema,
    total_volume: currencyRecordSchema,
    market_cap_percentage: currencyRecordSchema,
    market_cap_change_percentage_24h_usd: z.number().nullable(),
    updated_at: z.number(),
  }),
});
