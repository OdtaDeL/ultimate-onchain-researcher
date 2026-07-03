# 17 — Session History

Append-only log. Most recent session first.

---

## Session 45 — 2026-07-03

### Feature: Monthly Picks section on home page

**What was built**: Wired the existing `GET /api/home` endpoint to also return monthly-ranked projects alongside the weekly picks, and added a "Monthly Picks" horizontal scroll section to the home page.

**Files changed**:
- `src/api/home.ts` — added `getMonthlyPicks` to `Promise.all`; `monthlyPicks` included in `successResponse`
- `src/lib/api/sources/home.ts` — added `MonthlyPickDto` import; added `monthlyPicks` to `RealHomeSections` and `HomeData`; added `mapMonthlyPickToCardProps` (same mapping as weekly — `MonthlyPickDto` has identical card-relevant fields); wired in `fetchHomeData`
- `src/lib/api/hooks/use-home.ts` — added `monthlyPicks: []` to `EMPTY_HOME_DATA` fallback; updated stale comment
- `src/app/(tabs)/page.tsx` — added `MONTHLY_PICKS_SKELETON_COUNT`; added `monthlyPicks` skeleton array; added "Monthly Picks" `<Section>` with `<HorizontalScroller snap>` using `WeeklyPickCard` (same component, same props shape)
- `src/api/__tests__/home.test.ts` — added `monthly_rankings_mv` mock; added assertion for `monthlyPicks.length` and `monthlyPicks[0].slug`; renamed test to "returns all five sections"

**Verification**: TypeScript clean (`tsc --noEmit`), 19/19 tests pass.

---

## Session 44 — 2026-07-03

### Audit findings

Read `src/app/(tabs)/page.tsx` (clean), `src/lib/api/sources/home.ts` (stale comment found), `src/lib/utils.ts` (clean), `src/app/(tabs)/search/page.tsx` (clean), `src/app/(tabs)/profile/page.tsx` (clean), `src/store/lib/safe-storage.ts` (clean). One actionable issue found: stale header comment in `home.ts` omitting `newFunding`/recentFundraises from the list of real API sections.

### D-049: Correct home source header to include newFunding as a real API section

**Problem**:

`src/lib/api/sources/home.ts` lines 1–7:
```
// Data source for useHome(). Phase 3 of the mock -> real migration.
//
// Weekly Picks (Phase 2) and Unlock Alerts (Phase 3) now come from the
// real GET /api/home endpoint. Both DTOs are mapped directly; ...
```
The comment said only "Weekly Picks (Phase 2) and Unlock Alerts (Phase 3)" come from the real endpoint. But `newFunding` (= `recentFundraises`) is also fetched from the real endpoint at line 155 (`real.newFunding.map(mapNewFundingToCardProps)`). The `newFunding` wiring predated Phase 2/3 (D-022 fixed its navigation, implying it was already real). A reader seeing the header and then the `real.newFunding` mapping at line 155 would find no header explanation for why that section is real. Also `topFunds` is fetched from the real endpoint but not mentioned.

**Fix**:

Replaced the Phase 2/3 framing with an explicit inventory of which sections are real vs. still mock, matching the code:
- Real: `weeklyPicks`, `newFunding` (→ recentFundraises), `topFunds`, `unlockAlerts`
- Mock: `marketOverview`, `fearGreed`, `trendingProjects/Funds/Platforms`, `topGainers`, `recentlyAdded`

**Verification**: 19/19 tests pass.

---

## Session 43 — 2026-07-03

### Audit findings

Read `src/lib/api/map-query-result.ts` (clean), `src/lib/api/errors.ts` (stale comment found), `src/lib/api/sources/markets.ts` (clean), `src/lib/api/sources/search.ts` (clean), `src/lib/api/sources/project.ts` (clean), `src/lib/api/sources/fund.ts` (clean), `src/store/watchlist-store.ts` (clean), `src/store/search-store.ts` (clean), `src/store/ui-store.ts` (clean), `src/lib/api/client.ts` (clean), `src/scoring/types.ts` (clean), `src/app/(tabs)/markets/page.tsx` (clean). One actionable issue found: stale comment in `src/lib/api/errors.ts`.

### D-048: Remove stale "today a mock rejection, tomorrow a failed fetch" comment from errors.ts

**Problem**:

`src/lib/api/errors.ts` lines 1–5:
```
// Frontend mirror of src/api/errors.ts's normalization pattern (read, not
// imported — that module also exports server-only handler functions). Any
// error a hook's data source throws — today a mock rejection, tomorrow a
// failed fetch — passes through here so every hook reports errors the same
// shape, regardless of source.
```
The phrase "today a mock rejection, tomorrow a failed fetch" was written when hooks threw mock errors. D-033/D-034/D-029/D-031 and earlier sessions wired all data sources to real API calls via `apiFetch`, so "tomorrow" has arrived — all errors are now real network failures, timeouts, or `ApiClientError`s thrown by `apiFetch`. The "today/tomorrow" framing is false.

**Fix**:

Replaced with: "a network failure, a timeout, or an ApiClientError already thrown by apiFetch — passes through here so every hook reports errors the same shape, regardless of source."

**Verification**: 19/19 tests pass.

---

## Session 42 — 2026-07-03

### Audit findings

Completed Session 41's remaining reads: `src/api/types.ts` (clean), `src/api/project.ts` (clean), `src/api/fund.ts` (clean), `src/api/index.ts` (clean), `src/api/__tests__/mock-supabase.ts` (clean). One actionable issue found: stale parenthetical in `use-search.ts`.

### D-047: Remove stale "(today: re-filter)" parenthetical from use-search.ts

**Problem**:

`src/lib/api/hooks/use-search.ts` lines 13–15 contained:
```
is what drives TanStack Query to fetch (today: re-filter) per distinct
query — mirrors how the real `GET /api/search?q=...` is query-driven.
```
The parenthetical `(today: re-filter)` and the phrase "mirrors how the real" were written when `fetchSearchData` was doing client-side mock filtering of static data and "mirroring" how the real API would behave. D-034 replaced that with a real `GET /api/search?q=...` call, making both the "(today:)" hedge and the "mirrors" framing false — `fetchSearchData` IS the real API call now.

**Fix**:

Updated `src/lib/api/hooks/use-search.ts` comment to:
```
is what drives TanStack Query to re-fetch per distinct query against
`GET /api/search?q=...`.
```

**Verification**: 19/19 tests pass.

---

## Session 40 — 2026-07-03

### Audit findings

