# ROADMAP — Ultimate Onchain Researcher

> **Single source of truth.** All development sessions must start and end here.
> Last updated: 2026-07-04 (session 7)

---

## Product Vision

Ultimate Onchain Researcher is a Telegram Mini App that helps crypto investors discover, evaluate,
and track onchain projects and venture funds. The core value proposition is a transparent scoring
engine that aggregates funding data, market metrics, TVL, token unlock schedules, and investor
reputation into a single comparable score (0–100) with a letter grade — enabling users to make
faster, more informed investment decisions without leaving Telegram.

---

## Current Status

### Completed Features

| Feature | Verified In Repo |
|---|---|
| 4-tab navigation (Home, Markets, Search, Watchlist) | `src/app/(tabs)/layout.tsx` |
| Home feed — Weekly Picks (real DB data) | `src/lib/api/sources/home.ts` |
| Home feed — Monthly Picks (real DB data) | `src/lib/api/sources/home.ts` |
| Home feed — Top Funds (real DB data) | `src/lib/api/sources/home.ts` |
| Home feed — Recent Fundraises (real DB data) | `src/lib/api/sources/home.ts` |
| Home feed — Unlock Alerts (real DB data) | `src/lib/api/sources/home.ts` |
| Home feed — Watchlist summary (reads Zustand store) | `src/app/(tabs)/page.tsx` |
| Markets — Projects tab (real weekly rankings) | `src/lib/api/sources/markets.ts` |
| Markets — Funds tab (real top_funds view) | `src/lib/api/sources/markets.ts` |
| Search — projects and funds (real Supabase ILIKE) | `src/lib/api/sources/search.ts` |
| Project detail page (score, funding, unlocks, metrics) | `src/app/project/[slug]/page.tsx` |
| Fund detail page (portfolio, investments, insights) | `src/app/fund/[slug]/page.tsx` |
| Watchlist page (reads Zustand store, persist to localStorage) | `src/app/(tabs)/watchlist/page.tsx` |
| Favorites page (star toggle on detail pages, dedicated page) | `src/app/favorites/page.tsx` |
| Profile page (real Telegram identity, fallback "Guest") | `src/app/(tabs)/profile/page.tsx` |
| Settings page (light/dark/system theme toggle) | `src/app/settings/page.tsx` |
| About page (static app info) | `src/app/about/page.tsx` |
| Scoring engine (7-component pure TypeScript, deterministic) | `src/scoring/` |
| Data ingestion CLI (ChainBroker, CoinGecko, DefiLlama) | `src/ingestion/`, `src/cli/` |
| Per-IP rate limiting (60 req/min sliding window) | `src/proxy.ts` |
| Telegram initData HMAC-SHA256 verification (production) | `src/proxy.ts` |
| Search debouncing (300ms) | `src/app/(tabs)/search/page.tsx` |
| React Query caching (30s stale, 5min gc, offline-first) | `src/lib/query/defaults.ts` |
| Integration tests — 19 tests across 5 API handlers | `src/api/__tests__/` |
| TypeScript strict mode, `noUnusedLocals` enforced | `tsconfig.json` |
| Null-safety across all components (no fabricated values) | All source files |

### Partially Completed Features

| Feature | What's Done | What's Missing |
|---|---|---|
| Markets page | Projects + Funds tabs use real data; Platforms tab + filter bar removed | — |
| Watchlist | Device-local persist works | No cross-device sync (requires auth) |
| Favorites | Device-local persist works | No cross-device sync (requires auth) |
| Data ingestion | All 3 providers + scoring work; Vercel Cron runs daily at 02:00 UTC | — |

### Missing Features

| Feature | Blocker |
|---|---|
| Real-time price updates | No WebSocket/SSE endpoint; CoinGecko polling not scheduled |
| Push notifications (unlock alerts) | No notification infrastructure |
| Server-side watchlist/favorites sync | No auth system |
| Scheduled ingestion (cron) | All sync is manual CLI |
| Lead investor on funding rounds | `funding_investors.is_lead` column does not exist in DB |
| Blockchain tag on projects | `projects.chain` column does not exist in DB |
| Risk level on unlock cards | No threshold system in DB or scoring engine |
| Pagination UI | API supports cursor pagination; no UI built |
| Telegram Mini App onboarding flow | Not started |
| Analytics | Not started |
| Error monitoring (Sentry etc.) | Not started |

### Production Readiness

- **Security**: Rate limiting active; Telegram initData verification active in production;
  RLS enforces SELECT-only for anon key; no SQL injection surface (PostgREST parameterized);
  no XSS (`dangerouslySetInnerHTML` not used); service-role key never exposed to browser.
