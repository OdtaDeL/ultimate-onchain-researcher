# DexScreener API — Source Investigation

Investigated 2026-07-06 against the public, unauthenticated DexScreener API
at `https://api.dexscreener.com`. All samples below were pulled with live
`curl` requests, following this project's source-driven-development
practice (see `../chainbroker/SOURCE.md` for the precedent). Official
reference: `https://docs.dexscreener.com/api/reference`.

## Why this provider exists

CoinGecko (~58% match) and CoinPaprika (bulk, ~2,000-coin free-tier catalog)
both miss many of this platform's projects — often exactly the early-stage,
VC-funded, not-yet-CEX-listed tokens ChainBroker specializes in tracking,
which frequently trade on DEXs long before (or instead of) appearing on a
CEX-focused aggregator. DexScreener indexes on-chain DEX liquidity directly,
so it's a third, narrower gap-filler used **only** for projects CoinGecko
and CoinPaprika both left null — see
`src/ingestion/metrics/upsert-service.ts`'s `fillNullsOnly` mode.

## Authentication

None. No API key, no header required for the endpoints used here.

## Rate limits

Documented (`docs.dexscreener.com/api/reference`): **60 requests/minute**
for the search endpoint used here. No key-based higher tier is offered for
this endpoint. `maxRequestsPerSecond: 1` (60/min) is a direct, exact
translation of the documented limit — not a conservative guess, unlike
every other provider in this codebase.

## Endpoints used

### Search — `GET /latest/dex/search?q={query}`

Free-text search across token names/symbols/addresses. Returns **trading
pairs**, not tokens — the same token commonly appears multiple times (once
per DEX pool it trades on, across one or more chains). Confirmed live
(`?q=morpho`): 30 pairs returned, at least 2 of which are the *same*
`MORPHO` token (address `0xBAa5...0842` on Base) paired against different
quote tokens (WETH, USDC) on different DEXs (`aerodrome`, `uniswap`) —
`marketCap`/`fdv`/`priceUsd` are identical across a token's own pairs (both
`fdv: 58299448` in the sample), only `liquidity`/`volume`/`priceNative`
differ per pool. This provider deduplicates by `baseToken.address`,
keeping only the highest-`liquidity.usd` pair per unique address — see
`mapper.ts`'s `mapSearchResults`.

**Confirmed empty-result shape** (`?q=zzznonexistenttoken999`):
```json
{"schemaVersion":"1.0.0","pairs":[]}
```
`pairs: []`, not a 404 — a query with no matches is not an error.

Sample pair (fields consumed):
```json
{
  "chainId": "base",
  "dexId": "aerodrome",
  "baseToken": {
    "address": "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842",
    "name": "Morpho Token",
    "symbol": "MORPHO"
  },
  "priceUsd": "1.90",
  "priceChange": { "h24": -4.8 },
  "volume": { "h24": 351346.21 },
  "liquidity": { "usd": 258069.36 },
  "fdv": 58299448,
  "marketCap": 1234507729
}
```

**Confirmed quirk**: `priceUsd` is a **string** ("1.90"), while `marketCap`/
`fdv`/`liquidity.usd`/`volume.h24`/`priceChange.h24` are numbers — an
inconsistency within the same payload, not a typo here. Parsed with
`Number()` in `mapper.ts`, `null` if the result is `NaN`.

**No supply, ATH/ATL, or multi-day (7d/30d) price-change fields at all** —
this endpoint only ever reports `priceChange.{m5,h1,h6,h24}`. Only `h24` is
used; `NormalizedDexScreenerToken` has no 7d/30d fields, and this provider
never writes `project_metrics.price_change_7d`/`price_change_30d`/
`circulating_supply`/`total_supply`/`max_supply`/`ath`/`atl` — see
`src/ingestion/metrics/types.ts`'s `DexScreenerMetricsColumns`.

**Matching strategy (this platform's choice, not a DexScreener contract)**:
since search is fuzzy and can return unrelated tokens sharing a substring,
the sync job (`src/ingestion/metrics/syncMetrics.ts`) only searches by a
project's ChainBroker `ticker` (never bare `name` — too noisy) and only
accepts a candidate whose `baseToken.symbol` matches that ticker exactly
(case-insensitive). A project with no ticker is skipped for this provider
entirely, and a query producing more than one distinct token address after
the exact-symbol filter is treated as unresolved rather than guessed.

## Error handling map

| Condition | Confirmed | Handling |
|---|---|---|
| No matches | Yes, live | `{"pairs": []}` — normalized to an empty array, not an error. |
| 429 (rate limited) | Documented, not reproduced live | Retryable — in `retryOnStatusCodes`. |
| 500/502/503/504 | Not reproduced live | Retryable, same convention as every other provider here. |
| Network timeout | N/A — client-enforced | `timeoutMs` + `AbortController`, shared base layer. |
