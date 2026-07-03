# 01 — Architecture

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Telegram WebView / Browser                 │
│                                             │
│  Next.js App (Vercel)                       │
│  ├── Pages (App Router, "use client")       │
│  ├── Components (UI, Features, Shared)      │
│  ├── React Query (stale 30s, cache 5min)    │
│  └── Zustand (Watchlist, Favorites, Search) │
│                                             │
│  Next.js API Routes (/api/*)                │
│  └── Dashboard Query Layer (read-only DTOs) │
│                                             │
│  Supabase (PostgreSQL + PostgREST + RLS)    │
│  ├── Tables: projects, funds, investors...  │
│  └── Materialized Views: rankings, top_*   │
│                                             │
│  Ingestion CLI (sync:* scripts)             │
│  ├── ChainBroker (funding data)             │
│  ├── CoinGecko (market / price)             │
│  ├── DefiLlama (TVL)                        │
│  └── Scoring Engine → project_scores       │
└─────────────────────────────────────────────┘
```

## Folder Responsibilities

| Folder | Responsibility | Who imports it |
|---|---|---|
| `src/app/(tabs)/` | Tab page UI | Nobody imports |
| `src/app/project/` `src/app/fund/` | Detail page UI | Nobody imports |
| `src/app/api/` | REST API handlers | Frontend via HTTP |
| `src/components/` | Reusable React components | Pages |
| `src/lib/api/` | React Query hooks + data sources | Pages, components |
| `src/lib/format.ts` | Pure formatting utilities | Components |
| `src/lib/theme/` | Color/typography tokens | Components |
| `src/lib/utils.ts` | `cn`, `toSlug`, etc. | Pages, components |
| `src/store/` | Zustand stores | Pages, components |
| `src/scoring/` | Pure scoring engine | Ingestion CLI only |
| `src/dashboard/` | Server-side DTO assemblers | API handlers only |
| `src/providers/` | External API HTTP clients | Dashboard, ingestion |
| `src/ingestion/` | Data ingestion pipelines | CLI scripts |
| `src/types/` | `database.types.ts` | Dashboard, ingestion |

## Layer Boundaries (Enforced Rules)

1. **Pages never import from `src/dashboard/`** — only API handlers do
2. **Pages never import from `src/providers/`** — only dashboard/ingestion do
3. **`src/scoring/` is pure** — no Supabase, no fetch, no side effects
4. **`src/dashboard/` is server-side only** — no `"use client"`, no React imports
5. **Components never call `fetch()` directly** — only React Query hooks
6. **`src/lib/api/sources/`** never fabricate values — `null` propagates, no `?? 0`

## Data Flow

```
External APIs → Ingestion CLI → Supabase DB → Dashboard Query Layer
                                                      ↓
                                              API Route Handler
                                                      ↓
                                           React Query (browser)
                                                      ↓
                                            Page → Components
                                                      ↓
                                                 Zustand Store
                                           (watchlist, favorites)
```

## Key Architectural Decisions

- **Materialized views** pre-aggregate rankings to avoid expensive sorts on every request; refreshed after each score sync
- **`mapQueryResult` adapter** normalizes TanStack Query's `isPending/error/data` into `{ loading, error, data, refresh }` so pages have one consistent interface
- **Null-drop pattern** in DTO mappers: rows missing required fields return `null` and are filtered out — never filled with invented zeros
- **`id === name`** in Zustand entity stores — temporary coupling; future work is to use a real entity ID from the DB
- **Slug routing** via `toSlug(name)`: lowercased, spaces-to-hyphens; detail pages decode back to name for query