- **Performance**: React Query caches prevent redundant fetches; materialized views serve
  rankings without per-request DB sorts; 10s API timeout; AbortController cancels on unmount.
- **Stability**: 19 integration tests covering happy path and 500 error paths; TypeScript strict
  with `noUnusedLocals` prevents dead imports; null-drop pattern prevents fabricated values.
- **Rate limiting caveat**: Current in-process `Map` does not coordinate across multiple
  Vercel replicas. Requires Redis (Upstash) for multi-replica deployments.
- **Ingestion caveat**: Data freshness depends entirely on manual CLI execution.
  Prices and rankings go stale without a scheduled sync.

### Current Blockers

1. **Stale data** — no scheduled ingestion; all data is as fresh as the last manual `npm run sync:*` run.
2. **No error monitoring** — production failures are invisible.

---

## Milestones

### Phase 1 — Foundation ✅

- [x] Next.js 16 App Router skeleton (TypeScript strict)
- [x] Supabase schema (projects, funds, investors, funding rounds, token unlocks, project metrics, project scores)
- [x] Materialized views (top_projects, top_funds, weekly_rankings_mv, monthly_rankings_mv, fund_leaderboard)
- [x] Scoring engine — 7-component pure TypeScript (funding, investor, market, TVL, revenue, unlock, momentum)
- [x] Data ingestion CLI — ChainBroker (funding), CoinGecko (market), DefiLlama (TVL)
- [x] Score sync CLI (`sync:scores`) — runs engine, upserts project_scores, refreshes materialized views
- [x] Dashboard Query Layer — server-side DTO assemblers (project, fund, home, search)
- [x] API route handlers (home, project detail, fund detail, search, rankings)
- [x] React Query data layer (useHome, useProject, useFund, useSearch, useMarkets)
- [x] Zustand stores (watchlist, favorites, search, UI, auth, settings) with localStorage persistence
- [x] Per-IP rate limiting (60 req/min sliding window)
- [x] Telegram initData HMAC-SHA256 verification

### Phase 2 — Core Screens ✅

- [x] Home feed (4-tab layout, skeleton loading, error/empty states)
- [x] Markets screen (Projects + Funds tabs, segmented control)
- [x] Search screen (debounced, real API, recent search history)
- [x] Project detail page (score card, funding rounds, token unlocks, metrics, related projects)
- [x] Fund detail page (portfolio, recent investments, sectors, fund insights)
- [x] Watchlist page (reads Zustand store, trash-button to remove)
- [x] Profile page (real Telegram identity, Settings and About links)
- [x] Settings page (light/dark/system theme toggle)
- [x] About page (static app info)
- [x] Favorites page (store-backed, bookmark toggle on detail pages)
- [x] Integration tests — 19 tests, all passing

### Phase 3 — Real Data Everywhere ✅ *(17/17 complete)*

- [x] Home Weekly Picks → real `weekly_rankings_mv`
- [x] Home Monthly Picks → real `monthly_rankings_mv`
- [x] Home Unlock Alerts → real `token_unlock_events`
- [x] Home Recent Fundraises → real `funding_rounds`
- [x] Home Top Funds → real `top_funds` view
- [x] Home Watchlist summary → real Zustand store
- [x] Markets Projects tab → real `weekly_rankings_mv`
- [x] Markets Funds tab → real `top_funds` view
- [x] Search projects + funds → real Supabase ILIKE
- [x] Home Trending Projects tab → real data (mapped from `weeklyPicks` in `fetchHomeData`) (2026-07-03)
- [x] Home Trending Funds tab → real data (mapped from `topFunds` in `fetchHomeData`) (2026-07-03)
- [x] Home Top Gainers → real `project_metrics.price_change_24h` (`getTopGainers` in dashboard/home.ts; `TopGainerDto` in types.ts; wired through GET /api/home) (2026-07-03)
- [x] Home Recently Added → real `projects.created_at` (`getRecentlyAdded` in dashboard/home.ts; `RecentlyAddedDto` in types.ts; wired through GET /api/home) (2026-07-03)
- [x] Home Market Overview → real aggregate market data (`getMarketOverview` in dashboard/home.ts; `MarketOverviewDto` in types.ts; wired through GET /api/home; falls back to mock when no metrics rows exist) (2026-07-04)
- [x] Home Fear & Greed → Alternative.me `GET /fng/?limit=1`; provider `src/providers/feargreed/client.ts`; handler `src/api/fear-greed.ts`; route `GET /api/fear-greed` with `revalidate=3600`; fetched in parallel inside `fetchHomeData`; falls back to `mockFearGreed` on provider failure (2026-07-04)
- [x] Markets Platforms tab → removed; no backend DTO exists for DeFi protocols; `MarketsTab` narrowed to `"projects" | "funds"`; `platforms` field removed from `MarketsData` and `EMPTY_MARKETS_DATA`; `PlatformRowCard` removed from markets/page.tsx; home page "See all" guard added for `TrendingTab` (2026-07-04)
- [x] Markets filter bar → removed; `weekly_rankings_mv` has no dynamic filter columns; `activeFilterKey`/`setActiveFilterKey` removed from `ui-store.ts`; `FilterBar` import + `mockMarketsFilters` removed from markets/page.tsx; `mockMarketsFilters` removed from mock-data.ts (2026-07-04)

