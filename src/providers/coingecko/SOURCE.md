# CoinGecko API — Source Investigation

Investigated 2026-06-26 against the public, unauthenticated CoinGecko API
at `https://api.coingecko.com/api/v3` (the free, no-API-key surface — not
the Pro/Demo-key `pro-api.coingecko.com` host). All samples below were
pulled with live `curl` requests, not from documentation alone, following
this project's source-driven-development practice (see
`../chainbroker/SOURCE.md` for the precedent).

## Stability posture

Unlike ChainBroker, CoinGecko's public API is officially documented and
stable (https://docs.coingecko.com/reference/introduction). It does,
however, gate the free/no-key tier with an undocumented, frequently-tuned
rate limit (community reports put it in the single digits to low tens of
requests per minute) and CoinGecko reserves the right to require a Demo
API key in the future. This provider is built against the unauthenticated
surface first, with an explicit extension note (below) for adding key-based
auth later without touching callers.

## Authentication

None required for the public surface used here. CoinGecko also supports a
`x-cg-demo-api-key` / `x-cg-pro-api-key` header for higher rate limits —
**not implemented in this pass** (see "Future extension" below).

## Rate limits

No official published number for the no-key public endpoint; CoinGecko's
own docs only document limits for keyed Demo/Pro tiers. Treated the same
way ChainBroker's unconfirmed limits were treated: a conservative default
(`maxRequestsPerSecond: 1`), not a confirmed contract.

## Endpoints used

### 1. Coins Markets — `GET /coins/markets`

Bulk per-coin market data, single currency, optionally filtered by IDs.
Params used: `vs_currency` (required), `ids` (optional, comma-separated),
`page`, `per_page` (max 250), `price_change_percentage` (set to `7d,30d`
to get those fields — without it, only 24h change is present).

Sample (`?vs_currency=usd&ids=bitcoin&price_change_percentage=7d,30d`):
```json
{
  "id": "bitcoin", "symbol": "btc", "name": "Bitcoin",
  "current_price": 59902, "market_cap": 1200880231626, "market_cap_rank": 1,
  "fully_diluted_valuation": 1200880231626, "total_volume": 47989926099,
  "price_change_24h": -1766.93, "price_change_percentage_24h": -2.86518,
  "circulating_supply": 20048315.0, "total_supply": 20048315.0, "max_supply": 21000000.0,
  "ath": 126080, "ath_date": "2025-10-06T18:57:42.558Z",
  "atl": 67.81, "atl_date": "2013-07-06T00:00:00.000Z",
  "roi": null, "last_updated": "2026-06-26T09:45:52.857Z",
  "price_change_percentage_30d_in_currency": -20.926,
  "price_change_percentage_7d_in_currency": -4.194
}
```

**Known limitation, confirmed live**: this endpoint returns a plain array
— no `count`/`total_pages`/`next` envelope at all, unlike ChainBroker's
DRF-style pagination. There is no way to know how many total pages exist;
the only signal available is whether a page came back full
(`items.length === per_page`, a heuristic for "there might be more," not a
guarantee). Documented in `types.ts` as `CoinGeckoMarketsPage<T>` —
deliberately **not** forced into this project's shared `PaginatedResult`
shape, since that shape promises a real `totalPages`/`totalCount` this
endpoint cannot supply. Fabricating those numbers would violate this
project's "don't fabricate data" principle (see DEVELOPER_GUIDE.md Do &
Don't).

### 2. Coin Details — `GET /coins/{id}`

Single-coin detail, including a `market_data` block in multiple
currencies. Params used: `localization=false&tickers=false&market_data=true
&community_data=false&developer_data=false&sparkline=false` (everything
not needed is turned off to keep the payload small).

Sample (`/coins/bitcoin?market_data=true`), fields actually consumed:
```json
{
  "id": "bitcoin", "symbol": "btc", "name": "Bitcoin",
  "market_cap_rank": 1, "last_updated": "2026-06-26T09:49:57.949Z",
  "market_data": {
    "current_price": { "usd": 59785, "...": "...other currencies" },
    "market_cap": { "usd": 1199525303985 },
    "fully_diluted_valuation": { "usd": 1199525303985 },
    "total_volume": { "usd": 48093158513 },
    "circulating_supply": 20048315, "total_supply": 20048315, "max_supply": 21000000,
    "price_change_percentage_24h": -3.05551,
    "price_change_percentage_7d": -4.38191,
    "price_change_percentage_30d": -21.08138,
    "ath": { "usd": 126080 }, "ath_date": { "usd": "2025-10-06T18:57:42.558Z" },
    "atl": { "usd": 67.81 }, "atl_date": { "usd": "2013-07-06T00:00:00.000Z" }
  }
}
```

**Confirmed quirk**: `current_price`/`market_cap`/`fully_diluted_valuation`/
`total_volume`/`ath`/`atl`/`ath_date`/`atl_date` are objects keyed by
currency code; `circulating_supply`/`total_supply`/`max_supply`/
`price_change_percentage_24h`/`7d`/`30d` are plain numbers (computed
against USD regardless of which currency keys exist elsewhere). This
provider only ever reads the `.usd` key off the currency-keyed fields —
multi-currency support is out of scope.

**404 confirmed live** for an unknown coin id:
```
GET /coins/not-a-real-coin-xyz?market_data=true  ->  404 {"error":"coin not found"}
```

### 3. Trending Coins — `GET /search/trending`

Top searched-for coins (no params). Top level: `{ coins, nfts, categories }`
— this provider only normalizes `coins`; `nfts`/`categories` are validated
loosely (so a malformed item there doesn't fail the whole response) but
not mapped, since nothing in this provider's brief calls for NFT/category
trending.

Sample (`coins[0].item`, fields consumed):
```json
{
  "id": "bitcoin", "name": "Bitcoin", "symbol": "BTC", "market_cap_rank": 1,
  "thumb": "https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png",
  "data": {
    "price": 59991.70238163765,
    "price_change_percentage_24h": { "usd": -2.7156768127570152, "...": "...other currencies" },
    "market_cap": "$1,203,016,649,552",
    "total_volume": "$47,422,872,394"
  }
}
```

**Confirmed quirk, same family as ChainBroker's display-string fields**:
`data.market_cap` and `data.total_volume` here are **pre-formatted display
strings** ("$1,203,016,649,552"), not numbers — unlike the numeric
`market_cap`/`total_volume` on the Coins Markets and Coin Details
endpoints. Parsed with a small local helper in `mapper.ts` (the same
"parse a display string defensively, return null rather than throw on a
non-match" approach as `chainbroker/parse.ts`), not promoted to a shared
parser since the format ("$1,203,016,649,552" — comma-separated, no
K/M/B/T suffix) differs from ChainBroker's abbreviated form ("$25M").

### 4. Search — `GET /search?query={query}`

Free-text search across coins/exchanges/categories/NFTs/ICOs. This
provider only normalizes `coins`.

Sample (`coins[0]`):
```json
{
  "id": "bitcoin", "name": "Bitcoin", "api_symbol": "bitcoin", "symbol": "BTC",
  "market_cap_rank": 1,
  "thumb": "https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png",
  "large": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png"
}
```
No price/market-cap data at all on this endpoint — it's identity-only
(id/name/symbol/rank/images). Callers needing market data for a search
result must follow up with Coins Markets or Coin Details.

### 5. Global Market — `GET /global`

Aggregate market stats, no params. Top level: `{ data: { ... } }`.

Sample, fields consumed:
```json
{
  "data": {
    "active_cryptocurrencies": 17482, "markets": 1488,
    "total_market_cap": { "usd": 2143007173806.86, "...": "...other currencies" },
    "total_volume": { "usd": 105150958455.86 },
    "market_cap_percentage": { "btc": 55.93, "eth": 8.71, "...": "...other assets" },
    "market_cap_change_percentage_24h_usd": -2.636,
    "updated_at": 1782450295
  }
}
```
`updated_at` is **Unix seconds**, not an ISO string (unlike every other
`last_updated`/`ath_date`/`atl_date` field on this API) — converted to ISO
in the mapper.

## Error handling map

| Condition | Confirmed | Handling |
|---|---|---|
| 404 (unknown coin id) | Yes, live (`/coins/{bad-id}`) | `CoinGeckoNotFoundError` (subclass of the base `ProviderHttpError`, never retryable) — distinct from a generic HTTP error so a future ingestion layer can skip-and-report an unknown coin id the same way ChainBroker's ingestion skips unknown project slugs, rather than treating it as a transient failure. |
| 429 (rate limited) | Documented by CoinGecko, not reproduced live (would require exceeding the live rate limit deliberately) | Retryable — in `retryOnStatusCodes`. |
| 500/502/503/504 | Standard transient upstream failure | Retryable — in `retryOnStatusCodes`. |
| Network timeout | N/A — client-enforced | `timeoutMs` + `AbortController`, same mechanism as ChainBroker, via the shared base layer. |
| Malformed/non-JSON body | Not observed live; CoinGecko has no known bot-challenge layer like ChainBroker's Cloudflare | Treated as retryable by the base layer default (`ProviderParseError`) — conservative, consistent with ChainBroker's reasoning, even without a confirmed cause here. |

## Future extension (not implemented in this pass)

Adding Demo/Pro API key support would need: (1) a `apiKey` field on
`CoinGeckoProviderConfig`, and (2) a way to attach an extra header
(`x-cg-demo-api-key`) per request. (2) is **not currently possible**
without a small, additive change to `src/providers/base/http-client.ts`
(it only sets `Accept` + `User-Agent` today) — flagged here rather than
made unilaterally, the same way ChainBroker's schema gaps (`funds.slug`,
`funding_investors.is_lead`) were flagged instead of silently patched
during an unrelated task.
