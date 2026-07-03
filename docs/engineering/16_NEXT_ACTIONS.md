# 16 — Next Actions

Last updated: 2026-07-02

## P0 — Done

- [x] Fix Watchlist page to read from Zustand store (2026-07-01)

## P1 — Done

- [x] Wire fund external links via `openLink` / `window.open` fallback (2026-07-01)
- [x] Remove `logAction` from fund detail page (2026-07-01)
- [x] Hide "Top Chains" section when empty (2026-07-01)
- [x] Fix home "Watchlist" section to read from Zustand store instead of mock data (2026-07-01)
- [x] Remove `console.log` via `logAction()` from home, markets, search, profile pages (2026-07-01)

## P2 — Done

- [x] Fix `options.signal!.reason` → `options.signal?.reason` in `src/lib/api/client.ts` (2026-07-02)
- [x] Add `MAX_QUERY_LENGTH = 200` guard to `GET /api/search` — prevents unbounded ILIKE pattern from reaching Supabase (2026-07-02)
- [x] Fix D-006: watchlist navigation 404s when DB slug ≠ toSlug(name) — added `slug?` to `CollectibleEntity`, mapped from API responses, used in all navigation callsites with `toSlug(name)` fallback for persisted entries (2026-07-02)
- [x] Fix D-021: fund portfolio/recent-investments rows navigate via toSlug(name) — threaded `projectSlug` and `projectLogoUrl` from `FundPortfolioProjectDto` through `mapPortfolioProject` into `PortfolioItem`; destructured at callsite before spreading onto `InvestmentRow` (2026-07-02)
- [x] Fix D-022: home Recent Fundraises navigated via `toSlug(name)` despite `NewFundingDto.slug` being present — added `slug?` to `RecentFundraiseCardProps`, mapped in `mapNewFundingToCardProps`, used in `onPress` with `toSlug(name)` fallback (2026-07-02)
- [x] Fix D-012: `Avatar`/`CoinIcon` used `<img>` — audited ingestion pipeline to confirm logo domains (`static.chainbroker.io`), registered in `next.config.ts` `images.remotePatterns`, switched `Avatar` to `next/image` with per-size `width`/`height` for correct srcset generation (2026-07-02)
- [x] Fix D-023: Profile page showed hardcoded "Guest" — extended `TelegramWebApp` type with `initDataUnsafe`, surfaced `user` from `useTelegramWebApp`, wired into auth store via `AppContainer`, profile now shows real `firstName`/`username` with "Guest" fallback (2026-07-02)
- [x] Fix D-024: Missing 500 error-path tests for weekly rankings, fund, project, and search handlers — added one test per handler, all 17 tests pass (2026-07-02)
- [x] Fix D-025: Project detail page had no website / Twitter external-link buttons — mapped `website`/`twitter` from `ProjectOverviewDto` into `ProjectData`, added `openExternalUrl` + buttons to hero section (mirrors D-003 fund fix) (2026-07-02)
- [x] Fix D-026: Search page fired one Supabase ILIKE query per keystroke — added 300ms debounce via `useState`/`useEffect`; cleared instantly on empty input; reordered render so `!hasQuery` shows recent/trending immediately without waiting for in-flight API calls (2026-07-02)
- [x] Fix D-009: No rate limiting on API routes — added `src/proxy.ts` with per-IP sliding-window rate limiter (60 req/min, 1-min window); returns 429 JSON with `Retry-After` header; prunes expired entries at 10k IPs (2026-07-02)
- [x] Fix D-027: Rename `middleware.ts` → `proxy.ts`; rename export from `middleware` to `proxy` per Next.js 16 convention; build now clean with no deprecation warning (2026-07-02)
- [x] Fix D-008: Telegram initData verification — added `verifyTelegramInitData` (HMAC-SHA256 via Web Crypto) to `proxy.ts`; active in production when `TELEGRAM_BOT_TOKEN` is set, skipped in dev; `apiFetch` sends `x-telegram-init-data` header; 24 h auth_date expiry enforced; tests bypass proxy and continue to pass 17/17 (2026-07-02)
- [x] D-011: Bundle analysis — ran `npx next experimental-analyze --output` (Turbopack-native); no unexpected large imports found; `@supabase/supabase-js` stays server-only; `lucide-react` auto-optimized by Next.js; dominant cost is `framer-motion` (~490 KB minified, 24 files, expected); logged D-028 for optional future lazy-load (2026-07-02)

## P3 — Partial

- [x] Fix D-013: Settings page (`/settings`) with dark/light theme toggle; About page (`/about`) with static app info; Profile rows now route to both (2026-07-02)
- [x] Close D-028: framer-motion lazy-load not feasible — `MotionConfig` in `AppContainer` (root layout) places the library in the shared chunk; route-level `next/dynamic` cannot remove it without restructuring and breaking the app-wide `reducedMotion="user"` a11y guarantee (2026-07-02)