### Phase 4 — Production Infrastructure

- [x] Create `vercel.json` with build config (2026-07-03; `@secret-name` env mapping removed 2026-07-05 — Vercel deprecated the `secrets` CLI/platform feature entirely, so that block would have failed the build; Project Environment Variables are injected automatically without any `env` declaration in `vercel.json`)
- [x] Document all required env vars in `docs/engineering/18_DEPLOYMENT.md` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`) (2026-07-03; deploy steps corrected 2026-07-05 to use `vercel env add` instead of the removed `vercel secrets add`)
- [ ] Add error monitoring (Sentry or equivalent)
- [ ] Replace in-process rate limit store with Redis (Upstash) for multi-replica correctness
- [x] Add health check endpoint (`GET /api/health`) (2026-07-03)
- [x] **Deployed to Vercel production** — project `ultimate-onchain-researcher` linked and live at `https://ultimate-onchain-researcher.vercel.app`; `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (freshly generated) set as encrypted Production env vars; verified live — `/api/health` returns `200`, `/api/search` returns real Supabase data; hardcode audit found no secrets outside `.env`/`env.ts`, all provider base URLs (CoinGecko/DefiLlama/ChainBroker/Alternative.me) are public keyless endpoints and correctly left as constants; **`TELEGRAM_BOT_TOKEN` was NOT set** — no real bot token available, so initData verification is currently skipped in production (safe-but-unverified fallback); add the real token via `vercel env add TELEGRAM_BOT_TOKEN production` before a real Telegram launch (2026-07-05)

### Phase 5 — Automated Ingestion

*(Depends on Phase 4: Vercel Cron requires `vercel.json` to exist)*

- [x] Schedule `sync:all` + `sync:metrics` + `sync:scores` via Vercel Cron (`GET /api/cron/sync`, daily at 02:00 UTC) (2026-07-03)
- [x] Add retry logic and failure alerting to ingestion scripts (per-phase isolation, page-level retry with 3 attempts + exponential back-off, structured console.log per phase) (2026-07-03)
- [x] Monitor data freshness — `checkFreshness()` queries `project_scores.score_date`; logs warning and sets `freshness.isStale` in cron response when >25 h old (2026-07-03)

### Phase 6 — DB Schema Extensions

- [ ] Add `funding_investors.is_lead` column + re-ingest ChainBroker data
- [ ] Add `projects.chain` column + ingest chain from ChainBroker
- [ ] Add risk level thresholds to scoring engine → `project_scores.risk_level`
- [ ] Expose lead investor on project funding rounds UI
- [ ] Expose blockchain tag on project hero
- [ ] Expose risk level pill on unlock alert cards

### Phase 7 — Auth & Cross-Device Sync

- [ ] Implement Telegram user identity persistence (map `initData.user.id` to a user row)
- [ ] `POST /api/watchlist` — save watchlist entry server-side
- [ ] `GET /api/watchlist` — load watchlist from server
- [ ] `POST /api/favorites` + `GET /api/favorites` — same for favorites
- [ ] Merge server-side and device-local stores on login

### Phase 8 — Real-Time & Notifications

- [ ] Schedule CoinGecko price sync (every 5 minutes via cron)
- [ ] Push notification infrastructure (Telegram Bot API)
- [ ] Unlock alert notifications (24h and 1h before scheduled unlock)
- [ ] Real-time price display (React Query polling or SSE)

### Phase 9 — Growth & Discovery

