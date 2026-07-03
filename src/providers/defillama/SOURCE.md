# DefiLlama API — Source Investigation

Investigated 2026-06-26 against the public, unauthenticated DefiLlama API
at `https://api.llama.fi`. All samples below were pulled with live `curl`
requests, following this project's source-driven-development practice
(see `../chainbroker/SOURCE.md` and `../coingecko/SOURCE.md` for
precedent).

## Stability posture

DefiLlama's API is officially documented (https://defillama.com/docs/api)
and widely relied upon — more stable than ChainBroker, similar in posture
to CoinGecko. No authentication, no published rate limit for this host.

## Rate limits

No documented number. Treated the same conservative way as ChainBroker
and CoinGecko's unconfirmed limits: a default of `maxRequestsPerSecond: 1`,
not a confirmed contract.

## Endpoints used

### 1. Protocols — `GET /protocols`

Bulk list of all ~7,700 protocols, each with aggregate TVL, 1d/7d change,
and a per-chain TVL breakdown. No params.

Sample (one item, fields consumed):
```json
{
  "id": "1599", "name": "Aave V3", "slug": "aave-v3",
  "chain": "Multi-Chain",
  "chains": ["Ethereum", "Arbitrum", "Base", "..."],
  "tvl": 11739104046.11,
  "change_1d": -2.8068, "change_7d": -3.5365,
  "chainTvls": {
    "Ethereum": 9495291911.9, "Ethereum-borrowed": 7237575276.5,
    "Arbitrum": 375628462.5, "Arbitrum-borrowed": 293474208.5,
    "...": "..."
  }
}
```

**Confirmed quirk**: `chainTvls` mixes real chain keys with `<Chain>-borrowed`
pseudo-keys (the borrowed side of lending-protocol TVL, not a real chain).
`mapper.ts` filters these out before producing per-chain rows.

**No per-protocol timestamp** on this endpoint — there is no
`last_updated`-equivalent field. `listProtocols()` output leaves
`last_updated: null` rather than fabricating one (see DEVELOPER_GUIDE.md
Do & Don't).

### 2. TVL — `GET /protocol/{slug}`

Full protocol detail, including the same `currentChainTvls` flat map as
above (point-in-time, easier to consume than `chainTvls`'s nested
per-chain historical series) plus a `tvl` array of `{date, totalLiquidityUSD}`
historical points.

**Why this endpoint and not `GET /tvl/{slug}`**: DefiLlama also exposes a
trivial `GET /tvl/{slug}` that returns a bare number (confirmed live:
`12294897751.221842`, content-type allows it to parse as valid JSON). It
was deliberately **not used** — it carries strictly less information (no
chain breakdown, no protocol name) than `/protocol/{slug}`'s
`currentChainTvls`, which already satisfies "TVL per chain" — the more
useful shape for this provider's Normalized output (the `chain` field
specifically). Using the richer endpoint avoids a second, redundant
client method that would produce a degenerate single-row result.

