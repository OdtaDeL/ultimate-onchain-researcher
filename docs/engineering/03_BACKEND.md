# 03 — Backend

## API Route Handlers (`src/app/api/`)

All handlers are Next.js Route Handlers (App Router). They call the Dashboard Query Layer and return JSON.

| Endpoint | Handler | Data Source |
|---|---|---|
| `GET /api/home` | `api/home/route.ts` | Materialized views |
| `GET /api/projects` | `api/projects/route.ts` | `top_projects` view |
| `GET /api/funds` | `api/funds/route.ts` | `top_funds` view |
| `GET /api/projects/[slug]` | `api/projects/[slug]/route.ts` | Multiple tables |
| `GET /api/funds/[slug]` | `api/funds/[slug]/route.ts` | Multiple tables |
| `GET /api/search` | `api/search/route.ts` | `?q=` text search |
| `GET /api/rankings` | `api/rankings/route.ts` | `weekly/monthly_rankings_mv` |

## Dashboard Query Layer (`src/dashboard/`)

Server-side only. The only layer allowed to compose frontend-ready DTOs from raw DB rows.

```
dashboard/
  projects.ts    — fetchProjectOverview, fetchProjectMetrics, fetchProjectFundingRounds,
                   fetchProjectUnlocks, fetchRelatedProjects
  funds.ts       — fetchFundOverview, fetchFundPortfolio, fetchFundInsights
  home.ts        — fetchHomeData (trending, rankings, unlocks, fundraises)
  search.ts      — fullTextSearch(query)
  rankings.ts    — fetchWeeklyRankings, fetchMonthlyRankings
```

## DTO Mapping Rules

- Rows missing required fields (`name`) → `null` → filtered out (null-drop pattern)
- All optional metrics use `?? null` — never `?? 0`
- `amountRaisedUsd` is nullable in schema; propagates as `null` to frontend
- `grade` cast from `string | null` to `Grade | null` with runtime check
- No business logic in mappers: no threshold checks, no status derivation, no lead designation

## Ingestion CLI (`src/ingestion/`)

CLI scripts run via `npm run sync:*`. Not part of the web server.

```
sync:funding    — ChainBroker → projects, investors, funding_rounds, funding_investors
sync:market     — CoinGecko → project_metrics
sync:tvl        — DefiLlama → project_metrics (tvl column)
sync:unlocks    — ChainBroker → token_unlocks
sync:scores     — Reads DB → ScoreEngineInput → runScoreEngine() → project_scores → refresh MVs
```

## Providers (`src/providers/`)

Pure HTTP clients. No Supabase imports. No React imports.

```
chainbroker.ts   — ChainBroker API client (funding data)
coingecko.ts     — CoinGecko API client (market / price data)
defillama.ts     — DefiLlama API client (TVL data)
```

## Security

- All DB access uses Supabase anon key with RLS (read-only for web)
- Ingestion uses service-role key (not exposed to browser)
- API keys for providers are env vars (`CHAINBROKER_API_KEY`, etc.)
- No auth on API routes currently — data is public
