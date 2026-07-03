# 13 — Performance Audit

## React Query Caching

- `staleTime: 30s` — data is treated as fresh for 30 seconds; no re-fetch within that window
- `gcTime: 5min` — unused data stays in memory for 5 minutes
- `networkMode: "offlineFirst"` — serves cached data when offline (Telegram WebView can lose connection)
- `retry: 2` — two retries before showing error state
- `refetchOnWindowFocus: false` — Telegram WebView has no focus events; avoids spurious re-fetches

These settings are appropriate for the Telegram Mini App context.

## Rendering

- All pages are `"use client"` (no RSC). This is acceptable since data comes from API routes + React Query.
- No SSR — first render is always the empty fallback (skeleton state), then data loads
- Skeleton states are implemented for all loading paths — no blank screen flashes

## Database

- Materialized views for rankings: pre-computed, fast reads
- No client-side sorting of large arrays
- `recentInvestments` is top-5 only (DB-side limit)
- `portfolio` is fetched in full — acceptable for current data volumes; add pagination when portfolios exceed ~100 items

## Network

- `apiFetch` has 10-second timeout — prevents indefinite hangs
- AbortController composed with React Query signal — in-flight requests cancelled on unmount
- No waterfall fetching: all data for a page is fetched in one API call

## Bundle

- No bundle analysis has been run. Recommend `next build --debug` + `@next/bundle-analyzer` before production launch.
- Lucide React: individual icon imports (not full library import) — already good
- TanStack Query: ~12KB gzipped
- Zustand: ~2KB gzipped

## Image / Asset

- `CoinIcon` uses `<img>` with fallback initials — no `next/image` optimization
- Logo URLs come from external CDNs (ChainBroker, CoinGecko) — no size control
- Recommend adding `next/image` with `unoptimized={false}` and a whitelist of domains for production

## Perceived Performance

- Skeleton screens for all data-dependent UI ✅
- No spinner-only loading states (skeletons are better for layout stability) ✅
- Error retry is one button tap ✅
