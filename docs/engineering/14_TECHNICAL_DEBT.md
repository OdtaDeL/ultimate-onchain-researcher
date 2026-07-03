# 14 — Technical Debt

## Debt Register

### P0 — Fix Immediately

| ID | Debt | File | Effort |
|---|---|---|---|
| D-001 | Watchlist page never reads from store | `app/(tabs)/watchlist/page.tsx` | **Fixed 2026-07-01** |

### P1 — Fix Before Launch

| ID | Debt | File | Effort |
|---|---|---|---|
| D-002 | ~~`console.log` via `logAction()` leaks actions to production console~~ | `app/fund/[slug]/page.tsx` | **Fixed 2026-07-01** |
| D-003 | ~~Fund website/twitter buttons are no-ops~~ | `app/fund/[slug]/page.tsx` | **Fixed 2026-07-01** |
| D-004 | ~~"Top Chains" section always empty~~ | `app/fund/[slug]/page.tsx` | **Fixed 2026-07-01** |
| D-019 | ~~`console.log` via `logAction()` in home, markets, search, profile pages~~ | Various | **Fixed 2026-07-01** |
| D-020 | Home "Watchlist" section served `mockWatchlistSummary` instead of real store data | `app/(tabs)/page.tsx` | **Fixed 2026-07-01** |

### P2 — Fix Before Scale

| ID | Debt | File | Effort |
|---|---|---|---|
| D-005 | ~~`options.signal!.reason` non-null assertion~~ | `src/lib/api/client.ts:40` | **Fixed 2026-07-02** |
| D-006 | ~~`id === name` coupling in entity stores causes watchlist navigation 404s~~ | `src/store/lib/create-entity-collection-store.ts` | **Fixed 2026-07-02** |
| D-021 | ~~Fund portfolio/recent-investments rows navigate via toSlug(name) instead of real DB slug~~ | `src/lib/api/sources/fund.ts`, `app/fund/[slug]/page.tsx` | **Fixed 2026-07-02** |
| D-022 | ~~Home Recent Fundraises navigated via toSlug(name) despite NewFundingDto carrying real slug~~ | `src/components/features/home/recent-fundraise-card.tsx`, `src/lib/api/sources/home.ts`, `app/(tabs)/page.tsx` | **Fixed 2026-07-02** |
| D-007 | No server-side watchlist sync | — | 2 days |
| D-008 | ~~No Telegram `initData` verification~~ | `src/proxy.ts`, `src/lib/api/client.ts`, `src/lib/telegram/types.ts`, `src/config/env.ts` | **Fixed 2026-07-02** |
| D-009 | ~~No rate limiting on API routes~~ | `src/middleware.ts` | **Fixed 2026-07-02** |
| D-010 | ~~No request validation on API query params~~ | `src/app/api/` | **Fixed (already done — closed 2026-07-02)** |
| D-011 | ~~No bundle analysis run~~ | — | **Fixed 2026-07-02** |
| D-012 | ~~`CoinIcon` uses `<img>` not `next/image`~~ | `src/components/ui/avatar.tsx`, `next.config.ts` | **Fixed 2026-07-02** |
| D-023 | ~~Profile page hardcoded "Guest" — `initDataUnsafe.user` never wired into auth store~~ | `src/lib/telegram/`, `src/components/layout/app-container.tsx`, `app/(tabs)/profile/page.tsx` | **Fixed 2026-07-02** |
| D-024 | ~~Missing 500 error-path tests for weekly rankings, fund, project, and search API handlers~~ | `src/api/__tests__/rankings.test.ts`, `fund.test.ts`, `project.test.ts`, `search.test.ts` | **Fixed 2026-07-02** |
| D-025 | ~~Project detail page had no website / Twitter buttons — `ProjectOverviewDto.website` and `.twitter` never mapped into `ProjectData`~~ | `src/lib/api/sources/project.ts`, `src/lib/api/hooks/use-project.ts`, `src/app/project/[slug]/page.tsx` | **Fixed 2026-07-02** |
| D-026 | ~~Search page fired one Supabase ILIKE query per keystroke — no debouncing anywhere in the stack~~ | `src/app/(tabs)/search/page.tsx` | **Fixed 2026-07-02** |
| D-027 | ~~`src/middleware.ts` used deprecated convention — Next.js 16 expects `src/proxy.ts` with `export function proxy()`~~ | `src/proxy.ts` | **Fixed 2026-07-02** |