Continued from Session 39. Read `src/app/settings/page.tsx` (clean), `src/app/about/page.tsx` (clean), `src/app/project/[slug]/page.tsx` (one latent issue — `toSlug(item.name)` on line 267 for `relatedProjects`, but `relatedProjects` is always `[]` per `project.ts` line 164, so it's dead code today), `src/identity/matcher.ts` (clean), `src/identity/resolver.ts` (clean), `src/identity/types.ts` (clean), `src/components/ui/filter-bar.tsx` (clean), `src/components/layout/page-layout.tsx` (clean), `src/components/features/search/mock-data.ts` (stale comment found), `src/components/features/search/index.ts` (clean). One actionable issue found: stale comment in `search/mock-data.ts`.

### D-046: Correct stale "mock-filtered list" comment in search/mock-data.ts

**Problem**:

`src/components/features/search/mock-data.ts` lines 1–4:
```
// Mock data for the Search screen. Names deliberately overlap with the
// Markets mock entities so selecting a Recent/Trending term actually
// surfaces a result in the mock-filtered list below — not re-exported from
// index.ts, same isolation convention as every other feature's mock-data.
```

Two issues:

1. "Names deliberately overlap with the Markets mock entities so selecting a Recent/Trending term actually surfaces a result in the mock-filtered list below" — this rationale describes the old behavior where search was done client-side by filtering mock project/fund arrays. D-034 wired search to the real `GET /api/search` API and removed all client-side mock filtering. There is no "mock-filtered list below" — the file contains only `mockRecentSearches` and `mockTrendingSearches`, neither of which is a filterable list of entities.

2. `mockRecentSearches` is a dead export. The search page (`search/page.tsx`) reads recent searches from `useRecentSearches()` (Zustand store), not from this file. No production code imports `mockRecentSearches`.

`mockTrendingSearches` is live — `src/lib/api/sources/search.ts` imports it and returns it in `SearchData.trendingSearches` (no backend DTO for trending searches yet).

Same root cause as D-044/D-045: comment written when the feature was mock-only, never updated as D-034 replaced client-side filtering with real API calls and D-020 moved recent searches to the Zustand store.

**Fix**:

Replaced the four-line comment with an accurate live/dead description:
```
// Mock data for the Search screen.
// mockTrendingSearches is live — imported by src/lib/api/sources/search.ts
//   for the Trending Searches list (no backend DTO yet).
// mockRecentSearches is a dead export — the search page reads recent
//   searches from the Zustand store, not from this file.
```

**Verification**: `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 39 — 2026-07-03

### Audit findings

Continued from Session 38. Read `src/app/(tabs)/search/page.tsx` (clean), `src/components/features/home/mock-data.ts`, `src/components/features/search/mock-data.ts`, `src/lib/api/sources/home.ts`, `src/lib/api/sources/search.ts`, `src/app/fund/[slug]/page.tsx` (clean), `src/app/(tabs)/watchlist/page.tsx` (clean), `src/app/(tabs)/profile/page.tsx` (clean), `src/app/favorites/page.tsx` (clean). One issue found: `home/mock-data.ts` falsely claimed none of its exports are imported by real app code.

### D-045: Correct false "never imported by real app code" claim in home/mock-data.ts

**Problem**:

`src/components/features/home/mock-data.ts` lines 1–3:
```
// Preview/demo data for Home feature components ONLY — never imported by
// real app code. Shapes mirror each component's own prop types (not any
// backend DTO) so this file has zero coupling to src/dashboard or src/api.
```

The second sentence is false. `src/lib/api/sources/home.ts` — which is real app code, called on every Home page load — imports 7 exports from this file:

```typescript
import {
  mockFearGreed,
  mockMarketOverview,
  mockRecentlyAdded,
  mockTopGainers,
  mockTrendingFunds,
  mockTrendingPlatforms,
  mockTrendingProjects,
} from "@/components/features/home/mock-data";
```

These 7 constants fill the `marketOverview`, `fearGreed`, `trendingProjects`, `trendingFunds`, `trendingPlatforms`, `topGainers`, and `recentlyAdded` fields in `HomeData` — sections that have no backend DTO yet (DECISION_LOG.md R-10/R-11/R-12). They are in the production bundle on every home page render.

The comment also failed to note that 4 other exports are dead code:
- `mockWeeklyPicks` — replaced by real `/api/home` data in D-029
- `mockRecentFundraises` — replaced by real `/api/home` data in D-022/D-031
- `mockUnlockAlerts` — replaced by real `/api/home` data in D-031
- `mockWatchlistSummary` — removed from `HomeData` entirely in D-020 (page reads Zustand store directly)

Same root cause as D-044: the comment was written when all exports were purely illustrative, then successive implementation sessions (D-020, D-022, D-029, D-031) changed which exports were live vs. dead without updating the header.

**Fix**:

Replaced the three-line header with an accurate live/dead inventory:
```
// Mock data for Home feature components — display-shaped, matching each
// component's own prop types (not any backend DTO).
//
// Live exports (imported by src/lib/api/sources/home.ts; no backend DTO yet):
//   mockMarketOverview, mockFearGreed, mockTrendingProjects, mockTrendingFunds,
//   mockTrendingPlatforms, mockTopGainers, mockRecentlyAdded
//
// Dead exports (nothing imports them; replaced by real API data):
//   mockWeeklyPicks    — replaced by /api/home weeklyPicks in D-029
//   mockRecentFundraises — replaced by /api/home newFunding in D-022
//   mockUnlockAlerts   — replaced by /api/home unlockAlerts in D-031
//   mockWatchlistSummary — removed from HomeData in D-020 (reads Zustand store)
```

**Verification**: `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 38 — 2026-07-03

### Audit findings

Audited: `src/lib/api/sources/markets.ts`, `src/lib/api/sources/search.ts`, all five `src/api/__tests__/*.test.ts` files, `src/components/ui/card.tsx`, `insight-card.tsx`, `empty-state.tsx`, `error-state.tsx`, `stat-grid.tsx`, `src/app/(tabs)/page.tsx`, `src/app/(tabs)/markets/page.tsx`, `src/components/features/markets/mock-data.ts`, `src/components/features/markets/index.ts`, `src/app/(tabs)/search/page.tsx`. One issue found: stale header comment in `markets/mock-data.ts`.

### D-044: Correct false "never bundled into production code" claim in markets/mock-data.ts

**Problem**:

`src/components/features/markets/mock-data.ts` lines 1–3:
```
// Mock data for the Markets screen — display-shaped, matching each row
// card's own Props type, never a backend DTO. Not re-exported from
// index.ts, so it can never be accidentally bundled into production code.
```

The final sentence is false on two counts:

1. `mockMarketsFilters` is directly imported by `src/app/(tabs)/markets/page.tsx` (the filter bar has no real API yet). It is in the production bundle.
2. `mockMarketsPlatforms` is directly imported by `src/lib/api/sources/markets.ts` and `src/lib/api/sources/search.ts` (platforms tab and search platforms have no real API yet). Also in the production bundle.

The comment was written when mock-data was purely illustrative. After D-033 (markets funds wired to real API) and D-034 (search funds wired to real API), the file became a hybrid: some exports are live placeholders, some are dead code. The comment was never updated.

Additionally, `mockMarketsProjects` and `mockMarketsFunds` are now dead exports — nothing imports them after D-033 removed the projects mock from markets source and D-034 removed the funds mock from search source. The comment did not note this either.

**Fix**:

Replaced the three-line header with an accurate per-export description:
```
// Mock data for the Markets screen — display-shaped, matching each row
// card's own Props type, never a backend DTO.
// mockMarketsFilters is imported by markets/page.tsx (no filter API yet).
// mockMarketsPlatforms is imported by markets.ts and search.ts (no platforms API yet).
// mockMarketsProjects and mockMarketsFunds are dead exports — replaced by
// real API data in D-033 and D-034; nothing imports them.
```

**Verification**: `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 37 — 2026-07-03

### Audit findings

Completed full audit of all remaining unread component files: `project-row-card.tsx`, `fund-row-card.tsx`, `weekly-pick-card.tsx`, `unlock-alert-card.tsx`, `trending-section.tsx`, `recent-fundraise-card.tsx`, `bottom-navigation.tsx`, `funding-round-row.tsx`, `investment-row.tsx`, `recent-search-list.tsx`, `trending-search-list.tsx`, `platform-row-card.tsx`, `market-overview-card.tsx`, `fear-greed-card.tsx`, `top-gainer-card.tsx`, `recently-added-card.tsx`, `number-formatter.tsx`, `percentage.tsx`, `coin-icon.tsx`, `price-formatter.tsx`, `avatar.tsx`, `pull-to-refresh.tsx`, `app-container.tsx`, `src/lib/format.ts`, `src/lib/theme/*.ts`, `project-detail/mock-data.ts`, `fund-detail/mock-data.ts`. Two issues found: production source files importing types directly from `mock-data.ts` instead of each feature's public barrel.

### D-043: Re-export production types from feature barrels, not mock-data files

**Problem**:

`src/lib/api/sources/project.ts` line 25:
```typescript
import type { ScoreCategory } from "@/components/features/project-detail/mock-data";
```

`src/lib/api/sources/fund.ts` line 16:
```typescript
import type { FundInsight } from "@/components/features/fund-detail/mock-data";
```

Both `ScoreCategory` (the shape of a score breakdown row) and `FundInsight` (the shape of a fund insights card row) are used throughout production data-mapping code — `FundData.insights: FundInsight[]`, `ProjectData.scoreCategories: ScoreCategory[]`, `mapScoreCategories`, `mapInsights`. They are production display types, not mock data.

They happen to be defined in `mock-data.ts` because that's where the first consumers (illustrative mock constants) were written. As of D-029/D-031/D-033/D-034, the real source files (`project.ts`, `fund.ts`) became the primary consumers — but the import paths were never updated to reflect that the types now have a permanent home.

If a future developer cleans up `mock-data.ts` (reasonable since the pages use real data), the production source files break at import resolution, not at a compile error that names the actual type — the failure is a missing file.

**Fix**:

- `project-detail/index.ts`: Added `export type { ScoreCategory } from "./mock-data"` — the feature's public barrel is now the stable import point for this type
- `fund-detail/index.ts`: Added `export type { FundInsight } from "./mock-data"` — same
- `project.ts`: Import path changed to `@/components/features/project-detail`
- `fund.ts`: Import path changed to `@/components/features/fund-detail`

The `mock-data.ts` files themselves are unchanged — the mock constants they export (`mockScoreCategories`, `mockFundInsights`, etc.) still use the types locally. Only the import paths in the production source files change.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 36 — 2026-07-03

### Audit findings

Audited remaining unread files: `src/api/index.ts`, `src/lib/utils.ts`, `src/lib/query/index.ts`, `src/lib/theme/` (all 8 files), `src/identity/identity-service.ts`, `src/scoring/score-engine.ts`, `src/scoring/types.ts`, `src/components/shared/score-circle.tsx`, `src/components/features/home/watchlist-summary-card.tsx`, `src/components/features/home/types.ts`, `src/api/__tests__/home.test.ts`. One substantive issue found: `ScoreGrade` in the theme module is a locally-defined duplicate of the authoritative `Grade` type from the scoring engine.

### D-042: Link `ScoreGrade` to `Grade` from the scoring engine

**Problem**:

`src/lib/theme/colors.ts` line 33 defined:
```typescript
export type ScoreGrade = "A+" | "A" | "B" | "C" | "D";
```

`src/scoring/types.ts` line 160 defines:
```typescript
export type Grade = "A+" | "A" | "B" | "C" | "D";
```

Identical shapes, independent definitions. The `scoreGradeColor` constant (`Record<ScoreGrade, { text, bg, ring }>`) has exhaustive entries for all five grades. If the scoring engine gains a new grade (e.g. "S"), the local definition would not update and `scoreGradeColor` would silently miss it — rendering with no ring/text color for the new grade at runtime, with no compile-time error. Same divergence risk as D-035 (`FundInsightsDto`) and D-036 (`Grade` in project source).

`ScoreGrade` is used in: `score-circle.tsx`, `project-row-card.tsx`, `weekly-pick-card.tsx`, `watchlist-summary-card.tsx` (via `home/types.ts`), and `project-detail/mock-data.ts` — all via `@/lib/theme` or `@/components/features/home`. None of these needed changes; only the definition site required updating.

**Fix**:

Replaced the local definition in `src/lib/theme/colors.ts` with:
```typescript
import type { Grade } from "@/scoring/types";
export type ScoreGrade = Grade;
```

`type ScoreGrade = Grade` makes `ScoreGrade` a structural alias — if `Grade` expands, TypeScript will error at `scoreGradeColor`'s exhaustive `Record` because a new grade member won't have an entry, surfacing the gap at compile time rather than silently passing.

Also corrected the stale header comment in `src/components/features/home/types.ts` — the comment said "a *future* page would map backend DTOs *into*" these prop types; the home page has done exactly that mapping since D-029/D-031.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 35 — 2026-07-03

### Audit findings

Continued from Session 34. Read `src/app/api/search/route.ts`, `src/app/api/rankings/weekly/route.ts`, `src/app/api/rankings/monthly/route.ts`. All three had stale "not yet consumed" comments. Search and weekly rankings were wired in D-034 and D-033 respectively; the DTO fields cited as blockers are present in the live DTOs. Monthly rankings genuinely has no UI consumer, but the comment incorrectly attributed the absence to a DTO-gap that does not exist.

### D-041: Correct "not yet consumed" comments in search and rankings route files

**Problem**:

`src/app/api/search/route.ts` lines 5–10 said:
> "Not yet consumed by src/lib/api/sources/search.ts: ProjectSearchResultDto and FundSearchResultDto are missing the market-metric and portfolio-count fields..."

This is wrong. D-034 wired `fetchRealProjectResults` and `fetchRealFundResults`, both calling `GET /api/search`. The DTOs carry all required fields.

`src/app/api/rankings/weekly/route.ts` lines 6–10 said:
> "Not yet consumed by src/lib/api/sources/markets.ts: WeeklyPickDto is missing the market-metric fields ProjectRowCard requires (tvl, marketCap, changePercent24h, grade)..."

Also wrong. D-033 wired `fetchRealProjectRows` calling this endpoint. `WeeklyPickDto` carries `tvlUsd`, `marketCapUsd`, `priceChange24hPercent`, and `grade`. D-029 also wired the Home Weekly Picks section to this route.

`src/app/api/rankings/monthly/route.ts` lines 4–5 said:
> "Same DTO-gap situation as /api/rankings/weekly (see that route's comment); not yet consumed by any source."

The weekly route's comment is now corrected, so the cross-reference is broken. Monthly rankings genuinely has no UI consumer, but the reason is not a DTO-gap — the DTO is complete and the endpoint is tested; no UI section for monthly rankings has been built yet.

**Fix**:

- `src/app/api/search/route.ts`: Replaced stale block with accurate statement that the route is consumed by search source on every search query.
- `src/app/api/rankings/weekly/route.ts`: Replaced stale block with accurate statement that the route is consumed by markets source (`fetchRealProjectRows`) and home source on every Markets page load and Home Weekly Picks render.
- `src/app/api/rankings/monthly/route.ts`: Replaced stale cross-reference with accurate statement that the route has no UI consumer yet — not due to a DTO-gap but because no monthly rankings UI section exists.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 34 — 2026-07-03

### Audit findings

Continued audit. Read `src/app/api/home/route.ts`, `src/app/api/_lib/supabase-client.ts`, `src/app/api/projects/[slug]/route.ts`, `src/app/api/funds/[slug]/route.ts`. Both detail route files had the most egregious stale comments found so far — claiming these routes are "not yet consumed" and the app has "no dynamic [slug] route". Both routes are the live primary data source for their respective detail pages.

### D-040: Correct "not yet consumed" comments in both detail API route files

**Problem**:

`src/app/api/projects/[slug]/route.ts` lines 4–11 said:
> "Not yet consumed by src/lib/api/sources/project.ts: useProject() takes no slug (Project Detail is a single static illustrative screen, no dynamic [slug] route in the app)..."

`src/app/api/funds/[slug]/route.ts` lines 4–12 said:
> "Not yet consumed by src/lib/api/sources/fund.ts: useFund() takes no slug (Fund Detail is a single static illustrative screen, same situation as Project Detail)..."

Both are completely wrong. `useProject(slug)` calls `apiFetch('/api/projects/${slug}')` on every Project Detail load. `useFund(slug)` calls `apiFetch('/api/funds/${slug}')` on every Fund Detail load. `src/app/project/[slug]/page.tsx` and `src/app/fund/[slug]/page.tsx` are fully wired dynamic routes. The referenced "missing fields" (chain, circulatingSupply, totalSupply, activeInvestments) are correctly documented in the source files as fields that genuinely lack a DB source — not as blockers to the route being consumed.

**Fix**: Replaced both comment blocks with accurate descriptions: each route is a thin HTTP transport consumed by its source file on every detail page load; missing fields are documented in the source file's header comment.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 33 — 2026-07-03

### Audit findings

Completed the full repository audit. Read all remaining unread files: `src/store/ui-store.ts`, `src/store/index.ts`, `src/app/about/page.tsx`, `src/lib/telegram/types.ts`, `src/lib/telegram/use-telegram-webapp.ts`, `src/config/env.ts`, `src/api/types.ts`, `src/api/response.ts`, `src/lib/query/defaults.ts`, `src/lib/query/keys.ts`, `src/lib/query/client.ts`, `src/lib/api/hooks/index.ts`. One stale comment found in `keys.ts` claiming dynamic slug routes don't exist yet — both are fully wired.

### D-039: Correct stale comment in query keys factory

**Problem**: `src/lib/query/keys.ts` lines 8–12 explained `slug?` as follows:

> "`slug` is optional on project()/fund() because neither screen has a dynamic [slug] route yet (both render one static illustrative entity — see src/lib/api/sources/project.ts and fund.ts). The factory already accepts a slug so wiring real routing later is a call-site change, not a key-shape change."

Both `src/app/project/[slug]/page.tsx` and `src/app/fund/[slug]/page.tsx` exist and are fully wired — `useProject(slug)` and `useFund(slug)` both receive a real slug from the URL params. The comment's premise is wrong. The slug is optional for batch cache invalidation (`invalidateQueries({ queryKey: queryKeys.project() })` matches all `["project", *]` cache entries), not because the routes don't exist.

**Fix**: Replaced the comment with an accurate explanation of the optional slug's purpose as a cache-management affordance for future batch invalidations after server-side writes.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 32 — 2026-07-03

### Audit findings

Continued from Session 31. Read all remaining unaudited files: `src/dashboard/home.ts`, `src/dashboard/search.ts`, `src/dashboard/types.ts`, `src/api/pagination.ts`, `src/api/errors.ts`, `src/lib/api/errors.ts`, `src/lib/api/map-query-result.ts`, `src/lib/api/dto.ts`, `src/lib/api/hooks/use-markets.ts`, `src/lib/api/hooks/use-search.ts`, all tab pages (markets, search, watchlist, profile), `src/app/favorites/page.tsx`, `src/app/settings/page.tsx`, `src/store/auth-store.ts`, `src/components/layout/app-container.tsx`. Two more stale comments found — same failure mode as D-037.

### D-038: Correct two stale comments in auth-store and AppContainer

**Problem**:

- `src/store/auth-store.ts` line 5: "The real Telegram WebApp `initDataUnsafe.user` payload isn't wired into the app yet (see src/lib/telegram); when it is, whatever reads it calls `setIdentity` once." — D-023 wired exactly this in `AppContainer` lines 49-51: `if (telegram.user) { setIdentity(...) }`.

- `src/components/layout/app-container.tsx` line 25: "so a future Profile-screen toggle just calls `setTheme()` with no change to this component" — D-013 already shipped the Settings screen at `/settings` with the dark/light `ThemeOption` toggle calling `setTheme()`. Not future, and on the Settings screen, not the Profile screen.

**Fix**:

- `src/store/auth-store.ts`: Updated comment to name AppContainer as the caller of `setIdentity` on mount.
- `src/components/layout/app-container.tsx`: Replaced "a future Profile-screen toggle" with "the dark/light toggle on the Settings screen".

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 31 — 2026-07-03

### Audit findings

Full audit of all previously unread files: `src/app/project/[slug]/page.tsx`, all source files (home, fund, markets, search), all hooks (use-project, use-fund, use-home), all store files, dashboard layer (fund.ts), and API handlers (home.ts, rankings.ts, fund.ts, search.ts). No compile errors or runtime bugs found. Three stale comments identified that gave actively wrong post-implementation state — same failure mode as D-031/D-033/D-034 that misdirected earlier sessions.

### D-037: Correct three stale comments that contradict implemented features

**Problem**: Three files retained pre-implementation comments that became false after D-013, D-014, D-029, and D-031 shipped:

- `src/store/favorites-store.ts`: "No screen reads this yet — there is no Favorites UI today" — D-014 built `/favorites`, the Bookmark toggle on both detail pages, and the Profile row.
- `src/store/settings-store.ts`: "no screen has a toggle yet" — D-013 built `/settings` with the dark/light theme toggle.
- `src/lib/api/hooks/use-home.ts`: "(Phase 1 of the mock → real migration)" and "why Weekly Picks/Unlock Alerts are still mock" — D-029 and D-031 wired both to real `GET /api/home` data.

**Fix**:

- `src/store/favorites-store.ts`: Updated comment to reflect that the Bookmark toggle writes to this store and `/favorites` reads it.
- `src/store/settings-store.ts`: Updated comment to reflect that `/settings` writes the theme preference here and `AppContainer` applies it.
- `src/lib/api/hooks/use-home.ts`: Updated JSDoc to say Phase 3, list Weekly Picks/Unlock Alerts/Recent Fundraises/topFunds as real, and name what remains mock.

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 29 — 2026-07-02

### Audit findings

All known debt is fixed or blocked. Fresh audit of source files. `project.ts` (source) line 27: `type Grade = "A+" | "A" | "B" | "C" | "D"` — locally defined literal union, same D-035 pattern (no import link to the scoring engine's canonical `Grade`). `Grade` is exported from `src/dashboard/types.ts` (which re-exports from `src/scoring/types.ts`) but was absent from `src/lib/api/dto.ts`. The cast `as Grade | null` at line 149 existed to bridge two structurally-equal but nominally-separate `Grade` types. Searched all source files: only one hit (`project.ts`). `home.ts` API handler, `api/home.ts`, `project.ts`, and `fund.ts` sources all otherwise clean.

### D-036: Add `Grade` to `dto.ts` — remove local redefinition and `as` cast in project source

**Problem**: `src/lib/api/sources/project.ts` defined `type Grade = "A+" | "A" | "B" | "C" | "D"` locally (line 27). Structurally identical to `src/scoring/types.ts`'s `Grade`, but no import relationship — same silent divergence risk as D-035. `as Grade | null` cast at line 149 was a symptom of the mismatch: necessary only because the two `Grade` types were nominally distinct. `Grade` was the one scoring type exported from `@/dashboard/types` that `dto.ts` did not re-export.

**Fix**:

`src/lib/api/dto.ts`:

- Added `Grade` as the first entry in the re-export list (logically first — a primitive type all DTOs below depend on)

`src/lib/api/sources/project.ts`:

- Removed `type Grade = "A+" | "A" | "B" | "C" | "D"` (line 27)
- Added `Grade` to the `import type { ..., Grade, ... } from "../dto"` import
- Removed `as Grade | null` from `grade: overview.score?.grade ?? null` — cast was masking the nominal type disconnect, now unnecessary

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 28 — 2026-07-02

### Audit findings

All known debt is fixed or blocked. Fresh audit of all five source files and all five test files. `fund.ts` (source) locally redefines `FundInsightsDto` (lines 19–26) instead of importing from `"../dto"` — `FundInsightsDto` is exported from `src/dashboard/types.ts` but omitted from `src/lib/api/dto.ts` re-exports. The shapes currently match, but any future change to `FundInsightsDto` in `dashboard/types.ts` would not be a compile error in the source because there is no import relationship. `FundOverviewDto` and `FundPortfolioDto` are already imported from `"../dto"` in the same file — the local definition is the one inconsistency. No other source files have locally-redefined DTOs (`grep ^interface.*Dto` in `src/lib/api/sources` returned only this one hit).

### D-035: Wire `FundInsightsDto` through `dto.ts` — remove local redefinition in fund source

**Problem**: `src/lib/api/sources/fund.ts` defined `interface FundInsightsDto { ... }` locally (lines 19–26). It matched `src/dashboard/types.ts`'s exported `FundInsightsDto` structurally, but had no import link to it. A change to the dashboard type would not produce a compile error in the source — silent mismatch risk. `FundInsightsDto` was the only dashboard DTO missing from `src/lib/api/dto.ts`'s re-export list.

**Fix**:

`src/lib/api/dto.ts`:

- Added `FundInsightsDto` to the re-export list (between `FundOverviewDto` and `FundPortfolioDto`)

`src/lib/api/sources/fund.ts`:

- Removed local `interface FundInsightsDto { ... }` (7 lines)
- Added `FundInsightsDto` to the existing `import type { FundOverviewDto, FundPortfolioDto } from "../dto"` import

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 27 — 2026-07-02

### Audit findings

All known debt is done or blocked. Fresh audit: `favorites/page.tsx` and `watchlist/page.tsx` — both use `entity.slug ?? toSlug(entity.name)`, correct. `search/page.tsx` line 128: fund navigation used `toSlug(fund.name)` and `key={fund.name}`, both stale from when funds came from mock data. Search source stale comment: "Funds results stay mock: FundRowCardProps requires recentInvestmentCount" — `recentInvestmentCount` was made optional in D-033, unblocking real fund search wiring. The real `/api/search?type=funds` endpoint was already implemented (`searchFunds` in `src/dashboard/search.ts`). `FundSearchResultDto` carries `slug`, `name`, `logoUrl`, `portfolioProjectCount: number | null` — everything `FundRowCardProps` needs.

### D-034: Wire Search Funds results to real FundSearchResultDto data

**Problem**: Search Funds tab showed `mockMarketsFunds` filtered client-side by name substring. Comment claimed `FundRowCardProps.recentInvestmentCount` was the blocker — stale since D-033 made that field optional. Fund navigation in search page used `toSlug(fund.name)` and `key={fund.name}` (no real slug).

**Fix**:

`src/lib/api/sources/search.ts`:

- Promoted to Phase 4 (both Projects and Funds wired to real data)
- Removed `mockMarketsFunds` import
- Added `FundSearchResultDto` to dto import
- Added `type FundRow` alias; added `SearchFundsResponseData` interface
- Added `mapSearchResultToFundRow` — drops funds with `null portfolioProjectCount` (honest-drop, same convention as project mapper)
- Added `fetchRealFundResults` calling `GET /api/search?type=funds`
- `fetchSearchData` now fetches projects and funds concurrently via `Promise.all`

`src/app/(tabs)/search/page.tsx`:

- Fund row `key` changed from `fund.name` to `fund.slug ?? fund.name`
- Fund `onPress` changed from `toSlug(fund.name)` to `fund.slug ?? toSlug(fund.name)`

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 19/19 pass.

---

## Session 26 — 2026-07-02

### Audit findings

All previously logged debt is done or blocked. Fresh audit of project detail page (line 267 `relatedProjects` uses `toSlug(name)` — intentional, `relatedProjects` is always `[]` per source comment), search page (fund results use `toSlug(name)` — intentional, search fund results are `mockMarketsFunds` filtered client-side, no slug available), and markets source. Key finding: markets source comment "Funds tab stays mock: FundRowCardProps requires recentInvestmentCount" was false — `TopFundDto` from `top_funds` materialized view is already fetched as part of `/api/home` and has `slug`, `name`, `logoUrl`, `portfolioProjectCount`. The only blocker was `recentInvestmentCount` being required in `FundRowCardProps` — same D-029/D-031 pattern.

### D-033: Wire Markets Funds tab to real TopFundDto data

**Problem**: Markets Funds tab showed 3 hardcoded mock entries ("a16z Crypto", "Paradigm", "Polychain Capital" with invented counts). `FundRowCardProps.recentInvestmentCount` was required, but `TopFundDto` carries no such field — no "recent" time window exists anywhere in the DB schema. No `/api/rankings/funds` endpoint existed.

**Fix**:

`src/components/features/markets/fund-row-card.tsx`:
- Added `slug?: string` to `FundRowCardProps`
- Made `recentInvestmentCount?: number` optional
- Render: `recentInvestmentCount !== undefined ? \`${recentInvestmentCount} recent\` : "—"` when absent

`src/api/rankings.ts`:
- Added `handleGetFundRankings(request, supabase)` — calls `getTopFunds(supabase, parseLimitParam(..., 50, 100))`; returns `successResponse(funds)` (flat array, no pagination — `top_funds` is already bounded by the materialized view)
- Added `parseLimitParam` to pagination import

`src/api/index.ts`:
- Exported `handleGetFundRankings`; updated route table comment

`src/app/api/rankings/funds/route.ts` (new):
- Thin HTTP transport mirroring `rankings/weekly/route.ts`

`src/lib/api/sources/markets.ts`:
- Added `FundRow` type alias; added `mapTopFundToFundRow` (maps slug/name/logoUrl/portfolioProjectCount; `recentInvestmentCount` intentionally absent)
- Added `fetchRealFundRows` calling `GET /api/rankings/funds?limit=50`
- `fetchMarketsData` now fetches projects and funds in parallel via `Promise.all`
- Removed `mockMarketsFunds` import; updated header comment to Phase 4

`src/app/(tabs)/markets/page.tsx`:
- Fund row `key` and `onPress` updated to `fund.slug ?? toSlug(fund.name)`

`src/api/__tests__/rankings.test.ts`:
- Added happy-path test (verifies slug threaded through, portfolioProjectCount correct)
- Added 500 error-path test

**Verification**: `npm run build` — clean; `/api/rankings/funds` appears in route table. `npm test` — 19/19 pass (up from 17).

---

## Session 25 — 2026-07-02

### Audit findings

All P0–P2 items closed. Remaining open items are either blocked (D-007 server-side watchlist sync requires auth; D-016/D-017 require DB schema changes) or large (D-015 real-time prices, 3 days). Fresh audit found D-032: `mockRecentFundraises` was still imported in `src/lib/api/sources/home.ts` despite being replaced by real data in D-022 — TypeScript's `strict: true` does not include `noUnusedLocals`, so the dead import was never caught at compile time. Cross-file search found two more dead imports in unrelated files: `cn` in `accordion.tsx` (never called — `className` prop passed directly) and `loadResolutionContext`/`resolveProjectIdWithContext` in `identity-service.ts` (re-exported on line 64 via direct `export { } from` syntax, making the line 8 import bindings redundant).

### D-032: Remove dead imports; enforce noUnusedLocals

**Problem**: Three files carried dead imports that TypeScript did not flag because `noUnusedLocals` was absent from tsconfig. One (`mockRecentFundraises`) was a D-022 regression — the import survived after real data replaced it. Two others (`cn`, `loadResolutionContext`/`resolveProjectIdWithContext`) pre-dated this session's sessions and were never used.

**Fix**:

`tsconfig.json`:
- Added `"noUnusedLocals": true` — build now enforces no dead import bindings at compile time; prevents recurrence of this class of bug

`src/lib/api/sources/home.ts`:
- Removed `mockRecentFundraises` from import (D-022 leftover; `recentFundraises` has used `real.newFunding.map(...)` since D-022)

`src/components/ui/accordion.tsx`:
- Removed `cn` import — component passes `className` prop directly to `<div className={className}>`, never calls `cn()`

`src/identity/identity-service.ts`:
- Removed `loadResolutionContext` and `resolveProjectIdWithContext` from line 8 import — both are re-exported on line 64 via `export { ... } from "./resolver"` which pulls directly from the source module without going through the line 8 bindings

**Verification**: `npx tsc --noEmit` — zero errors. `npm run build` — clean. `npm test` — 17/17 pass.

---

## Session 24 — 2026-07-02

### Audit findings

Audited `UnlockAlertCardProps` in `src/components/features/home/unlock-alert-card.tsx` — `riskLevel?: RiskLevel` was already optional and rendered conditionally (`{riskLevel ? <Pill> : null}`). The home source comment claiming the card "requires riskLevel" was stale. `UnlockAlertDto` in `src/dashboard/types.ts` carries `slug`, `name`, `logoUrl`, `unlockDate` (ISO date), `percentOfSupply` — all the fields needed for the card. Wiring unlock alerts to real data is unblocked: same pattern as D-030 for weekly picks.

### D-031: Wire Home Unlock Alerts to real DB data

**Problem**: Home screen Unlock Alerts section showed `mockUnlockAlerts` — fake entries with fabricated `riskLevel: "high"/"low"/"moderate"`. The home source comment incorrectly claimed `UnlockAlertCardProps` requires `riskLevel`; the field was already optional.

**Fix**:

`src/components/features/home/unlock-alert-card.tsx`:
- Added `slug?: string` to `UnlockAlertCardProps`

`src/lib/api/sources/home.ts`:
- Added `formatUnlockDate(isoDate: string): string` — formats ISO date to "Jul 2" via `Intl.DateTimeFormat` with `timeZone: "UTC"`
- Added `mapUnlockAlertToCardProps(item: UnlockAlertDto): UnlockAlertCardProps` — maps `slug`, `name`, `logoUrl`, `dateLabel` (formatted), `percentOfSupply`; `riskLevel` intentionally absent
- Replaced `unlockAlerts: mockUnlockAlerts` with `real.unlockAlerts.map(mapUnlockAlertToCardProps)`
- Removed `mockUnlockAlerts` from imports
- Updated header comment to reflect Phase 3 status

`src/app/(tabs)/page.tsx`:
- Unlock alert skeleton no longer spreads `riskLevel: "low" as const` (not needed; `isLoading` branch ignores all props)
- `onPress` updated from `toSlug(name)` to `a.slug ?? toSlug(a.name)`

**Verification**: `npm run build` — clean. `npm test` — 17/17 pass.

---

## Session 23 — 2026-07-02

### Audit findings

Reviewed all navigation callsites on the home page after D-029. Found D-030 regression: `src/app/(tabs)/page.tsx` line 128 Weekly Picks `onPress` used `toSlug(loading ? "" : pick.name)` — real DB slugs are now available via `WeeklyPickDto.slug` but were not threaded through `WeeklyPickCardProps` or `mapWeeklyPickToCardProps`, so navigation could diverge from the real slug. Remaining `toSlug(name)` callsites (trending projects/funds, top gainers, recently added, unlock alerts) are on mock data with no backing `slug` field — all correct.

### D-030: Fix Weekly Picks slug regression

**Problem**: D-029 wired real `WeeklyPickDto` data which has `slug`, but `WeeklyPickCardProps` had no `slug` field, `mapWeeklyPickToCardProps` didn't include it, and `onPress` in the home page used `toSlug(name)` which can diverge from the DB slug.

**Fix**:

`src/components/features/home/weekly-pick-card.tsx`:
- Added `slug?: string` to `WeeklyPickCardProps`

`src/lib/api/sources/home.ts`:
- Added `slug: pick.slug` to `mapWeeklyPickToCardProps` return

`src/app/(tabs)/page.tsx`:
- Line 128: `onPress` changed from `toSlug(name)` to `p.slug ?? toSlug(p.name)`, consistent with the `slug ?? toSlug(name)` pattern used at all real-data callsites (D-006, D-021, D-022)

**Verification**: `npm run build` — clean. `npm test` — 17/17 pass.

---

## Session 22 — 2026-07-02

### Audit findings

Fresh read of markets page, search page, settings page, favorites page: all clean. Key finding from auditing the DTO layer: the home source (`src/lib/api/sources/home.ts`) had a stale comment claiming `WeeklyPickDto` lacked `grade` and `tvlChangePercent` — both fields are present in `src/dashboard/types.ts` (verified via direct read). The actual blocker was that `WeeklyPickCardProps` required `fundingQuality`/`tvlChangePercent`/`unlockRiskLevel`/`unlockRiskLabel` as non-optional, forcing the home source to use `mockWeeklyPicks` instead of real ranked data.

### D-029: Wire Home Weekly Picks to real DB data

**Problem**: Home screen Weekly Picks section showed `mockWeeklyPicks` — hardcoded fake entries for "Celestia" and "EigenLayer" with invented scores. The stale home source comment said `WeeklyPickDto` lacked `tvlChangePercent` and `grade`, but both exist in the DTO. The real blocker was that `WeeklyPickCardProps` made `fundingQuality`, `unlockRiskLevel`, and `unlockRiskLabel` required fields, and those have no DB source (on the "Do Not Do" list).

**Fix**:

`src/components/features/home/weekly-pick-card.tsx`:
- Made `fundingQuality?: FundingQuality`, `tvlChangePercent?: number | null`, `unlockRiskLevel?: RiskLevel`, `unlockRiskLabel?: string` all optional
- Funding row: renders `fundingQualityLabel[fundingQuality]` when present, `"—"` with `variant="neutral"` when absent
- TVL row: renders `<Percentage>` when non-null, `"—"` when null/absent
- Unlock row: renders `<TriangleAlert>` + label when present, `"—"` with `variant="neutral"` when absent

`src/lib/api/sources/home.ts`:
- Added `mapWeeklyPickToCardProps(pick: WeeklyPickDto): WeeklyPickCardProps | null` — drops picks with null `totalScore`/`grade`; maps `rank`, `name`, `logoUrl`, `score`, `grade`, `tvlChangePercent`; leaves synthetic signals absent (card renders "—")
- Replaced `weeklyPicks: mockWeeklyPicks` with `real.weeklyPicks.map(mapWeeklyPickToCardProps).filter(...)` 
- Removed `mockWeeklyPicks` from imports
- Rewrote stale header comment to reflect Phase 2 status; corrected the false claim about missing DTO fields

**Verification**: `npm run build` — clean. `npm test` — 17/17 pass.

---

## Session 21 — 2026-07-02

### Audit findings

All P0-P2 remain closed. D-018 (pagination): API layer already supports `?page=&pageSize=` via `parsePaginationParams`/`paginateArray`; markets source already fetches `pageSize=50` which covers current data volume. UI "load more" is low priority. D-014 (Favorites) selected as the highest-priority unblocked P3 item.

### D-014: Favorites page and toggle

**Problem**: `favorites-store.ts` was fully wired but had no UI entry point — no way to add items and no page to view them.

**Implementation**:
- `src/app/favorites/page.tsx` — new page mirroring `watchlist/page.tsx`: projects/funds sections with `Trash2` remove buttons, `Bookmark` empty-state icon, "Browse Markets" CTA; uses `useFavoriteEntities` + `useFavoritesActions().remove`; slug-first navigation with `toSlug(name)` fallback
- `src/app/fund/[slug]/page.tsx` — added `Bookmark` icon button to the header (left of existing `Star` watchlist button); imports `useIsFavorited` + `useFavoritesActions`; filled/accent when favorited
- `src/app/project/[slug]/page.tsx` — same: `Bookmark` button added to the header button group; `useIsFavorited` + `useFavoritesActions`
- `src/app/(tabs)/profile/page.tsx` — added "Favorites" `ProfileRow` (with `Bookmark` icon) between Telegram Account and Settings rows; navigates to `/favorites`; removed stale "Empty shell only" comment

**Verification**: `npm run build` — clean; `/favorites` route in build output. `npm test` — 17/17 pass.

---

## Session 20 — 2026-07-02

### Audit findings

Home page audit: 5 nav callsites use `toSlug(name)` without a real DB slug (trendingProjects, trendingFunds, topGainers, recentlyAdded, weeklyPicks). **Confirmed non-bugs** — all 5 sections are on mock data with no backing DTO (`TrendingItem`, `TopGainerCardProps`, etc. have no `slug` field), so `slug ?? toSlug(name)` would be identical to `toSlug(name)` today. The fix only applies once these sections are wired to real data.

D-028 investigation: `AppContainer` uses `MotionConfig` from framer-motion, placing the library in the shared root layout chunk loaded by every route. Route-level `next/dynamic` cannot move framer-motion out of the initial bundle. **Closed D-028 as not feasible** without restructuring `AppContainer` (which would break the app-wide `reducedMotion="user"` a11y guarantee).

Note: `src/lib/api/sources/home.ts` comment is stale — it states `WeeklyPickDto` lacks `tvlChangePercent`, but `src/dashboard/home.ts` now maps `tvl_change_7d` → `tvlChangePercent`. Still can't wire Weekly Picks to real data because `WeeklyPickCardProps` requires `fundingQuality` and `unlockRiskLevel`/`unlockRiskLabel` — both are synthetic signals with no DB backing and are on the "Do Not Do" list.

### D-013: Profile Settings and About destinations

**Problem**: Profile page "Settings" and "About" rows called `onClick={() => {}}` (no-ops). Both rows show a ChevronRight implying navigation that does nothing.

**Implementation**:
- `src/app/settings/page.tsx` — new page with dark/light theme toggle, reads/writes `useThemePreference` / `useSetTheme` from the existing `settings-store.ts`
- `src/app/about/page.tsx` — new static page: app name, description, version
- `src/app/(tabs)/profile/page.tsx` — added `useRouter`, wired Settings row to `router.push("/settings")` and About row to `router.push("/about")`

Both pages follow the existing detail-page shell pattern: `PageLayout` + `SafeArea` + `ArrowLeft` back button via `router.back()`.

**Verification**: `npm run build` — clean; `/about` and `/settings` routes appear in build output. `npm test` — 17/17 pass.

---

## Session 19 — 2026-07-02

### D-011: Bundle analysis

**Approach**: Used `npx next experimental-analyze --output` — the Turbopack-native analyzer available in Next.js 16.1+ (docs: nextjs.org/docs/app/guides/package-bundling). `@next/bundle-analyzer` is webpack-only and incompatible with this project's Turbopack builds. Output written to `.next/diagnostics/analyze/`.

**Findings** (minified, pre-gzip sizes):

| Finding | Detail | Action |
|---|---|---|
| Total static assets | 1.23 MB across 23 JS chunks + 29 KB CSS | Acceptable |
| Largest chunks | 221 KB, 134.6 KB × 2, 134.2 KB, 110 KB | See below |
| `framer-motion` | Dominant cost (~490 KB across top 3 chunks); used in 24 files as the app's entire animation layer | Expected; logged D-028 for optional future lazy-load |
| `lucide-react` | Present in 2 chunks alongside framer; already auto-optimized by Next.js (confirmed via docs) | No action needed |
| `@supabase/supabase-js` | **Absent from all client chunks** — stays correctly server-only | Clean |
| `zustand` | 36.4 KB chunk | Expected |
| Unexpected large imports | None found | — |

**`optimizePackageImports` check**: `lucide-react` confirmed on Next.js built-in auto-optimized list (nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports). No `next.config.ts` changes needed.

**New debt logged**: D-028 (P3) — optional lazy-loading of `framer-motion` for low-animation pages (Profile, Watchlist). Non-blocking; app performance is acceptable as-is.

**Verification**: `npm run build` — clean; `npm test` — 17/17 pass. No code changes made this session.

---

## Session 18 — 2026-07-02

### D-008: Telegram initData HMAC-SHA256 verification

**Problem**: All `/api/*` routes were reachable by any HTTP client. A rate limiter was in place, but there was no guarantee requests came from a real Telegram Mini App session. Any scraper that bypassed the rate limit could consume the API without restriction.

**Approach**: Verified the official algorithm at `https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app` before writing any code.

**Fix — four files**:

1. **`src/proxy.ts`** — Made `proxy` async; added `verifyTelegramInitData(initData, botToken)` using `crypto.subtle` (Web Crypto, available globally in Node.js 18+). Flow: compute `secret_key = HMAC-SHA256(key="WebAppData", msg=botToken)`, then `expected = hex(HMAC-SHA256(key=secret_key, msg=data_check_string))`. Rejects if `hash` absent, `auth_date` missing or older than 24 h, or HMAC mismatch. Guard: only runs in `NODE_ENV === "production"` when `TELEGRAM_BOT_TOKEN` is set — skipped silently in development.

2. **`src/lib/api/client.ts`** — `apiFetch` now reads `window.Telegram?.WebApp?.initData` and attaches it as `x-telegram-init-data` request header when non-empty. Gracefully absent in development (no Telegram context).

3. **`src/lib/telegram/types.ts`** — Added `readonly initData: string` to `TelegramWebApp` interface so the client-side read is type-safe.

4. **`src/config/env.ts`** — Added optional `TELEGRAM_BOT_TOKEN: string | undefined` to `AppEnv`; plain getter (no throw on missing, since absence is valid for dev).

5. **`.env.example`** — Documented `TELEGRAM_BOT_TOKEN` under new Telegram section.

**Why production-only**: Tests call handlers directly and bypass `proxy.ts` entirely — no test changes needed. Development in a browser has no `initData` (empty string), so enforcing there would break local dev permanently.

**Verification**: `npm run build` — clean; `npm test` — 17/17 pass.

---

## Session 17 — 2026-07-02

### D-027: Rename `middleware.ts` → `proxy.ts`

**Problem**: `src/middleware.ts` used the deprecated Next.js 16 file convention. Every `npm run build` printed `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` Rate limiting was functional but the warning would pollute CI logs and was a ticking regression risk if the deprecated convention was dropped in a future patch.

**Verification**: Fetched `https://nextjs.org/docs/messages/middleware-to-proxy` and `https://nextjs.org/docs/app/api-reference/file-conventions/proxy` before touching the file. Docs confirmed: rename file to `proxy.ts`, rename exported function from `middleware` to `proxy`. `NextRequest`/`NextResponse` types, `config.matcher` syntax, and all other behaviour are identical. Also noted: Next.js 16 `proxy` defaults to Node.js runtime (better for in-memory Map rate limiting than the old Edge Runtime default).

**Fix**:
- Created `src/proxy.ts` — identical to `src/middleware.ts` except `export function proxy(...)` replaces `export function middleware(...)`
- Deleted `src/middleware.ts`

**Verification**: `npm run build` — clean, no warnings; `ƒ Proxy (Middleware)` still present in route table confirming rate limiter active. `npm test` — 17/17 pass.

---

## Session 16 — 2026-07-02

### D-009: Rate limiting on API routes

**Problem**: All six `/api/*` routes were publicly accessible with no per-IP throttle, leaving Supabase connection pool and ILIKE search endpoints open to trivial abuse.

**Fix**: Created `src/middleware.ts` with an in-memory sliding-window rate limiter.
- 60 requests per IP per 60-second window (1 req/s average)
- Returns `429` JSON `{ success: false, error: { code: "RATE_LIMITED", message: "..." } }` with `Retry-After` header
- IP extracted from `x-forwarded-for` → `x-real-ip` → `"unknown"` fallback
- Expired entries pruned lazily when Map exceeds 10k IPs (prevents unbounded memory growth)
- Matcher: `["/api/:path*"]` — covers all six API routes, nothing else
- Module-level `Map` shared across requests in single-process Node.js deployments (VPS, Docker, PM2); comment documents that multi-process or serverless deployments would need Upstash Redis

**Side-effect discovered**: Next.js 16.2.9 deprecated `middleware.ts` in favour of `proxy.ts`. Rate limiting is live and functional (confirmed by build output `ƒ Proxy (Middleware)`) but emits a deprecation warning at build time. Logged as D-027 for a future 30-min rename.

**Verification**: `npm run build` — compiled cleanly (exit 0, 11/11 static pages); `npm test` — 17/17 pass (tests invoke handlers directly, bypass middleware by design).

---

## Session 15 — 2026-07-02

### D-026: Search page fired one Supabase ILIKE query per keystroke

**Problem**: `SearchPage` passed the raw Zustand query string directly to `useSearch`, which called `fetchSearchData` (a live `/api/search` request) on every keystroke. Typing an 8-character query fired up to 8 concurrent Supabase ILIKE scans with no deduplication across requests. No debouncing existed anywhere in the stack (not in the store, hook, or data source).

**Fix**: Added 300ms debounce using `useState`/`useEffect` in `SearchPage`. Raw query (`rawQuery`) still drives the `SearchBar` for immediate text feedback. Debounced query (`debouncedQuery`) drives `useSearch` — only fires the API call after the user pauses typing for 300ms. Empty/cleared input resets `debouncedQuery` instantly (no 300ms wait). `isDebouncing` flag keeps the skeleton visible while the timer is running. Render order changed: `!hasQuery` is checked first so clearing the search immediately shows recent/trending without waiting for any in-flight request to settle.

**Files changed**:

- `src/app/(tabs)/search/page.tsx` — added `useState`/`useEffect` imports, `debouncedQuery` state with 300ms timeout, `isDebouncing` flag, reordered conditional render

**Result**: 17/17 tests pass, build clean.

---

## Session 14 — 2026-07-02

### D-025: Project detail page had no website / Twitter external-link buttons

**Problem**: `ProjectOverviewDto` carries `website: string | null` and `twitter: string | null` (fetched by the dashboard query), but `fetchProjectData` never mapped either field into `ProjectData`. The project detail page had no way for users to visit a project's website or X profile — a direct parallel to D-003 (fund external links, fixed Session 1) that was missed during the original implementation.

**Fix**: Added `website` and `twitter` to `ProjectData.project`; mapped from `overview.website`/`overview.twitter` in `fetchProjectData`; added `website: null, twitter: null` to `EMPTY_PROJECT_DATA` in `use-project.ts`; added `openExternalUrl` helper and website/twitter buttons to the hero section in `project/[slug]/page.tsx`, exactly mirroring the fund detail pattern.

**Files changed**:

- `src/lib/api/sources/project.ts` — added `website`/`twitter` to `ProjectData` interface and mapped from DTO
- `src/lib/api/hooks/use-project.ts` — added `website: null, twitter: null` to `EMPTY_PROJECT_DATA`
- `src/app/project/[slug]/page.tsx` — added `AtSign`/`ExternalLink` imports, `openExternalUrl`, and hero buttons

**Result**: 17/17 tests pass, build clean.

---

## Session 13 — 2026-07-02

### D-024: Missing 500 error-path tests for four API handlers

**Problem**: `rankings.test.ts` had a 500 test for monthly but not weekly. `fund.test.ts`, `project.test.ts`, and `search.test.ts` had no 500 tests at all. The happy-path and 404 tests passed but DB failure paths were untested.

**Fix**: Added one 500 test per gap (4 new tests total). Each test injects a DB error via the existing mock-supabase infrastructure (`{ data: null, error: { message: "connection refused" } }` on the first-queried table), then asserts `status === 500` and `body.error.code === "INTERNAL_ERROR"`.

**Files changed**:

- `src/api/__tests__/rankings.test.ts` — added weekly 500 test
- `src/api/__tests__/fund.test.ts` — added 500 test
- `src/api/__tests__/project.test.ts` — added 500 test
- `src/api/__tests__/search.test.ts` — added 500 test

**Also closed in docs**: D-010 (request validation already done in code); removed stale "Upgrade CoinIcon to next/image" from P3 Future (done as D-012 in Session 11).

**Result**: 17/17 tests pass, build clean.

---

## Session 12 — 2026-07-02

### D-023: Profile page hardcoded "Guest" — Telegram identity never wired

**Task**: Replace the hardcoded "Guest" avatar and name on the Profile page with the real Telegram user's identity from `initDataUnsafe.user`.

**Root cause**: `auth-store.ts` was designed to hold `TelegramIdentity` (`id`, `firstName`, `username`) with a `setIdentity` action, and its own comment noted "the real Telegram WebApp initDataUnsafe.user payload isn't wired into the app yet." `AppContainer` already bridged other WebApp data (viewport/safe-areas) to the Zustand store but never read `initDataUnsafe`. The profile page never imported from the auth store.

**Why chosen**: Only remaining surface in the app showing placeholder data when real user data is available. Auth store, Telegram type layer, and `AppContainer` bridge pattern were all already in place — this was explicitly deferred wiring.

**Changes made:**

- `src/lib/telegram/types.ts`:
  - Added `TelegramUser` interface (`id`, `first_name`, `last_name?`, `username?`, `is_premium?`)
  - Added `TelegramInitDataUnsafe` interface (`user?: TelegramUser`)
  - Added `readonly initDataUnsafe: TelegramInitDataUnsafe` to `TelegramWebApp`

- `src/lib/telegram/use-telegram-webapp.ts`:
  - Added `user: TelegramUser | null` field to `TelegramWebAppState`
  - Added `user: null` to `FALLBACK_STATE`
  - `readState()` now maps `webApp.initDataUnsafe?.user ?? null` into state

- `src/components/layout/app-container.tsx`:
  - Added `useAuthActions` import and `setIdentity` destructure
  - Extended existing `useEffect` to call `setIdentity({ id, firstName, username })` when `telegram.user` is present
  - Added `setIdentity` to the effect's dependency array

- `src/app/(tabs)/profile/page.tsx`:
  - Added `useAuthIdentity` import
  - Avatar `fallback` and `alt` now derived from `identity?.firstName ?? "Guest"`
  - Display name now shows `identity?.firstName ?? "Guest"`
  - Added `@username` line rendered when `identity.username` is present

**Behavior**: Inside Telegram → shows real first name and `@username`. Outside Telegram (browser dev, SSR) → `telegram.user` is null → identity never set → "Guest" fallback (same as before).

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 11 — 2026-07-02

### D-012: CoinIcon/Avatar used `<img>` instead of `next/image`

**Task**: Switch `Avatar` (the primitive behind `CoinIcon`) from a plain `<img>` to `next/image` for automatic WebP conversion, responsive srcsets, and proper lazy loading.

**Root cause**: The original implementation noted "switch to next/image once real logo sources are known." The logo domains were unknown at that time but are now determinable from the ingestion pipeline.

**Audit methodology**: Traced `logoUrl` fields through `src/ingestion/chainbroker/mapper.ts` → `src/ingestion/chainbroker/types.ts` → `src/providers/chainbroker/SOURCE.md`, which documents that all project/fund logos come from `https://static.chainbroker.io/`. Confirmed `src/ingestion/metrics/mapper.ts` does not map any logo URLs (CoinGecko ingestion is financial-metrics-only). Result: one logo domain in production — `static.chainbroker.io`. `coin-images.coingecko.com` added speculatively (whitelisting a domain before first use is harmless; blocking it after data is live is disruptive).

**Changes made:**

- `next.config.ts`:
  - Added `images.remotePatterns` with `{ protocol: "https", hostname: "static.chainbroker.io" }` and `{ protocol: "https", hostname: "coin-images.coingecko.com" }`
  - Removed the now-outdated "UI Foundation phase only" comment (image domain registration is the first infrastructure concern now addressed)

- `src/components/ui/avatar.tsx`:
  - Replaced `<img>` with `<Image>` from `next/image`
  - Added `sizePx` map (`sm → 28`, `md → 32`, `lg → 56`, `xl → 64`) matching the existing `sizeClass` values — passed as `width`/`height` so the optimizer generates an appropriately-sized srcset per avatar slot
  - Removed the `eslint-disable-next-line @next/next/no-img-element` comment (no longer needed)
  - `onError={() => setFailed(true)}` fallback pattern preserved — `next/image` forwards `onError` to the underlying `<img>`

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 10 — 2026-07-02

### D-022: Home Recent Fundraises navigation used toSlug(name) instead of real DB slug

**Task**: Fix the last remaining slug-derivation navigation bug — home page Recent Fundraises cards navigated to `/project/${toSlug(item.name)}` despite `NewFundingDto` carrying a real `slug: string` field.

**Root cause**: `mapNewFundingToCardProps` in `src/lib/api/sources/home.ts` only mapped `name`, `logoUrl`, `amountRaisedUsd`, `roundType`, `announcedDate`, and `investorNames` from `NewFundingDto` — discarding the `slug` field entirely. `RecentFundraiseCardProps` had no `slug` field to carry it. The home page then derived navigation URLs with `toSlug(name)`, which silently 404s for any project where the DB slug differs from the name-derived value.

**Why chosen**: Highest-priority concrete user-facing bug found during re-audit. Same slug-derivation family as D-006 (watchlist, session 8) and D-021 (fund portfolio, session 9) — the third and final surface where `NewFundingDto`/real API data flowed to navigation via `toSlug(name)`.

**Changes made:**

- `src/components/features/home/recent-fundraise-card.tsx`:
  - Added `slug?: string` to `RecentFundraiseCardProps` (optional for backward-compat with mock/skeleton entries that have no real slug)

- `src/lib/api/sources/home.ts`:
  - `mapNewFundingToCardProps` now maps `slug: item.slug` from `NewFundingDto` into the returned `RecentFundraiseCardProps`

- `src/app/(tabs)/page.tsx`:
  - Recent Fundraises `onPress` changed from `toSlug(item.name)` to `f.slug ?? toSlug(f.name)` with real DB slug as primary path and `toSlug(name)` as backward-compat fallback

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 9 — 2026-07-02

### D-021: Fund portfolio/recent-investments navigation uses toSlug(name) instead of real DB slug

**Task**: Fix the same slug-derivation bug as D-006, in the fund portfolio and recent-investments navigation paths.

**Root cause**: `mapPortfolioProject` in `src/lib/api/sources/fund.ts` only mapped `name`, `roundType`, and `announcedDate` from `FundPortfolioProjectDto` — discarding both `slug` and `logoUrl` that the DTO provides. The fund detail page then built navigation URLs via `toSlug(item.projectName)`, which silently 404s for projects where the DB slug differs (e.g. "1inch" → "1inch" but DB slug "1inch-network"). `projectLogoUrl` was also silently missing from every portfolio row, so CoinIcon was always showing the initials fallback.

**Why chosen**: Concrete user-facing navigation bug discovered during re-audit. Same category as D-006 (fixed session 8) but affecting a different navigation surface (fund portfolio and recent investments). Higher priority than infrastructure tasks (D-008, D-009) because it breaks existing functionality for every fund with a real portfolio.

**Changes made:**

- `src/lib/api/sources/fund.ts`:
  - Extended `type PortfolioItem` with `projectSlug?: string` (optional for backward-compat; the type is internal to this file so no migration concerns)
  - Updated `mapPortfolioProject` parameter type to include `slug` and `logoUrl`
  - Now maps `projectSlug: p.slug` and `projectLogoUrl: p.logoUrl` into the returned `PortfolioItem`

- `src/app/fund/[slug]/page.tsx`:
  - Portfolio section: destructures `{ projectSlug, ...item }` before spreading onto `InvestmentRow`; uses `projectSlug ?? toSlug(item.projectName)` for navigation
  - Recent Investments section: same pattern

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 8 — 2026-07-02

### D-006: Watchlist navigation 404s when DB slug ≠ toSlug(name)

**Task**: Fix watchlist navigation producing incorrect URLs for projects/funds whose database slug doesn't match what `toSlug(name)` generates.

**Root cause**: `CollectibleEntity` had no `slug` field. Detail pages stored `{ id: name, name, kind }` — no real slug. Navigation from the watchlist and home watchlist section derived the URL via `toSlug(entity.name)`, which works only when the DB slug coincidentally matches the name-based derivation (e.g. "Aave V3" → "aave-v3" ✓, but "1inch" → "1inch" while DB slug is "1inch-network" → 404).

**Why chosen**: Concrete user-facing bug — tapping a watchlist entry can silently 404. Higher priority than infrastructure tasks (rate limiting, initData verification) because it breaks existing user-facing navigation in a way users are likely to hit with real data.

**Changes made:**

- `src/store/lib/create-entity-collection-store.ts` — added `slug?: string` to `CollectibleEntity` (optional for backward-compat with entries already persisted in localStorage without a slug field)

- `src/lib/api/sources/project.ts` — added `slug: string` to `ProjectData.project`; mapped from `overview.slug` in `fetchProjectData`

- `src/lib/api/sources/fund.ts` — added `slug: string` to `FundData.fund`; mapped from `overview.slug` in `fetchFundData`

- `src/lib/api/hooks/use-project.ts` — added `slug: ""` to `EMPTY_PROJECT_DATA.project`

- `src/lib/api/hooks/use-fund.ts` — added `slug: ""` to `EMPTY_FUND_DATA.fund`

- `src/app/project/[slug]/page.tsx` — `toggle()` call now passes `slug: project.slug`

- `src/app/fund/[slug]/page.tsx` — `toggle()` call now passes `slug: fund.slug`

- `src/app/(tabs)/watchlist/page.tsx` — project/fund navigation now uses `entity.slug ?? toSlug(entity.name)` (backward-compat fallback for pre-existing persisted entries)

- `src/app/(tabs)/page.tsx` — home watchlist section navigation uses same `entity.slug ?? toSlug(entity.name)` fallback

**Backward compat**: Old persisted entries without a `slug` field get `entity.slug === undefined`, falling back to `toSlug(entity.name)` — same behavior as before. No migration needed.

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 7 — 2026-07-02

### D-005 + targeted D-010: API input hardening

**Task**: Fix the `options.signal!.reason` non-null assertion in the API client, and add a missing query-length guard to `GET /api/search`.

**Why chosen**: Full audit of all API route handlers confirmed that `GET /api/search` was the only endpoint with an unvalidated free-text input — `?q=` had no length limit, meaning a request with a kilobyte-scale query string would generate an equally large ILIKE pattern in Supabase. All other params (`?limit=`, `?page=`, `?pageSize=`) were already clamped. The `signal!` assertion was a co-located one-line fix.

**Changes made:**

- `src/api/search.ts`:
  - Added `const MAX_QUERY_LENGTH = 200`
  - Added `if (query.length > MAX_QUERY_LENGTH) throw badRequest(...)` after the empty-check
  - Updated the handler's doc comment to document the new constraint

- `src/lib/api/client.ts`:
  - Changed `options.signal!.reason` → `options.signal?.reason` in the abort event listener closure — the outer `if (options.signal)` guard already ensures the signal exists, but TypeScript can't narrow across closure boundaries; optional chaining is the clean fix

- `src/api/__tests__/search.test.ts`:
  - Added test: `GET /api/search returns 400 when q exceeds 200 characters`

**Verification:** `npx tsc --noEmit` → 0 errors; `npm test` → 13/13 pass; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 6 — 2026-07-01

### D-019: Remove `logAction()` from all production pages

**Task**: Eliminate `console.log` noise from home, markets, search, and profile pages by removing the `logAction()` helper and all its usages.

**Why chosen**: Last remaining P1 issue — production builds were emitting console noise on every user interaction (tab switches, card taps, button presses). No user-visible functionality was broken, but the logs leak internal action labels in production.

**Changes made:**

- `src/app/(tabs)/page.tsx`:
  - Removed `logAction` function
  - Added `const { setMarketsTab } = useUiActions()` + `useSetTrendingTab` / `useTrendingTab` to wire Trending "See all" to real navigation (`setMarketsTab(trendingTab); router.push("/markets")`)
  - Removed `action` prop from Weekly Picks, Top Gainers, Recently Added, Recent Fundraises, Unlock Alerts section headers (no destination screen — omitting the prop hides the button entirely)
  - Removed `onWhyPress` from `WeeklyPickCard` (optional prop, omitting hides the button)
  - Removed `onInfoPress` from `FearGreedCard` (optional prop, omitting hides the button)
  - Platform items in `trendingItemsByTab`: spread only, no `onPress` (no platform detail page)

- `src/app/(tabs)/markets/page.tsx`:
  - Removed `logAction` function
  - Platform `PlatformRowCard`: removed `onPress` entirely (`pressable={Boolean(onPress)}` → false → non-pressable)

- `src/app/(tabs)/search/page.tsx`:
  - Removed `logAction` function
  - Platform `PlatformRowCard`: removed `onPress` entirely

- `src/app/(tabs)/profile/page.tsx`:
  - Removed `logAction` function
  - Replaced three `onClick={logAction(...)}` calls with `onClick={() => {}}` (rows remain interactive for future wiring)

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 5 — 2026-07-01

### Home "Watchlist" section wired to real store

**Task**: Replace `mockWatchlistSummary` on the home page with real data from `useWatchlistEntities()`.

**Why chosen**: Data integrity bug — users who saved items to their watchlist saw hardcoded fake items (Ethereum, Aave, a16z Crypto) in the home screen's "Watchlist" section, not their actual saved entities. Outranked `logAction` console noise because users were seeing incorrect data, not just noise.

**Root cause discovered during audit**: `home.ts` data source included `watchlistSummary: mockWatchlistSummary` in its return. The watchlist is device-local Zustand state that must never come from an API or mock — it belongs exclusively in the store.

**Changes made:**

- `src/lib/api/sources/home.ts` — removed `watchlistSummary` from `HomeData` interface and from `fetchHomeData` return; removed `mockWatchlistSummary` import and `WatchlistSummaryCardProps` import
- `src/lib/api/hooks/use-home.ts` — removed `watchlistSummary: []` from `EMPTY_HOME_DATA`
- `src/app/(tabs)/page.tsx` — added `useWatchlistEntities` import; replaced `WATCHLIST_SKELETON_COUNT` + `watchlistRows` derived array with `watchlistEntries = Object.values(useWatchlistEntities()).slice(0, 3)`; rewrote Watchlist section JSX to render real store entities (no loading skeleton — store reads synchronously from localStorage)

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 4 — 2026-07-01

### Fund external links + console.log cleanup + Top Chains

**Task**: Wire fund website/Twitter buttons to real navigation; remove `logAction` console.log stub; hide Top Chains when empty.

**Why chosen**: Highest-priority user-facing bug — buttons displaying real data (website URL, Twitter handle) did nothing on tap. Users could see the data but couldn't act on it.

**Changes made:**

- `src/lib/telegram/types.ts` — added `openLink(url, options?)` to `TelegramWebApp` interface (documented in Telegram Bot API but not yet typed)
- `src/app/fund/[slug]/page.tsx`:
  - Removed `logAction()` helper
  - Added `openExternalUrl(url)` — calls `window.Telegram.WebApp.openLink(url)` with `window.open` fallback for non-Telegram environments
  - Website button: calls `openExternalUrl(fund.website)` with in-callback null guard
  - Twitter button: calls `openExternalUrl('https://x.com/${twitterHandle}')` with in-callback null guard
  - Replaced `Globe` icon with `ExternalLink` (semantically correct for external navigation)
  - Top Chains section: now hidden entirely when `topChains.length === 0` after load (was rendering an empty section header with no content)

**Verification:** `npx tsc --noEmit` → 0 errors; `npm run build` → clean (11 pages, 0 warnings)

---

## Session 3 — 2026-07-01

### Phase A: Backend-to-Frontend Integrity Audit

Full audit of `src/lib/api/sources/` for fabricated values. Rules: never invent values that have no backend source. Fabricated fields must be removed from types; pages must conditionally hide missing data; components must accept nullable types.

**Changes Made:**

- `src/lib/api/sources/project.ts` — full rewrite
  - Removed `chain` field (no backend source)
  - Removed `leadInvestor` from funding rounds (no `is_lead` in schema)
  - All metrics: `?? 0` → `?? null`
  - `score`, `grade`: `?? "D"` / `?? 0` → `?? null`
  - `riskLevel` removed from `nextUnlock` (no backend threshold)

- `src/lib/api/sources/fund.ts` — full rewrite
  - Removed `activityStatus` (no backend threshold)
  - Removed `activeInvestments` (no active/exited status)
  - Removed `leadInvestments` (no is_lead)
  - `website`, `twitterHandle`, `portfolioSize` all nullable

- `src/lib/api/sources/home.ts` — `amountRaisedUsd ?? 0` → `null` propagates

- `src/components/features/project-detail/funding-round-row.tsx` — `amountUsd: number | null`
- `src/components/features/home/unlock-alert-card.tsx` — `percentOfSupply: number | null`, `riskLevel` optional
- `src/components/features/home/recent-fundraise-card.tsx` — `amountUsd: number | null`

- `src/lib/api/hooks/use-project.ts` — `EMPTY_PROJECT_DATA` all nulls
- `src/lib/api/hooks/use-fund.ts` — `EMPTY_FUND_DATA` all nulls

- `src/app/project/[slug]/page.tsx` — full rewrite: all nullable fields conditionally rendered
- `src/app/fund/[slug]/page.tsx` — removed fabricated stat grid items, conditional website/twitter

**Verification:** `npx tsc --noEmit` → 0 errors

### Phase B: Final Production Audit

Text-only audit (no tools) of all formatters and components. Conclusion: "The frontend data layer is production-safe." No additional bugs found.

### Phase C: Engineering Documentation + Watchlist Fix

- Created `docs/engineering/` with 18 documents (README + 00–17)
- Full repository discovery agent run
- Identified Watchlist page as highest-priority production issue
- Fixed `src/app/(tabs)/watchlist/page.tsx` — now reads from `useWatchlistEntities()`; grouped by kind (projects/funds); each row navigates to detail and has a Trash2 remove button
- `npx tsc --noEmit` → 0 errors ✅
- `npm run build` → clean (11 pages, 0 warnings) ✅

---

## Session 2 — (prior context)

- Established data flow architecture
- Built React Query hooks for all pages
- Built Zustand stores for watchlist/favorites/search

---

## Session 1 — (prior context)

- Initial project scaffolding
- Next.js App Router setup
- Component library foundation
- Supabase integration
- Scoring engine design and implementation