- [x] Landing page (outside Telegram — marketing + install CTA) — static SSG route `/landing` at `src/app/landing/page.tsx`; hero, feature list, "Open in Telegram" CTA (placeholder `https://t.me/YourBotUsername` with TODO comment); no `"use client"`, no Telegram SDK; works without JS; uses design system tokens (`text-foreground`, `text-muted-foreground`, `bg-primary`); prerendered `○ (Static)` in production build (2026-07-04)
- [x] Telegram Mini App onboarding flow (first-launch tutorial) — 3-slide `OnboardingOverlay` (Welcome → Score → Let's Go); `framer-motion` slide transitions; dot-step indicator; Skip + "Let's Go" buttons; `onboardingDone` + `completeOnboarding` added to `settings-store.ts` (persisted to localStorage); mounted as fixed `z-50` overlay in `(tabs)/layout.tsx`; renders nothing once dismissed (2026-07-05)
  - [x] **UX fix (2026-07-05):** redesigned from an edge-to-edge full-screen takeover (felt like it "blocked" the app with no visible way out) to a proper centered modal card — `radius.xl` + `shadow.overlay` (the tokens the design system reserves for "Bottom Sheets, Modals, Toasts"), dimmed + blurred `bg-background/70 backdrop-blur-sm` backdrop so the app is visibly present-but-inactive underneath, `X` close button top-right plus a text "Skip" under the CTA on non-final slides — both call `completeOnboarding()`, which is a permanent dismissal (persisted `onboardingDone: true`; never shows again on any future visit)
- [ ] Analytics integration (track screens, actions, retention)
- [x] Pagination UI for Markets and Search results — `<LoadMoreButton>` component; `apiFetchPaginated` in client.ts; Markets projects tab page-based load more; Search projects + funds load more per tab (2026-07-04)
- [ ] Share project/fund card via Telegram (native share sheet)

### Phase 10 — Demo Polish *(current focus: maximize live-demo quality; skip anything needing external services)*

- [x] Score radar chart on project detail — pure-SVG `ScoreRadarChart` in `src/components/features/project-detail/score-radar-chart.tsx`; renders the 7 score sub-categories as a spider chart inside the Scoring Breakdown accordion, above the exact-number progress bars; theme-aware via `currentColor` (`text-accent` polygon, `text-muted-foreground` grid/labels); no chart library added; hides itself below 3 axes (2026-07-05)
- [x] AI Insight on project detail (demo flow step 7) — `AiInsightCard` + `generateProjectInsight` in `src/components/features/project-detail/ai-insight-card.tsx`; deterministic rule-based prose synthesized from scoring engine components, next unlock, and 24h momentum (NOT an LLM call — zero external services); 2–4 sentences: overall band, strongest/weakest pillar, unlock warning weighted by % of supply, momentum note when |24h| ≥ 5%; rendered after Scoring Breakdown, only when a score exists; Sparkles-icon header in accent color (2026-07-05)
- [x] Onboarding UX fix — full-screen takeover felt like it blocked the app; redesigned as a centered modal card (`radius.xl` + `shadow.overlay`) over a dimmed+blurred backdrop; added an `X` close button; both `X` and "Skip" permanently dismiss via persisted `onboardingDone` (2026-07-05)
- [x] **Search/Markets Projects showing far fewer results than actually matched (root cause of "search shows almost nothing")** — `mapSearchResultToProjectRow` (search.ts) and `mapWeeklyPickToProjectRow` (markets.ts) were dropping a project entirely if ANY of 5 fields (score/grade/tvl/marketCap/24h change) was null; since most projects aren't TVL-bearing protocols or haven't been metrics-synced yet, this silently hid the majority of valid, scored matches — measured live: query "a" matched 25 projects in the DB, old rule displayed only 4 of them. Fixed by narrowing the drop condition to score+grade only (a project's core identity) and making `ProjectRowCardProps.tvl/marketCap/changePercent24h` nullable, rendering "—" per-field (same convention as the project detail page) instead of hiding the whole row. Deployed to production 2026-07-06; verified query "a" now returns 25/25.
- [x] **Investor score always 0, Unlock score always 100 across nearly every project** — root cause traced to real missing data, not a scoring-engine bug: `funding_rounds`/`funding_investors`/`token_unlock_events` were empty for almost all projects because those `sync:*` CLI jobs had never successfully run. Found and fixed two blocking bugs in the process:
  1. `src/cli/{chainbroker-sync,metrics-sync,scoring-sync}.ts` never loaded `.env` (no dotenv, no `--env-file`) — every standalone `npm run sync:*` invocation failed instantly with "Missing required environment variable: SUPABASE_URL" and always had, silently, since these scripts were written. Fixed with `process.loadEnvFile()` (Node 20.6+ built-in, no new dependency), guarded in a try/catch for CI/production where env vars come from the platform instead of a file.
  2. Once `sync:funding-rounds` could finally run, `sync:scores` then crashed with a PostgREST "Bad Request" — `funding_rounds` now has ~3,900 real rows (ChainBroker's global feed), and `.in("funding_round_id", [...])` with that many UUIDs exceeded PostgREST's ~8 KB GET URL limit. Fixed by batching that lookup 200 IDs at a time in `src/scoring-sync/scoring-sync.ts`.
  - Ran the full pipeline against production: `sync:funding-rounds` → `sync:unlocks` → `sync:scores --all` (2,251/2,251 projects scored, 0 failed, materialized views refreshed). Verified live: e.g. EigenLayer went investor 0→36, unlock 100→66.5, grade D→C.
  - Confirmed the existing `/api/cron/sync` (Vercel Cron, daily 02:00 UTC, already registered and live — `vercel crons ls` confirmed) runs this exact same pipeline automatically going forward, now that both bugs are fixed; no new automation needed, just these two bug fixes. Deployed 2026-07-06.
- [x] **Ran `sync:metrics --provider=all` for the first time (same `.env`-loading bug as above had silently blocked it too)**. Initial sync report claimed CoinGecko matched "1,300/2,251 (~58%)" and DefiLlama "171/2,251 (~7.6%)" — **this was a misreading, corrected 2026-07-06**: the sync report's `matchedProjects` counts successfully-resolved *provider records*, not unique projects — CoinGecko lists many duplicate variants of the same asset (e.g. "USDC," "USDC (PoS)," "Bridged USDC") that can each independently symbol/name-match the same one of our projects, inflating the count. **Verified ground truth via a direct `project_metrics` count**: only **761/2,251 (33.8%)** unique projects had a non-null price, **118/2,251 (5.2%)** had TVL, before today's CoinPaprika/DexScreener work below. DefiLlama's low rate is still expected/not-a-defect (most tracked projects — L1s, NFT projects, gaming tokens — have no TVL by nature); CoinGecko's real (corrected) ~34% has genuine room to improve via better identity matching (no manual-override table populated, no contract-address matching wired) — flagged as backlog, not attempted.
- [x] **Added two gap-filling metrics providers, CoinPaprika and DexScreener, to raise the corrected ~34%/~5% coverage** — both built from scratch following the existing provider-folder convention (`SOURCE.md` + `types.ts` + `schemas.ts` + `mapper.ts` + `client.ts` + `provider.ts`, mirroring `src/providers/coingecko/`):
  - **CoinPaprika** (`src/providers/coinpaprika/`) — bulk `GET /v1/tickers`, one HTTP call returns ~2,000 coins (no pagination, unlike CoinGecko). Live-verified before coding (per this project's source-driven-development practice): no rate-limit headers, `max_supply` sometimes `0` instead of `null` for no-max tokens, `id` format (`"btc-bitcoin"`) intentionally NOT passed to the identity resolver as a slug (wouldn't match ChainBroker's plain slugs).
  - **DexScreener** (`src/providers/dexscreener/`) — `GET /latest/dex/search?q=<ticker>`, per-project, rate-limited to the documented 60/min. Returns trading *pairs*, deduplicated to one row per token address (highest liquidity wins); only accepts a candidate on an exact ticker-symbol match, skips ambiguous/no-match results rather than guessing.
  - **New `fillNullsOnly` upsert mode** (`src/ingestion/metrics/upsert-service.ts`) is the actual safety mechanism: both new providers are allowed to reuse CoinGecko's own column names (`price`, `market_cap`, etc. — normally forbidden, see the "own columns" rule) specifically *because* this mode structurally cannot overwrite a value a higher-priority provider already wrote — it only ever fills a column that is currently null.
  - **New migration `013_coinpaprika_dexscreener_data_sources.sql`** (applied to production) — registers both providers in `data_sources`, required by `project_aliases`' foreign key before identity resolution can write an alias for either.
  - **Wired into both the CLI and the automatic daily pipeline**: `npm run sync:metrics -- --provider=coinpaprika|dexscreener|all`; `/api/cron/sync` now also runs CoinPaprika (cheap, one bulk call). **DexScreener is deliberately CLI-only, not in the cron** — it queries once per still-missing project (rate-limited 1/sec) and could alone consume the cron function's entire `maxDuration` budget; see `src/api/cron.ts`'s comment. **Also discovered**: `src/app/api/cron/sync/route.ts`'s `maxDuration = 300` requires a Vercel Pro plan — if this project is actually on the Hobby plan, the real cap is 10 seconds and the daily cron may be silently timing out before finishing every phase; not verified which plan is active, flagged here rather than assumed.
  - **Results from the first live run**: CoinPaprika filled **93** previously-null projects (matched 345/2,000 tickers against the catalog); DexScreener then filled **56** more from the 295 projects still missing after CoinPaprika (only 4 didn't cleanly resolve). Re-ran `sync:scores --all` afterward to propagate. Net effect: real but modest — roughly **+149 projects** now have price/market-cap data that didn't before.
- [ ] **IN PROGRESS, paused on an external block — ChainBroker per-project metrics/TVL + Hot Projects pipeline.** Two pieces, both requested 2026-07-06:
  1. **Fill CoinGecko/DefiLlama gaps**: ChainBroker exposes `GET /projects/metrics/{slug}/` and `GET /projects/tvl/{slug}/` (documented in `SOURCE.md`, never implemented) — keyed by our own ChainBroker slug, so ingesting these needs no identity-resolution matching at all (guaranteed 1:1, unlike CoinGecko's 58%/DefiLlama's 7.6%). Plan: add as a third `project_metrics` source, filling only the columns CoinGecko/DefiLlama left null for a project (never overwriting a real CoinGecko/DefiLlama value).
  2. **"Hot Projects" section on Home**: `GET /projects/trending/` (also documented, never implemented) becomes a new Home section, reusing the existing `TrendingSection`/`TrendingItem` component (no new card needed).
  - **Done so far** (safe, doesn't depend on live API shape): migration `supabase/migrations/012_project_trending.sql` adds `projects.is_trending` / `trending_rank` / `trending_synced_at`; `types/database.types.ts` updated to match; normalized output types added to `src/providers/chainbroker/types.ts` (`NormalizedTrendingProject`, `NormalizedProjectMetricsSnapshot`, `NormalizedProjectTvlSnapshot`).
  - **Blocked**: chainbroker.io (API and main site both) started timing out from this environment partway through today's session — almost certainly the Cloudflare soft-block `SOURCE.md` itself warns is a risk after heavy crawl volume (today's funding-rounds/unlocks sync did 165+28 paginated requests). Confirmed genuinely down, not a code bug — even the already-working `/projects/list/` endpoint timed out identically. Still blocked after ~20 minutes of retries.
  - **Not started, waiting on the block to clear**: the raw Zod schemas + `client.ts` normalizers for these 3 endpoints. Deliberately not written from guesswork — every other `Raw*` type in `chainbroker/types.ts` carries a "confirmed against GET ..." comment, and coding these blind risks a full rewrite once the real field names are seen. **Migration `012` has NOT been applied to production yet** — apply it only once the ingestion code that populates the new columns is ready, so it doesn't sit live-but-unused.
  - **To resume**: retry `curl https://api.chainbroker.io/api/v1/projects/list/?page=1`; once it responds, fetch and record real samples for the 3 new endpoints in `SOURCE.md` (same as every other endpoint there), then implement the Raw* schemas, client.ts normalizers, provider interface methods, an ingestion/sync job (mirroring `src/sync/chainbroker/syncFundingRounds.ts`'s shape), wire the metrics-gap-fill into `src/ingestion/metrics/`, apply migration 012, and add the Home UI section.
- [ ] **Next: watchlist experience** — watchlist rows currently show name only (store has no score/price); enrich rows with live score + 24h change fetched by slug, or add swipe-to-remove + reorder polish
- [ ] Search polish — highlight matched substring in results; richer result rows
- [ ] Rankings polish — rank movement indicators (▲/▼ vs previous week) if `weekly_rankings_mv` exposes prior rank
- [ ] Home hero moment — animated score count-up on Weekly Pick cards

---

## Feature Backlog

| Priority | Feature | Status | Depends On |
|---|---|---|---|
| P0 | Home Trending Projects tab — real data | ✅ Done 2026-07-03 | `weeklyPicks` already in home response |
| P0 | Home Trending Funds tab — real data | ✅ Done 2026-07-03 | `topFunds` already in home response |
| P0 | `vercel.json` + env var documentation | ✅ Done 2026-07-03 | `vercel.json` at repo root; `docs/engineering/18_DEPLOYMENT.md` |
| P0 | Scheduled ingestion (cron) | ✅ Done 2026-07-03 | `src/app/api/cron/sync/route.ts`; daily 02:00 UTC via `vercel.json` |
| P1 | Home Top Gainers — real data | ✅ Done 2026-07-03 | New `getTopGainers` dashboard query (`project_metrics.price_change_24h DESC`) |
| P1 | Home Recently Added — real data | ✅ Done 2026-07-03 | `projects.created_at` confirmed; `getRecentlyAdded` added |
| P1 | Error monitoring (Sentry) | Not started | Nothing |
| P1 | Redis rate limiter (Upstash) for multi-replica | Not started | Upstash account |
| P1 | Health check endpoint | ✅ Done 2026-07-03 | Route `src/app/api/health/route.ts`; proxy bypass in `src/proxy.ts` |
| P2 | Home Market Overview — real data | ✅ Done 2026-07-04 | `getMarketOverview` in `src/dashboard/home.ts`; `MarketOverviewDto` + `MarketOverviewAssetDto` in types.ts |
| P2 | Home Fear & Greed — real data | ✅ Done 2026-07-04 | `src/providers/feargreed/client.ts` → `src/api/fear-greed.ts` → `GET /api/fear-greed` (revalidate 1h); fetched in parallel inside `fetchHomeData` |
| P2 | `funding_investors.is_lead` DB column | Not started | DB migration + ChainBroker re-ingest |
| P2 | Lead investor display on funding rounds | Not started | `funding_investors.is_lead` |
| P2 | `projects.chain` DB column | Not started | DB migration + ChainBroker re-ingest |
| P2 | Blockchain tag on project hero | Not started | `projects.chain` |
| P2 | Pagination UI | ✅ Done 2026-07-04 | `<LoadMoreButton>` in shared; `apiFetchPaginated` in client.ts; page-based load more for Markets projects + Search projects/funds |
| P3 | Telegram user identity persistence | Not started | Nothing |
| P3 | Server-side watchlist/favorites sync | Not started | Auth (Phase 7) |
| P3 | Unlock alert push notifications | Not started | Telegram Bot API + auth |
| P3 | Real-time price updates | Not started | CoinGecko polling or WebSocket |
| P3 | Markets Platforms tab — real data or remove | ✅ Removed 2026-07-04 | No backend DTO; `MarketsTab` narrowed; `platforms` field dropped from data layer; `PlatformRowCard` removed from markets page |
| P3 | Markets filter bar — real filtering | ✅ Removed 2026-07-04 | No filter support in `weekly_rankings_mv`; `activeFilterKey` state + `FilterBar` removed from markets page and store |
| P4 | Landing page | Not started | Nothing |
| P4 | Analytics | Not started | Nothing |
| P4 | Telegram share card | Not started | Telegram Bot API |
| P4 | Onboarding flow | Not started | Nothing |
| P4 | Risk level thresholds in scoring engine | Not started | Score engine + DB migration |

---

## Technical Backlog

Items that affect correctness, reliability, security, or production stability.

| ID | Issue | Impact | File | Effort |
|---|---|---|---|---|
| T-001 | In-process rate limiter does not coordinate across Vercel replicas | Correctness under multi-replica scale | `src/proxy.ts` | Replace `Map` with Upstash Redis |
| ~~T-002~~ | ~~No scheduled ingestion — data freshness is 100% manual~~ | ~~Reliability (stale rankings mislead users)~~ | ✅ Cron was already live (`vercel crons ls` confirmed, daily 02:00 UTC) but silently never worked — `src/cli/*.ts` never loaded `.env` and `sync:scores`'s `.in()` query broke past ~200 funding rounds; both fixed 2026-07-06, full pipeline now runs correctly | — |
| T-008 | CoinGecko metrics match only ~58% of projects (1,300/2,251) — identity resolution matches exact slug/symbol/name only, no manual alias table populated, no contract-address matching wired for CoinGecko | Data completeness (many projects show "—" for market cap/price/24h that a better match would resolve) | `src/identity/` | Populate manual override table for known mismatches, or add contract-address matching |
| T-003 | No error monitoring — production failures are invisible | Reliability | None | Add Sentry (or equivalent) |
| ~~T-004~~ | ~~`vercel.json` does not exist — deployment is undocumented~~ | ~~Production stability~~ | ✅ Done 2026-07-03 — `vercel.json` + `docs/engineering/18_DEPLOYMENT.md` | — |
| T-005 | `id === name` in entity stores — if a project name changes, stored watchlist key becomes orphaned | Correctness | `src/store/lib/create-entity-collection-store.ts` | Store real DB UUID as `id`; migrate local storage |
| ~~T-006~~ | ~~No GET /api/health endpoint — load balancer cannot confirm app is alive~~ | ~~Production stability~~ | ✅ Done 2026-07-03 — `src/app/api/health/route.ts` | — |
| ~~T-007~~ | ~~`project_metrics` rows may be absent for newly ingested projects — Markets Projects tab honest-drops these rows, showing fewer items than the ranking MV contains~~ | ~~UX correctness~~ | ✅ Fixed 2026-07-06 — see Phase 10 below | — |

---

## Definition of MVP

Everything required before a public demo (inviting real users for the first time):

- [x] All home sections show real data — no mock values visible to users; Trending Platforms tab removed (no real source); all remaining sections wired to real API (2026-07-04)
- [x] Scheduled ingestion running — Vercel Cron at 02:00 UTC via `vercel.json` (2026-07-03)
- [x] `vercel.json` created — app can be deployed repeatably to Vercel (2026-07-03)
- [x] All required env vars documented — `docs/engineering/18_DEPLOYMENT.md` (2026-07-03)
- [ ] Error monitoring active — failures are observable
- [x] Build passes (`npm run build`) with zero TypeScript errors — verified every session
- [x] All integration tests pass — 25/25 green post-Phase-3 cleanup (2026-07-04)
- [x] Rate limiting active (60 req/min per IP)
- [x] Telegram initData verification active in production
- [x] Project detail page functional with real data
- [x] Fund detail page functional with real data
- [x] Search functional with real data
- [x] Watchlist functional (device-local)

---

## Definition of Production Ready

Everything required before a public launch (open to all Telegram users):

- [ ] Everything in MVP definition above
- [ ] Redis-backed rate limiting (multi-replica safe)
- [ ] DB schema extensions: `funding_investors.is_lead`, `projects.chain` (data completeness)
- [ ] Server-side watchlist/favorites sync (data survives device change)
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Ingestion failure alerting (PagerDuty, email, or Telegram bot)
- [ ] Load tested under realistic concurrency (Telegram Mini App can spike hard on launch)
- [ ] All integration tests passing on CI (not just locally)
- [ ] Privacy policy and terms of service (Telegram Mini App store requirement)

---

## Session Rules

Future AI agents and engineers MUST follow these rules:

1. **ROADMAP.md is the source of truth.** Start every session by reading this file.
2. **Never perform a repository-wide audit** unless the production build fails.
3. **Always implement the first unchecked item** in the highest-priority Feature Backlog row that is currently unblocked.
4. **Ignore cosmetic refactors** — variable naming, comment wording, folder structure.
5. **Ignore non-blocking technical debt** — only fix items in the Technical Backlog that block the current feature.
6. **Only fix bugs that block the current feature** being implemented this session.
7. **Verify the production build** (`npm run build` + `npm test`) after every session.
8. **Update ROADMAP.md** at the end of every session — mark completed items, update Current Status.
9. **Update `docs/engineering/`** only if the architecture, schema, or API surface changed.
10. **Stop after one logical unit of work** — one feature or one Technical Backlog item per session.

---

## Progress Metrics

| Metric | Value |
|---|---|
| Phase 1 — Foundation | ✅ Complete (12/12) |
| Phase 2 — Core Screens | ✅ Complete (11/11) |
| Phase 3 — Real Data Everywhere | ✅ Complete (17/17) |
| Phase 4 — Production Infrastructure | 🔄 3/5 complete (60%) |
| Phase 5 — Automated Ingestion | ✅ Complete (3/3) |
| Phase 6 — DB Schema Extensions | ⬜ 0/6 |
| Phase 7 — Auth & Cross-Device Sync | ⬜ 0/5 |
| Phase 8 — Real-Time & Notifications | ⬜ 0/4 |
| Phase 9 — Growth & Discovery | 🔄 1/5 complete (20%) |
| **Total milestones** | **39/68 complete (57%)** |
| **MVP completion** | Phases 3 + 4 + 5 required — est. **6–10 sessions** |
| **Production completion** | All phases — est. **25–35 sessions** |

---

## Next Task

**Landing page for non-Telegram users (Phase 9).**

**Why this is the highest-priority unblocked task:**
Integration tests verified (25/25 green). The only open MVP gate is error monitoring
(requires a Sentry account — blocked externally). Phase 9 landing page has no external
dependencies and is the next unblocked milestone item. Currently `/` inside the Next.js
app routes to the Home tab — non-Telegram users who click a shared link see a blank or
broken page. A static marketing page satisfies the Phase 9 requirement and improves the
app's first impression for potential users.

**What to build:**

A static Next.js page at the existing `src/app/page.tsx` (or a new route if `/` is taken
by the tab layout — verify first). The page should:

1. Show the app name, a one-sentence value proposition, and key feature highlights
2. Include a prominent "Open in Telegram" CTA button (link to the Telegram Mini App URL)
3. Work without JavaScript (static export / SSG) — it is a marketing page
4. Match the existing design system (Tailwind tokens, dark/light theme via `prefers-color-scheme`)
5. NOT require Telegram `initData` — it is visible outside Telegram

**Files to read first:**

- `src/app/(tabs)/layout.tsx` — understand the tab route group so you know whether `/`
  is already claimed by the tab shell or has its own route
- `src/app/about/page.tsx` — a working example of a static page in this codebase; use
  the same layout/styling conventions
- `src/lib/theme/index.ts` (or equivalent) — available typography/spacing tokens

**Files to create/change:**

- If `/` is free (not captured by the `(tabs)` group): create `src/app/page.tsx`
- If `/` is captured by the tab shell: the landing page may need a dedicated `/landing`
  or `/welcome` route, or the tab group must be narrowed to exclude `/` (read the layout
  first to decide)

**Telegram Mini App URL:** Set the CTA href to the Telegram deep link. Since the actual
Bot username is not in the codebase, use a placeholder: `https://t.me/YourBotUsername`.
Leave a `TODO` comment so the operator can swap in the real bot name at deploy time.

After implementation, verify `npm run build` and `npm test` pass, then update this file.
