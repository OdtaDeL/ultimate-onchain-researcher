# 09 — Production Status

Last updated: 2026-07-03 (Session 37)

## Overall Readiness: ~99%

All navigation paths use real DB slugs. Profile page shows the real Telegram user's identity. API routes are protected by a per-IP rate limiter and Telegram initData HMAC-SHA256 verification in production. Bundle analysis complete — no unexpected large imports; bundle is clean. Remaining work is entirely future features (watchlist sync, favorites, real-time prices).

## Fixed Issues

- Watchlist page always showed empty state — Fixed 2026-07-01
- Fund website/twitter buttons were no-ops — Fixed 2026-07-01
- Home "Watchlist" section showed mock data — Fixed 2026-07-01
- `console.log` via `logAction()` in home, markets, search, profile pages — Fixed 2026-07-01
- `GET /api/search` `?q=` had no length limit (DoS vector) — Fixed 2026-07-02
- `options.signal!.reason` non-null assertion in API client — Fixed 2026-07-02
- Watchlist navigation 404s when DB slug ≠ toSlug(name) — Fixed 2026-07-02
- Fund portfolio/recent-investments navigation 404s (same root cause) — Fixed 2026-07-02
- Home Recent Fundraises navigation used `toSlug(name)` instead of real DB slug (D-022) — Fixed 2026-07-02
- `CoinIcon`/`Avatar` used `<img>` instead of `next/image`; logo domains now registered in `next.config.ts` (D-012) — Fixed 2026-07-02
- Profile page hardcoded "Guest" instead of real Telegram identity (D-023) — Fixed 2026-07-02
- Missing 500 error-path tests for weekly rankings, fund, project, and search handlers (D-024) — Fixed 2026-07-02
- Project detail page had no website / Twitter external-link buttons despite `ProjectOverviewDto` carrying both fields (D-025) — Fixed 2026-07-02
- Profile "Settings" and "About" rows were no-ops with no destination; Settings page (theme toggle) and About page (app info) built (D-013) — Fixed 2026-07-02
- No way to add or view favorites despite store existing; Bookmark toggle added to project/fund detail headers; `/favorites` page built; Profile row added (D-014) — Fixed 2026-07-02
- Home Weekly Picks showed hardcoded mock data ("Celestia"/"EigenLayer" with invented scores) instead of real DB-ranked projects; wired to real API (D-029) — Fixed 2026-07-02
- Home Weekly Picks `onPress` used `toSlug(name)` even after D-029 wired real DB slugs; slug threaded through `WeeklyPickCardProps` and navigation fixed (D-030) — Fixed 2026-07-02
- Home Unlock Alerts showed hardcoded mock data with fabricated `riskLevel`; wired to real `UnlockAlertDto` (slug, date, percentOfSupply); `riskLevel` correctly absent — card renders row without risk pill (D-031) — Fixed 2026-07-02
- Dead imports (`mockRecentFundraises` in home source, `cn` in accordion, `loadResolutionContext`/`resolveProjectIdWithContext` in identity-service) — removed; `noUnusedLocals` added to tsconfig to prevent recurrence (D-032) — Fixed 2026-07-02
- Markets Funds tab showed 3 hardcoded mock funds; wired to real `TopFundDto` via new `GET /api/rankings/funds` endpoint; `recentInvestmentCount` made optional (no "recent" time window in DB — card renders "—"); fund navigation uses real slug (D-033) — Fixed 2026-07-02
- Search Funds results showed `mockMarketsFunds` filtered client-side; wired to real `FundSearchResultDto` via `GET /api/search?type=funds`; funds with null `portfolioProjectCount` dropped (honest-drop); fund `key`/`onPress` use real DB slug (D-034) — Fixed 2026-07-02
- `FundInsightsDto` locally redefined in fund source instead of imported from `dto.ts`; added to re-exports; import replaces local copy — type divergence from dashboard type is now a compile error (D-035) — Fixed 2026-07-02
- `Grade` locally redefined in project source as a literal union instead of imported from `dto.ts`; added to re-exports; `as Grade | null` cast removed — same divergence protection as D-035 (D-036) — Fixed 2026-07-02
- Three stale comments gave actively wrong information after D-013/D-014/D-029/D-031: `favorites-store.ts` claimed "no Favorites UI today"; `settings-store.ts` claimed "no screen has a toggle yet"; `use-home.ts` said Phase 1 and "Weekly Picks/Unlock Alerts still mock" — all corrected (D-037) — Fixed 2026-07-03
- Two more stale comments: `auth-store.ts` said Telegram identity "isn't wired yet" (D-023 wired it in AppContainer); `app-container.tsx` said "a future Profile-screen toggle" for the Settings theme toggle D-013 already shipped (D-038) — Fixed 2026-07-03
- `src/lib/query/keys.ts` comment said "neither screen has a dynamic [slug] route yet" — both routes exist and are fully wired; comment also mis-attributed why slug is optional (D-039) — Fixed 2026-07-03
- Both API route files (`projects/[slug]/route.ts`, `funds/[slug]/route.ts`) claimed "not yet consumed" and "no dynamic [slug] route in the app" — both are live primary data sources called on every detail page load (D-040) — Fixed 2026-07-03
- `search/route.ts` claimed a DTO-gap D-034 had already closed; `rankings/weekly/route.ts` claimed the same for a gap D-033 closed; `rankings/monthly/route.ts` referenced the incorrect weekly comment — all three corrected (D-041) — Fixed 2026-07-03
- `ScoreGrade` in `src/lib/theme/colors.ts` was a locally-defined duplicate of `Grade` from the scoring engine — silent divergence risk; linked via `type ScoreGrade = Grade` so `scoreGradeColor`'s `Record<ScoreGrade, ...>` errors at compile time if the grade set expands (D-042) — Fixed 2026-07-03
- `ScoreCategory` and `FundInsight` were production display types defined in `mock-data.ts` files but imported directly by `project.ts` and `fund.ts` source files — re-exported through each feature's `index.ts` public barrel so production source files no longer reach into internal mock files (D-043) — Fixed 2026-07-03
- `markets/mock-data.ts` header comment claimed "it can never be accidentally bundled into production code" — false: `mockMarketsFilters` and `mockMarketsPlatforms` are imported by production pages/sources; comment also failed to note that `mockMarketsProjects` and `mockMarketsFunds` are dead exports since D-033/D-034 wired real API data (D-044) — Fixed 2026-07-03
- `home/mock-data.ts` header comment claimed "never imported by real app code" — false: 7 exports are live in the production bundle via `home.ts` (sections with no backend DTO yet); 4 exports are dead code replaced by real API data in D-020/D-022/D-029/D-031 but comment never noted this; comment replaced with accurate live/dead inventory (D-045) — Fixed 2026-07-03
- `search/mock-data.ts` comment cited a "mock-filtered list" removed in D-034 and did not flag `mockRecentSearches` as a dead export (search page uses Zustand store for recent searches); comment replaced with accurate live/dead description (D-046) — Fixed 2026-07-03
- `use-search.ts` JSDoc contained `(today: re-filter)` parenthetical and "mirrors how the real GET /api/search" framing from when search was mock-filtered client-side; D-034 wired the real API so both phrases were false; comment corrected (D-047) — Fixed 2026-07-03
- `src/lib/api/errors.ts` header said "today a mock rejection, tomorrow a failed fetch" written when hooks threw mock errors; all data sources are now real API calls via apiFetch; replaced with accurate description of actual error types (D-048) — Fixed 2026-07-03
- `home.ts` source header said only "Weekly Picks (Phase 2) and Unlock Alerts (Phase 3)" come from the real GET /api/home endpoint — omitted that newFunding (recentFundraises) and topFunds are also real; replaced with explicit real-vs-mock inventory (D-049) — Fixed 2026-07-03
- Search page fired one Supabase ILIKE query per keystroke with no debouncing (D-026) — Fixed 2026-07-02
- No rate limiting on API routes — all routes were publicly accessible (D-009) — Fixed 2026-07-02
- `middleware.ts` used deprecated Next.js 16 convention, emitting build warning on every build (D-027) — Fixed 2026-07-02
- No Telegram initData verification — any HTTP client could hit API routes (D-008) — Fixed 2026-07-02

## Remaining Issues

- No server-side watchlist sync — device-local only (D-007)

## What's Working

- Profile page shows real Telegram user name and @username (falls back to "Guest" outside Telegram)
- All pages render without TypeScript errors
- React Query caching (30s stale, 5min gc, offline-first)
- Zustand persistence (watchlist/favorites survive close/reopen)
- Home Watchlist section reads real user saved items from store
- Watchlist tab reads real user saved items from store
- Fund website/Twitter links open correctly in browser
- Scoring engine produces correct grades
- Data ingestion CLI scripts functional
- Null-safety: all nullable fields render "—" or conditional UI

## What's Not Built Yet

- Real-time price updates (currently static from last sync)
- Server-side watchlist sync
- Push notifications for unlocks
