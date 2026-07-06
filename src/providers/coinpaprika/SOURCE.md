# CoinPaprika API — Source Investigation

Investigated 2026-07-06 against the public, unauthenticated CoinPaprika API at
`https://api.coinpaprika.com/v1`. All samples below were pulled with live
`curl` requests, following this project's source-driven-development
practice (see `../chainbroker/SOURCE.md` for the precedent).

## Why this provider exists

CoinGecko's free-tier match rate against this platform's project catalog is
~58% (identity resolution only matches exact slug/symbol/name — see
`../../identity/IDENTITY.md`). CoinPaprika is a second, independent
market-data source used **only to fill gaps CoinGecko left null** — see
`src/ingestion/metrics/upsert-service.ts`'s `fillNullsOnly` mode. It is
never allowed to overwrite a value CoinGecko already supplied.

## Authentication

None required for the endpoint used here. CoinPaprika also offers a paid
tier with an API key for higher rate limits and a larger `/tickers` result
set — not implemented in this pass.

## Rate limits

No `X-RateLimit-*` headers observed, and no official free-tier per-second/
per-minute limit found in the public docs (`docs.coinpaprika.com`). 5
sequential requests returned 200 in under 400ms each with no throttling
signal. Treated the same way ChainBroker's and CoinGecko's unconfirmed
limits were treated: a conservative default (`maxRequestsPerSecond: 1`) —
though in practice this provider only ever issues **one** request per sync
run (see below), so the limiter is never actually exercised.

## Endpoints used

### Tickers (bulk) — `GET /v1/tickers`

Every actively-tracked coin's current market snapshot, in one call — no
pagination, no `page`/`per_page` params, unlike CoinGecko's `/coins/markets`.
Confirmed live: **2,000 items**, ~1.6 MB response, ~0.4s. This appears to be
a free-tier cap (paid tiers likely return more) — not documented, inferred
from the response always stopping at exactly 2,000 across repeated calls.

Sample (`quotes.USD` trimmed to fields consumed):
```json
{
  "id": "btc-bitcoin",
  "name": "Bitcoin",
  "symbol": "BTC",
  "rank": 1,
  "total_supply": 20052806,
  "max_supply": 21000000,
  "last_updated": "2026-07-06T09:25:14Z",
  "quotes": {
    "USD": {
      "price": 62720.54610926905,
      "volume_24h": 19758724644.257137,
      "market_cap": 1257722943343,
      "percent_change_24h": 0.10000000149011612,
      "percent_change_7d": 4.269999980926514,
      "percent_change_30d": 0,
      "ath_price": 126173.1777846797,
      "ath_date": "2025-10-06T19:00:40Z"
    }
  }
}
```

**Confirmed quirk**: `max_supply` is `0` (not `null`) for at least one
observed low-rank token (`DFDVX`, rank 2025) with no maximum supply — unlike
CoinGecko, which returns `null` for the same concept. Not normalized away
(no fabricated distinction between "confirmed zero" and "no max supply,"
per this project's "don't fabricate data" principle) — carried through
as-is; the `0` is passed as `0`, and callers should treat it the same
ambiguous way CoinGecko's `total_supply: 0` would be treated if it
ever occurred.

**`id` format**: `{symbol}-{name}` (e.g. `"btc-bitcoin"`, `"eth-ethereum"`),
distinct from ChainBroker's plain slugs (e.g. `"bitcoin"`) and CoinGecko's
plain-word ids (also `"bitcoin"`) — CoinPaprika's `id` is therefore **not**
given to the identity resolver as a `slug` candidate (it would almost never
match a ChainBroker slug); only `symbol` and `name` are passed. See
`src/ingestion/metrics/mapper.ts`'s `mapCoinPaprikaMetrics`.

**No `fdv` (fully diluted valuation) field** on this endpoint — omitted
from `NormalizedCoinPaprikaTicker` and never written to `project_metrics.fdv`
by this provider.

## Error handling map

| Condition | Confirmed | Handling |
|---|---|---|
| 429 (rate limited) | Not reproduced live | Retryable — in `retryOnStatusCodes`. |
| 500/502/503/504 | Not reproduced live | Retryable — in `retryOnStatusCodes`, same convention as every other provider here. |
| Network timeout | N/A — client-enforced | `timeoutMs` + `AbortController`, shared base layer. |
