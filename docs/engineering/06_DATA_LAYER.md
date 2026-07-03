# 06 — Data Layer

## Overview

The client-side data layer is `src/lib/api/`. It contains:

1. **Hooks** (`hooks/`) — React Query wrappers, one per entity type
2. **Sources** (`sources/`) — DTO mappers that shape raw API responses into typed page data
3. **Client** (`client.ts`) — `apiFetch<T>`: timeout + signal + envelope unwrap
4. **Map Query Result** (`map-query-result.ts`) — adapter from TanStack Query to `AsyncDataResult<T>`

## React Query Configuration

Configured in `src/lib/query/defaults.ts`:

```typescript
{
  staleTime: 30_000,           // 30 seconds
  gcTime: 300_000,             // 5 minutes
  retry: 2,
  networkMode: "offlineFirst", // works in Telegram WebView
  refetchOnReconnect: true,
  refetchOnWindowFocus: false, // Telegram has no window focus events
}
```

## `apiFetch<T>` — `src/lib/api/client.ts`

- Creates 10-second `AbortController` (timeout)
- Composes with React Query's signal (request cancel on unmount)
- Parses `{ success, data }` envelope
- Throws `ApiClientError` for non-success responses

## `mapQueryResult` — `src/lib/api/map-query-result.ts`

```typescript
mapQueryResult<T>(query, fallback): AsyncDataResult<T>

// Maps:
//   isPending + no data   → { loading: true, data: fallback, error: null }
//   error                  → { loading: false, data: fallback, error }
//   data                   → { loading: false, data, error: null }
// refresh = query.refetch
```

## Source Files (DTO Mappers)

### `src/lib/api/sources/home.ts`

Maps home API response → `HomeData`:
- `trending`, `weeklyRankings`, `upcomingUnlocks`, `recentFundraises`
- `amountRaisedUsd` propagates as `null` (was `?? 0` — fixed in Session 3)

### `src/lib/api/sources/project.ts`

Maps project API response → `ProjectData`. All metric fields nullable. No fabrication:
- `score: overview.score?.totalScore ?? null`
- `grade: (overview.score?.grade ?? null) as Grade | null`
- `marketCap: metrics?.marketCapUsd ?? null`
- Funding rounds: all investors in `otherInvestorsSummary`; `leadInvestor` prop absent (no `is_lead` in schema)
- Next unlock: `percentOfSupply` nullable; `riskLevel` removed (no backend threshold)
- `chain` field removed entirely (no backend source)

### `src/lib/api/sources/fund.ts`

Maps fund API response → `FundData`. Removed fabricated fields:
- `activityStatus` removed — no backend threshold
- `activeInvestments` removed — no active/exited status in schema
- `leadInvestments` removed — no `is_lead` flag in schema
- `website: overview.website ?? null`
- `twitterHandle: overview.twitter ?? null`
- `portfolioSize: overview.portfolioProjectCount ?? null`

## Hooks

| Hook | File | EMPTY fallback |
|---|---|---|
| `useHome()` | `hooks/use-home.ts` | `EMPTY_HOME_DATA` |
| `useProject(slug)` | `hooks/use-project.ts` | `EMPTY_PROJECT_DATA` (all nulls) |
| `useFund(slug)` | `hooks/use-fund.ts` | `EMPTY_FUND_DATA` (all nulls) |
| `useSearch(query)` | `hooks/use-search.ts` | `{ projects: [], funds: [] }` |
| `useRankings(period)` | `hooks/use-rankings.ts` | `[]` |

## Error Handling

- `ApiClientError` extends `Error` with `code?: string`
- All pages check `error` before rendering data
- `ErrorState` component shown on error, with `onRetry` bound to `refresh()`
- No silent error suppression; errors are always surfaced to the user
