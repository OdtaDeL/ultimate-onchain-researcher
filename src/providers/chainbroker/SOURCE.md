# ChainBroker — Source Contract

Investigated 2026-06-25 by inspecting chainbroker.io's Next.js build output
(webpack chunks under `/_next/static/chunks/`) rather than any published
documentation — **none exists**. This file is the authoritative reference
for what was found; treat anything not written here as unconfirmed.

## Base URL

```
https://api.chainbroker.io/api/v1
```

Found via the string `INTERNAL_API_URL||"https://api.chainbroker.io/api/v1"`
embedded in the site's main JS bundle. Backend is Django REST Framework
(standard DRF `PageNumberPagination` envelope on every list endpoint).

## Authentication

None. Every endpoint below returns `200` to an unauthenticated GET with
nothing but a `User-Agent` header — no API key, bearer token, or cookie.

## CORS

`Access-Control-Allow-Origin` is pinned to `https://chainbroker.io` (not a
wildcard). This is the frontend's own internal API, not a published product
— there is no SLA, no versioning guarantee, and fields/routes can change
without notice. CORS only blocks *browser* callers from other origins; it
does not affect a server-side ingestion job, but it is the clearest signal
that this is unofficial and should be treated as fragile.

## Rate limits

No `X-RateLimit-*` / `Retry-After` headers observed. Site is fronted by
Cloudflare, so aggressive request volume risks a silent bot-management
block (JS challenge / WAF), not a clean documented 429. Any implementation
must assume **invisible** limits and back off conservatively rather than
relying on response headers to self-throttle.

## GraphQL

Not present. No `/graphql` route, no GraphQL client or schema strings
anywhere in the bundle. REST/JSON only.

## Endpoint inventory

Per-project endpoints take a `{slug}` (e.g. `aave`, `lista-dao`) matching
the URL path segment on chainbroker.io/projects/{slug}/.

| Method | Path | Maps to platform need |
|---|---|---|
| GET | `/projects/list/` | bulk project discovery (paginated) |
| GET | `/projects/simple-list/` | lightweight slug+name directory |
| GET | `/projects/trending/` | — |
| GET | `/projects/metrics/{slug}/` | `project_metrics` (price/market cap/volume) |
| GET | `/projects/tvl/{slug}/` | `project_metrics.tvl` |
| GET | `/projects/backers/{slug}/` | **investors** — `funds` + ROI/investment count |
| GET | `/projects/fundraises/{slug}/` | **funding data** — `funding_rounds` + nested backers |
| GET | `/projects/vesting/{slug}/`, `/projects/vesting-schedule/{slug}/` | vesting curve (not in current schema) |
| GET | `/projects/unlocks/{slug}/?past=true\|false` | **unlock data** — `token_unlock_events` |
| GET | `/projects/public-sales/{slug}/` | IDO/public sale detail |
| GET | `/projects/security/{slug}/` | security score (not in current schema) |
| GET | `/projects/announcements/{slug}/` | — |
| GET | `/funds/` | fund leaderboard dashboard (fund-of-the-day, stats) |
| GET | `/funds/simple-list/` | **investors** — full fund directory (417 results) |
| GET | `/fundraises/list/` | **funding data, global feed** — paginated, 3,948 rounds |
| GET | `/unlocks/list/` | **unlock data, global feed** — paginated, 667 entries, pre-shaped for an alerts UI |

All list endpoints accept `?page=N`.

## Response schemas (observed, field names verbatim)

### `GET /projects/backers/{slug}/`

```jsonc
{
  "status": 200,
  "data": {
    "backers": [
      {
        "name": "Standard Crypto",
        "slug": "standard-crypto",
        "logo": "https://static.chainbroker.io/...",
        "logo_alt": "Standard Crypto",
        "logo_title": "Standard Crypto",
        "current_roi": { "percent": 180.0, "x": 2.8 },
        "investment_count": 14
      }
    ]
  }
}
```

### `GET /projects/fundraises/{slug}/`

```jsonc
{
  "status": 200,
  "data": [
    {
      "name": "Funding Round",
      "announce_date": "2020-10-12",
      "raise_amount": "$25M",        // display string, not numeric
      "valuation": null,             // display string when present, e.g. "$1.4B"
      "source": "https://www.coindesk.com/...",
      "backers": [ { "name": "...", "slug": "...", "current_roi": {...}, "investment_count": 252 } ],
      "lead_backers": []
    }
  ]
}
```

### `GET /fundraises/list/` (global, paginated)

```jsonc
{
  "status": 200,
  "data": {
    "list": {
      "count": 3948,
      "next": "https://api.chainbroker.io/api/v1/fundraises/list/?page=2",
      "previous": null,
      "total_pages": 165,
      "page_number": 1,
      "results": [
        {
          "slug": "daya",
          "name": "Daya",
          "ticker": null,
          "logo": "https://static.chainbroker.io/...",
          "raise_amount": "$2.4M",
          "raise_date": "2026-06-24",
          "category": [ { "name": "Financial Services", "slug": "financial-services" } ],
          "funds": [ { "name": "Alliance", "slug": "defi-alliance", "logo": "..." } ]
        }
      ]
    }
  }
}
```

### `GET /unlocks/list/` (global, paginated)

```jsonc
{
  "status": 200,
  "data": {
    "list": {
      "count": 667,
      "next": "https://api.chainbroker.io/api/v1/unlocks/list/?page=2",
      "previous": null,
      "total_pages": 28,
      "page_number": 1,
      "results": [
        {
          "slug": "plasma",
          "name": "Plasma",
          "ticker": "XPL",
          "next_unlock": "Jun 25, 2026",   // display date string
          "unlock_amount": "88.9M XPL",    // display string
          "unlock_value": "$8.2M",         // display string
          "round_name": "Ecosystem",
          "circulation": "26.0%",          // display percent string
          "price_change_24h": "+5.23%",
          "price_change_7d": "-15.1%",
          "price_change_30d": "+11.6%",
          "price_change_1y": null,
          "volume_24h": "$171M",
          "percent": "+0.89%"
        }
      ]
    }
  }
}
```

## Implication for the provider's normalization layer

Money/percentage fields (`raise_amount`, `unlock_amount`, `unlock_value`,
`circulation`, `price_change_*`) arrive as **pre-formatted display
strings** (`"$25M"`, `"88.9M XPL"`, `"+5.23%"`), not raw numbers. Mapping
these onto the Supabase `numeric` columns (`funding_rounds.amount_raised`,
`token_unlock_events.amount_usd`, etc.) requires a parser, not a field
rename. That parser is the first piece of real logic the implementation
will need — out of scope here per "interface only."

## Stability posture

This is an unofficial, undocumented internal API with no contract. The
provider interface below is deliberately implementation-agnostic so a
second implementation (e.g. Playwright-driven browser automation against
the rendered pages) can be swapped in behind the same contract if/when
Cloudflare blocks direct API access. See `provider.ts` for the contingency
note.