## P3 — Future

- [x] Fix D-014: Favorites page (`/favorites`) with projects/funds sections and empty state; Bookmark toggle added to project and fund detail page headers; "Favorites" row added to Profile page (2026-07-02)
- [x] Fix D-029: Home Weekly Picks wired to real DB data — made `fundingQuality`/`unlockRiskLevel`/`unlockRiskLabel` optional in `WeeklyPickCardProps` (card shows "—" when absent, consistent with all other nullable fields); added `mapWeeklyPickToCardProps` in home source; removed `mockWeeklyPicks`; fixed stale comment that incorrectly stated DTO lacked `grade`/`tvlChangePercent` (2026-07-02)
- [x] Fix D-030: Weekly Picks `onPress` used `toSlug(name)` despite real DB slugs being available — added `slug?` to `WeeklyPickCardProps`, threaded `pick.slug` through `mapWeeklyPickToCardProps`, updated navigation to `slug ?? toSlug(name)` (2026-07-02)
- [x] Fix D-031: Home Unlock Alerts wired to real `UnlockAlertDto` — stale home source comment incorrectly stated card "requires riskLevel" (field was already optional); added `slug?` to `UnlockAlertCardProps`; added `formatUnlockDate` (ISO → "Jul 2" via `Intl`); `mapUnlockAlertToCardProps` maps slug/name/logoUrl/date/percentOfSupply; `riskLevel` correctly absent from real data — card renders without risk pill (2026-07-02)
- [x] Fix D-032: Dead imports removed from 3 files (`mockRecentFundraises` in home source, `cn` in accordion, `loadResolutionContext`/`resolveProjectIdWithContext` in identity-service); `noUnusedLocals: true` added to tsconfig — build now enforces no dead imports at compile time (2026-07-02)
- [x] Fix D-033: Markets Funds tab wired to real `TopFundDto` data — added `GET /api/rankings/funds` endpoint (`handleGetFundRankings` via `getTopFunds`); made `recentInvestmentCount?: number` optional in `FundRowCardProps` (card renders "—" when absent); added `slug?` to `FundRowCardProps`; markets source fetches `/api/rankings/funds` in parallel with projects; fund navigation updated to `slug ?? toSlug(name)`; 2 new tests (19/19 pass) (2026-07-02)
- [x] Fix D-034: Search Funds results wired to real `FundSearchResultDto` — stale comment claimed `recentInvestmentCount` was the blocker (made optional in D-033); removed `mockMarketsFunds`; added `fetchRealFundResults` calling `GET /api/search?type=funds`; projects and funds now fetched in parallel; funds with `null portfolioProjectCount` dropped (honest-drop); search page fund `key`/`onPress` updated to use `fund.slug ?? toSlug(fund.name)` (19/19 pass) (2026-07-02)
- [x] Fix D-035: `FundInsightsDto` locally redefined in `src/lib/api/sources/fund.ts` — added to `dto.ts` re-exports; removed local copy; source now imports it from `"../dto"` so type divergence from the dashboard type is a compile error, not a silent mismatch (19/19 pass) (2026-07-02)
- [x] Fix D-036: `Grade` locally redefined in `src/lib/api/sources/project.ts` as a literal union instead of imported from `"../dto"` — same divergence risk as D-035; added `Grade` to `dto.ts` re-exports; removed local type and `as Grade | null` cast (now unnecessary with a proper import); (19/19 pass) (2026-07-02)
- [x] Fix D-037: Three stale comments gave actively wrong post-implementation state — `favorites-store.ts` said "no Favorites UI today" (D-014 built it); `settings-store.ts` said "no screen has a toggle yet" (D-013 built Settings); `use-home.ts` said "Phase 1" and "Weekly Picks/Unlock Alerts still mock" (D-029/D-031 wired both to real data); all three updated to reflect current state (19/19 pass) (2026-07-03)
- [x] Fix D-038: Two more stale comments — `auth-store.ts` said Telegram identity "isn't wired yet" (D-023 wired `initDataUnsafe.user` in AppContainer); `app-container.tsx` said "a future Profile-screen toggle" for the Settings-screen theme toggle D-013 already shipped; both corrected (19/19 pass) (2026-07-03)
- [x] Fix D-039: `src/lib/query/keys.ts` comment said "neither screen has a dynamic [slug] route yet" (both `/project/[slug]` and `/fund/[slug]` exist and are fully wired); also mis-attributed why `slug` is optional — the real reason is batch cache invalidation, not absent routing; comment replaced with accurate explanation (19/19 pass) (2026-07-03)
- [x] Fix D-040: `projects/[slug]/route.ts` and `funds/[slug]/route.ts` both claimed "not yet consumed" with "no dynamic [slug] route in the app" — both routes are the live primary data source for their detail pages, called by `useProject(slug)` and `useFund(slug)` on every load; comments replaced with accurate descriptions (19/19 pass) (2026-07-03)
- [x] Fix D-041: `search/route.ts` claimed a DTO-gap D-034 closed; `rankings/weekly/route.ts` claimed a DTO-gap D-033 closed (WeeklyPickDto already has all required fields); `rankings/monthly/route.ts` referenced the now-incorrect weekly stale comment — all three updated to reflect current state; monthly correctly noted as having no UI consumer yet (19/19 pass) (2026-07-03)
- [x] Fix D-042: `ScoreGrade` locally defined in `src/lib/theme/colors.ts` — same silent-divergence risk as D-035/D-036; replaced with `type ScoreGrade = Grade` (imported from `@/scoring/types`) so TypeScript errors at `scoreGradeColor` if the scoring engine ever expands the grade set; also corrected stale comment in `home/types.ts` (19/19 pass) (2026-07-03)
- [x] Fix D-043: `ScoreCategory` and `FundInsight` defined in `mock-data.ts` files but imported directly by production source files (`project.ts`, `fund.ts`) — re-exported from each feature's `index.ts`; import paths corrected so production code no longer reaches into internal mock files (19/19 pass) (2026-07-03)
- [x] Fix D-044: `markets/mock-data.ts` header comment claimed "it can never be accidentally bundled into production code" — false: `mockMarketsFilters` (filter bar, no real API yet) and `mockMarketsPlatforms` (platforms tab/search, no real API yet) are imported by production code; comment also missed that `mockMarketsProjects` and `mockMarketsFunds` are dead exports post-D-033/D-034; comment replaced with accurate per-export description (19/19 pass) (2026-07-03)
- [x] Fix D-045: `home/mock-data.ts` header comment claimed "never imported by real app code" — false: 7 exports are live in the production bundle via `home.ts` for sections awaiting real backend DTOs; 4 exports are dead code replaced by real API in D-020/D-022/D-029/D-031; comment replaced with accurate live/dead inventory per export (19/19 pass) (2026-07-03)
- [x] Fix D-046: `search/mock-data.ts` comment referenced a "mock-filtered list" that was removed in D-034 when search was wired to real API; also did not flag `mockRecentSearches` as dead (Zustand store owns recent searches); comment replaced with accurate live/dead description — `mockTrendingSearches` live, `mockRecentSearches` dead (19/19 pass) (2026-07-03)
- [x] Fix D-047: `use-search.ts` JSDoc contained `(today: re-filter)` parenthetical and "mirrors how the real GET /api/search" framing written when search was mock-filtered; D-034 wired the real API, making both phrases false; comment corrected to "re-fetch per distinct query against GET /api/search?q=..." (19/19 pass) (2026-07-03)
- [x] Fix D-048: `src/lib/api/errors.ts` header said "today a mock rejection, tomorrow a failed fetch" — written when hooks threw mock errors; all data sources are now real API calls via apiFetch so the "tomorrow" has arrived; replaced with accurate description of actual error types (19/19 pass) (2026-07-03)
- [x] Fix D-049: `home.ts` source header said only "Weekly Picks (Phase 2) and Unlock Alerts (Phase 3)" come from the real GET /api/home endpoint — omitted `newFunding` (→ recentFundraises, predates Phase 2) and `topFunds`; replaced Phase 2/3 framing with explicit real-vs-mock inventory matching the code (19/19 pass) (2026-07-03)

- [x] Wire Monthly Picks to home page — added `getMonthlyPicks` to `handleGetHome`; added `monthlyPicks` to `HomeData`, `RealHomeSections`, and `fetchHomeData`; reused `WeeklyPickCard` via `mapMonthlyPickToCardProps`; added "Monthly Picks" horizontal scroll section to home page between Weekly Picks and Watchlist Summary; updated home test (19/19 pass) (2026-07-03)

- Add server-side watchlist sync (requires auth)
- Add pagination cursor UI (API layer already supports it; markets source fetches pageSize=50 which covers current data volume)
- DB migrations: `is_lead`, `projects.chain`, risk level thresholds

## Do Not Do (Intentional Non-Work)

- Do not add `riskLevel` derivation to the frontend — requires backend threshold system
- Do not add `activityStatus` to funds — requires DB schema change
- Do not add chain display to projects — requires DB schema change
- Do not fabricate `leadInvestor` from first investor — `is_lead` must come from DB