### P3 — Nice to Have

| ID | Debt | File | Effort |
|---|---|---|---|
| D-028 | ~~`framer-motion` lazy-load — closed, not feasible: `AppContainer` uses `MotionConfig` (root layout), placing framer-motion in the shared chunk loaded by every route; route-level `next/dynamic` cannot remove it from the initial bundle without restructuring the root layout and losing the app-wide `reducedMotion="user"` a11y guarantee~~ | — | **Closed 2026-07-02 (not feasible)** |
| D-013 | ~~Profile / Settings / About routes have no destinations~~ | `src/app/settings/page.tsx`, `src/app/about/page.tsx`, `src/app/(tabs)/profile/page.tsx` | **Fixed 2026-07-02** |
| D-014 | ~~Favorites page not built (store exists)~~ | `src/app/favorites/page.tsx`, `src/app/project/[slug]/page.tsx`, `src/app/fund/[slug]/page.tsx`, `src/app/(tabs)/profile/page.tsx` | **Fixed 2026-07-02** |
| D-029 | ~~Home Weekly Picks section showed hardcoded mock data (fake "Celestia"/"EigenLayer") instead of real DB-ranked projects — stale home source comment incorrectly stated WeeklyPickDto lacked grade/tvlChangePercent (both are present); WeeklyPickCardProps required synthetic signals (fundingQuality/unlockRiskLevel/unlockRiskLabel) that have no DB source~~ | `src/components/features/home/weekly-pick-card.tsx`, `src/lib/api/sources/home.ts` | **Fixed 2026-07-02** |
| D-030 | ~~Weekly Picks `onPress` used `toSlug(name)` despite real DB slugs available via `WeeklyPickDto.slug` — slug not threaded through `WeeklyPickCardProps` or `mapWeeklyPickToCardProps`~~ | `src/components/features/home/weekly-pick-card.tsx`, `src/lib/api/sources/home.ts`, `src/app/(tabs)/page.tsx` | **Fixed 2026-07-02** |
| D-031 | ~~Home Unlock Alerts showed hardcoded mock data with fabricated `riskLevel`; `UnlockAlertCardProps.riskLevel` was already optional and rendered conditionally — stale home source comment incorrectly claimed the card "requires riskLevel"~~ | `src/components/features/home/unlock-alert-card.tsx`, `src/lib/api/sources/home.ts`, `src/app/(tabs)/page.tsx` | **Fixed 2026-07-02** |
| D-032 | ~~Dead imports in three files: `mockRecentFundraises` (home source — replaced by real data in D-022 but import not cleaned up); `cn` (accordion.tsx — never called, className passed through directly); `loadResolutionContext`/`resolveProjectIdWithContext` (identity-service.ts — re-exported on line 64 directly from resolver, line 8 import bindings were redundant). `noUnusedLocals: true` added to tsconfig to prevent recurrence.~~ | `src/lib/api/sources/home.ts`, `src/components/ui/accordion.tsx`, `src/identity/identity-service.ts`, `tsconfig.json` | **Fixed 2026-07-02** |
| D-033 | ~~Markets Funds tab showed 3 hardcoded mock funds — `FundRowCardProps.recentInvestmentCount` was required but `TopFundDto` carries no "recent" time-window count~~ | `src/components/features/markets/fund-row-card.tsx`, `src/api/rankings.ts`, `src/app/api/rankings/funds/route.ts`, `src/lib/api/sources/markets.ts`, `src/app/(tabs)/markets/page.tsx` | **Fixed 2026-07-02** |
| D-034 | ~~Search Funds results showed `mockMarketsFunds` filtered client-side — stale comment claimed `recentInvestmentCount` was the blocker (made optional in D-033); fund navigation used `toSlug(name)` and `key={fund.name}` with no real slug~~ | `src/lib/api/sources/search.ts`, `src/app/(tabs)/search/page.tsx` | **Fixed 2026-07-02** |
| D-035 | ~~`FundInsightsDto` locally redefined in `src/lib/api/sources/fund.ts` instead of imported from `"../dto"` — silent divergence risk if the dashboard type changes without updating the local copy~~ | `src/lib/api/dto.ts`, `src/lib/api/sources/fund.ts` | **Fixed 2026-07-02** |
| D-036 | ~~`Grade` locally redefined in `src/lib/api/sources/project.ts` as `"A+" \| "A" \| "B" \| "C" \| "D"` instead of imported from `"../dto"` — same silent divergence risk as D-035; `as Grade \| null` cast masked the disconnect~~ | `src/lib/api/dto.ts`, `src/lib/api/sources/project.ts` | **Fixed 2026-07-02** |
| D-037 | ~~Three stale comments gave actively wrong information: `favorites-store.ts` claimed "no Favorites UI today" (D-014 built it); `settings-store.ts` claimed "no screen has a toggle yet" (D-013 built Settings); `use-home.ts` said "Phase 1" and "Weekly Picks/Unlock Alerts still mock" (D-029/D-031 wired both)~~ | `src/store/favorites-store.ts`, `src/store/settings-store.ts`, `src/lib/api/hooks/use-home.ts` | **Fixed 2026-07-03** |
| D-038 | ~~Two more stale comments: `auth-store.ts` said "initDataUnsafe.user isn't wired yet" (D-023 wired it in AppContainer); `app-container.tsx` said "a future Profile-screen toggle" for the Settings screen theme toggle (D-013 built it)~~ | `src/store/auth-store.ts`, `src/components/layout/app-container.tsx` | **Fixed 2026-07-03** |
| D-039 | ~~`src/lib/query/keys.ts` comment said "neither screen has a dynamic [slug] route yet" — both `/project/[slug]` and `/fund/[slug]` exist and are fully wired; also mis-attributed why slug is optional (it's for batch cache invalidation, not absent routing)~~ | `src/lib/query/keys.ts` | **Fixed 2026-07-03** |
| D-040 | ~~Both API route files (`projects/[slug]/route.ts` and `funds/[slug]/route.ts`) claimed "not yet consumed" and "no dynamic [slug] route in the app" — both routes are the primary data source for their detail pages and have been since D-021; `useProject(slug)` and `useFund(slug)` call them on every load~~ | `src/app/api/projects/[slug]/route.ts`, `src/app/api/funds/[slug]/route.ts` | **Fixed 2026-07-03** |
| D-041 | ~~`search/route.ts` claimed "Not yet consumed" and named a DTO-gap that D-034 already closed; `rankings/weekly/route.ts` claimed the same DTO-gap that D-033 already closed (WeeklyPickDto has tvl/marketCap/changePercent24h/grade); `rankings/monthly/route.ts` referenced the now-incorrect weekly stale comment — monthly genuinely has no UI consumer but the reason was wrong~~ | `src/app/api/search/route.ts`, `src/app/api/rankings/weekly/route.ts`, `src/app/api/rankings/monthly/route.ts` | **Fixed 2026-07-03** |
| D-042 | ~~`ScoreGrade` locally defined in `src/lib/theme/colors.ts` as `"A+" \| "A" \| "B" \| "C" \| "D"` — same silent-divergence risk as D-035/D-036; if the scoring engine gains a new grade, `scoreGradeColor`'s `Record<ScoreGrade, ...>` silently misses it; replaced with `type ScoreGrade = Grade` (imported from `@/scoring/types`) so the two are structurally linked and TypeScript errors at `scoreGradeColor` if `Grade` expands~~ | `src/lib/theme/colors.ts` | **Fixed 2026-07-03** |
| D-043 | ~~Two production display types (`ScoreCategory` in `project-detail/mock-data.ts`, `FundInsight` in `fund-detail/mock-data.ts`) imported by live source files (`project.ts`, `fund.ts`) directly from `mock-data.ts` rather than the feature's public barrel — breaks the contract that source files should never reach into internal mock files; re-exported from each feature's `index.ts`; import paths updated in both source files~~ | `src/components/features/project-detail/index.ts`, `src/components/features/fund-detail/index.ts`, `src/lib/api/sources/project.ts`, `src/lib/api/sources/fund.ts` | **Fixed 2026-07-03** |
| D-044 | ~~`markets/mock-data.ts` header comment claimed "it can never be accidentally bundled into production code" — false: `mockMarketsFilters` is imported by `markets/page.tsx` and `mockMarketsPlatforms` by `markets.ts` and `search.ts`; comment also missed that `mockMarketsProjects` and `mockMarketsFunds` are now dead exports (replaced by real API in D-033/D-034); comment replaced with accurate description of which exports are live vs. dead~~ | `src/components/features/markets/mock-data.ts` | **Fixed 2026-07-03** |
| D-045 | ~~`home/mock-data.ts` header comment claimed "never imported by real app code" — false: `src/lib/api/sources/home.ts` imports 7 exports (`mockMarketOverview`, `mockFearGreed`, `mockTrendingProjects/Funds/Platforms`, `mockTopGainers`, `mockRecentlyAdded`) for sections with no backend DTO yet; comment also failed to note 4 dead exports (`mockWeeklyPicks`, `mockRecentFundraises`, `mockUnlockAlerts`, `mockWatchlistSummary`) that were replaced by real API data in D-020/D-022/D-029/D-031; comment replaced with accurate per-export live/dead inventory~~ | `src/components/features/home/mock-data.ts` | **Fixed 2026-07-03** |
| D-046 | ~~`search/mock-data.ts` header comment cited a "mock-filtered list" that no longer exists (client-side mock filtering was removed in D-034 when search was wired to real API); comment also did not flag that `mockRecentSearches` is a dead export (search page reads recent searches from Zustand store, not this file); comment replaced with accurate live/dead description — `mockTrendingSearches` live, `mockRecentSearches` dead~~ | `src/components/features/search/mock-data.ts` | **Fixed 2026-07-03** |
| D-047 | ~~`use-search.ts` JSDoc contained `(today: re-filter)` parenthetical and "mirrors how the real `GET /api/search`" framing written when search was mock-filtered client-side — D-034 replaced that with a real API call, making both phrases false; comment updated to reflect current state~~ | `src/lib/api/hooks/use-search.ts` | **Fixed 2026-07-03** |
| D-048 | ~~`src/lib/api/errors.ts` header said "today a mock rejection, tomorrow a failed fetch" — written when hooks threw mock errors; all data sources are now real API calls via `apiFetch`, so "tomorrow" has arrived and the phrase is false; replaced with accurate description of actual error types (network failure, timeout, ApiClientError from apiFetch)~~ | `src/lib/api/errors.ts` | **Fixed 2026-07-03** |
| D-049 | ~~`home.ts` source header said "Weekly Picks (Phase 2) and Unlock Alerts (Phase 3) now come from the real GET /api/home endpoint" — omitted that `newFunding` (→ recentFundraises) and `topFunds` are also fetched from the real endpoint; `newFunding` predated Phase 2; replaced with explicit real-vs-mock inventory matching the actual code~~ | `src/lib/api/sources/home.ts` | **Fixed 2026-07-03** |
| D-015 | No real-time price updates | — | 3 days |
| D-016 | `funding_investors.is_lead` missing from DB schema | DB | 1 day + re-ingest |
| D-017 | `projects.chain` missing from DB schema | DB | 2 days + re-ingest |
| D-018 | No pagination cursor (offset-based) | API handlers | 1 day |

## Intentional Non-Debt

These patterns are correct as designed:
- All metrics returning `null` — by design; frontend renders "—"
- `topChains: []` — accurate (no chain data); section shown conditionally
- No `riskLevel` on unlock cards from real data — no authoritative threshold in DB; card renders row without risk pill, which is correct