**Confirmed live, real performance characteristic**: this response is
**huge** (9–27 MB for a multi-chain protocol like Aave V3), almost
entirely historical chart data (`tvl`, `chainTvls.<chain>.tvl`, `tokens`,
`tokensInUsd`, `totalDataChartBreakdown`) that this provider does not
need. The zod schema in `schemas.ts` only declares the fields actually
consumed (`id`, `name`, `slug`, `chain`, `chains`, `currentChainTvls`, and
the *shape* of `tvl` needed to read its last entry's `date`) — zod does
not validate or traverse undeclared keys, so the dominant cost is the
unavoidable `JSON.parse` of the full body, not validation. This is the
same non-strict-schema reasoning as every other provider in this
codebase, just with a much larger payload making the distinction matter
in practice.

**404 confirmed live, but as HTTP 400, not 404**:
```
GET /protocol/not-a-real-protocol-xyz  ->  400, plain-text body "Protocol not found"
```
This is a genuine DefiLlama API quirk worth calling out explicitly: unlike
ChainBroker and CoinGecko (both real 404s), an unknown protocol slug here
is a **400** with a **plain-text** (not JSON) body. Handled the same way
either way, since the base layer's `BaseHttpClient` checks `response.ok`
and constructs the error from the raw body text *before* attempting
`JSON.parse` — so a non-JSON error body never reaches the parse/validate
step. `errors.ts` adds `DefiLlamaNotFoundError` for this case, the same
pattern as `CoinGeckoNotFoundError`.

**`tvl` array's last entry as a response timestamp**: this provider
reads `tvl[tvl.length - 1].date` (Unix seconds) as the data freshness
timestamp for the whole response, applying it uniformly to every per-chain
row produced from that one fetch — this is honestly "when this response's
data was last refreshed," not a per-chain fabrication (see `mapper.ts`).

### 3. Revenue — `GET /summary/fees/{slug}?dataType=dailyRevenue`

### 4. Fees — `GET /summary/fees/{slug}?dataType=dailyFees`

Same endpoint, same response shape, different `dataType` query param —
confirmed live that the two calls return materially different numbers for
the same protocol (Aave V3, fetched seconds apart):

| dataType | total24h | total30d |
|---|---|---|
| `dailyFees` | 1,350,536 | 40,598,742 |
| `dailyRevenue` | 165,037 | 5,031,533 |

Fields consumed: `slug`, `name`, `displayName`, `chain`, `total24h`,
`total30d`, and `totalDataChart` (for the same last-entry-as-timestamp
trick as the TVL endpoint).

**Confirmed quirk**: this endpoint's `chain` field for Aave V3 returned
`"Optimism"` — not `"Multi-Chain"`, which is what `/protocols` reports for
the *same protocol*. DefiLlama's fees/revenue adapters apparently report
a single representative chain (possibly "where the adapter primarily
attributes the fee event," undocumented), not the protocol's full
multi-chain designation. This provider passes the value through as-is
rather than trying to reconcile it with the Protocols endpoint's `chain`
— the two endpoints are simply inconsistent about what "chain" means
here, and silently overriding one with the other would be a fabrication.

**404-as-400 also confirmed on this endpoint**:
```
GET /summary/fees/not-a-real-protocol-xyz?dataType=dailyFees
  -> 400, plain-text body "Fees for not-a-real-protocol-xyz not found, please visit /overview/fees to see available protocols"
```
Handled the same way as the TVL endpoint's 400 — via `DefiLlamaNotFoundError`.

### 5. Chains — `GET /chains`

Flat list of ~469 chains with current aggregate TVL. No params, no
per-chain timestamp.

Sample:
```json
{ "gecko_id": "harmony", "tvl": 213036.02, "tokenSymbol": "ONE", "cmcId": "3945", "name": "Harmony", "chainId": 1666600000 }
```

**Does not fit the requested per-protocol Normalized shape**: there is no
`project_slug`/`protocol_name` concept at the chain level — a chain isn't
a protocol. Forcing this into the same `NormalizedDefiLlamaMetrics` type
used by the other four endpoints would mean fabricating
`project_slug`/`protocol_name` values that don't exist. Given its own
type, `NormalizedChainTvl`, the same way CoinGecko's identity-only Search
endpoint got its own `NormalizedSearchResult` instead of being forced into
`NormalizedCoinMarketData` (see `../coingecko/SOURCE.md`).

## Error handling map

| Condition | Confirmed | Handling |
|---|---|---|
| Unknown protocol slug | Yes, live — **HTTP 400**, plain-text body, on both `/protocol/{slug}` and `/summary/fees/{slug}` | `DefiLlamaNotFoundError` (subclass of the base `ProviderHttpError`, never retryable), thrown by `getProtocolTvlByChain`/`getProtocolFees`/`getProtocolRevenue` after detecting status 400 — see `errors.ts`. |
| 429 (rate limited) | Not reproduced live (undocumented limit) | Retryable — in `retryOnStatusCodes`. |
| 500/502/503/504 | Standard transient upstream failure | Retryable — in `retryOnStatusCodes`. |
| Network timeout | N/A — client-enforced | `timeoutMs` + `AbortController`, via the shared base layer. |
| Malformed/non-JSON body | Not observed for any *successful* (2xx) response | Treated as retryable by the base layer default — conservative, consistent with the other two providers. |

## Future extension (not implemented in this pass)

DefiLlama also exposes `/overview/fees` and `/overview/revenue` (bulk,
all-protocols-at-once equivalents of `/summary/fees/{slug}`) — not used
here since the brief's "Revenue"/"Fees" endpoints are scoped per-protocol.
A future change could add `listProtocolFees()`/`listProtocolRevenue()`
bulk methods mirroring `listProtocols()`, flagged here rather than added
unilaterally, the same way CoinGecko's API-key extension was flagged
instead of implemented.
