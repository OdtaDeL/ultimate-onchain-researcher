# Design Decision Log
**Product:** Ultimate Onchain Researcher — Telegram Mini App
**Document type:** Design rationale and risk register
**Status:** Design only. No implementation.
**References:** HOME_SCREEN_SPEC.md, NAVIGATION_SPEC.md, INTERACTION_SPEC.md, LAYOUT_SPEC.md, DESIGN_SYSTEM.md

---

## Purpose

This document records every major design decision made during the Home screen specification, explains why each decision was made, what the alternatives were, and what risks exist. It is intended to be read before implementation begins — not after.

---

## 1. Major Design Decisions

### D-01: Weekly Picks above the fold — always

**Decision:** The Weekly Picks carousel must be fully visible without any scrolling, even on the smallest supported viewport (360px).

**Reasoning:** The product's primary value proposition is "answer what to research today in under 5 seconds." If the user must scroll before they reach the curated picks, the product fails this promise on first visit. Everything above the fold (Search Bar, Market Overview Card, Section Header) exists to orient the user contextually before the curated signal lands.

**Viewport math verification:** Header (56px) + Search (44px + 16px gap) + Market Card (168px + 24px gap) + Section Header (34px + 12px gap) + Carousel (180px) = 534px. The usable scroll viewport on the smallest device (360px wide, ~680px usable height after Telegram chrome and bottom nav) = 604px. 534 < 604. Confirmed fits.

**Alternative considered:** Place Market Overview Card below Weekly Picks (Score first, context second). Rejected — traders check macro context (BTC/ETH) before interpreting individual project signals. Without macro context, a "Score: 78" on a project means nothing if the whole market is in extreme fear.

**Risk:** If Market Overview Card ever needs to grow beyond 168px (e.g., additional asset added), the fold math breaks. Solution: the card's composition is fixed (COMPONENT_SPEC Rule: "never add a 4th coin"). If market context must expand, it opens in a Bottom Sheet, not inline.

---

### D-02: Fear & Greed embedded in Market Overview Card, not standalone

**Decision:** Fear & Greed lives in the lower-right cell of the Market Overview Card, not as a separate card or section.

**Reasoning:** Fear & Greed is macro market context — the same category of information as BTC/ETH/BNB prices and Total Market Cap. Separating it would create two cards for the same question ("what's the market doing?") instead of one unified answer. The 2-column bottom row of the card (Total Mkt Cap left, F&G right) creates a natural left-to-right reading of "how big is the market → how is the market feeling."

**Alternative considered:** A standalone Fear & Greed card with a gauge visualization. Rejected because: (a) a gauge requires ~100px of height we don't have, (b) the inline color-coded number communicates the same information at 0 extra height cost, and (c) a second card would push Weekly Picks below the fold (breaking D-01).

**Alternative considered:** Fear & Greed shown in the header/ticker area. Rejected — the header is navigation chrome, not data. The header contains identity (greeting) and alert access (bell), never market data.

**Risk:** Low. The color-coded F&G display is well-understood in the crypto context (the F&G index has a standard visual language). The ⓘ tooltip provides an explanation for users unfamiliar with it.

---

### D-03: Trending is on Home, not only on Markets

**Decision:** Trending Projects, Trending Funds, and Trending Platforms appear on Home (below the fold) AND on the Markets tab.

**Reasoning:** The brief explicitly asked for Trending on Home. Active traders check trending as part of their daily orientation ritual — it answers "what's moving today?" which is complementary to Weekly Picks ("what's worth researching this week?"). Removing it from Home would force traders to leave the main screen to answer a daily question.

**Implementation clarification:** Trending on Home is a preview (3–5 cards, free-scroll, "See all" link to Markets). Trending on Markets is the full version with all filters. The same data, different depth.

**Alternative considered:** Replace Trending with a different section (Top Losers, or more Weekly Picks). Rejected — Top Gainers already handles directional signals; Trending captures social/search momentum which is a different signal. Weekly Picks is limited to a finite, curated set — more slots would dilute the curation.

**Risk:** Medium. Adding Trending to Home pushes Top Gainers, Recent Fundraises, Recently Added, and Unlock Alerts further down the screen. If a trader primarily values Trending over Top Gainers, they may prefer Trending to appear earlier. The order (Trending → Top Gainers → Feed Cards) follows the DESIGN_SYSTEM's "Verdict before Evidence before Exploration" hierarchy: Trending is higher-signal market intelligence than granular lists.

**Recommendation:** A/B test the section order in a future iteration. The current order (Trending before Top Gainers) is the design-system-compliant default.

---

### D-04: Watchlist Summary on Home — conditional, no empty state

**Decision:** Watchlist Summary appears on Home only when the user has watchlist items. It is hidden entirely for new users. No empty state message is shown in its place.

**Reasoning:** A new user's first Home experience should not emphasize what they haven't done yet (add to watchlist). The product's first impression should be its value (curated research signals), not an onboarding checklist. The Watchlist tab's own empty state ("Your watchlist is empty, browse Weekly Picks") is the correct location for that guidance — when the user explicitly navigates to Watchlist intending to use it.

**Alternative considered:** Show an empty state for Watchlist Summary that says "Add projects to get personalized updates here." Rejected — it draws attention to a missing feature rather than delivering value. It makes the Home screen feel incomplete rather than purposefully curated.

**Alternative considered:** Always show Watchlist Summary with a "Start watching" CTA. Rejected — it would push Trending content below the fold for returning users who do have watchlist items.

**Risk:** Low. New users may not discover that Home has a Watchlist Summary section until they've added items. This is acceptable because the Watchlist tab's empty state provides the onboarding path, and the Home section appears automatically once items are added.

---

### D-05: No Score in Search Results

**Decision:** Search Result Cards show name + logo + optional category tag only. No Score, no price.

**Reasoning:** Search is retrieval (find the thing I'm looking for), not curation (here's what's worth researching). Showing a Score on a Search result card conflates these two modes and would encourage users to use Search as a discovery/ranking tool, which is the Weekly Picks section's job. A user searching for "Aave" wants to find Aave, not evaluate whether Aave is worth looking at — they already decided it was.

**Additionally:** Score in Search results would reward high-Score projects in retrieval, creating a systematic bias where lower-scored projects are harder to find despite being the exact thing a user searched for.

**Alternative considered:** Show a compact Score indicator (the grade letter only, no number). Rejected — even a grade letter shifts the user's attention from "is this the right result?" to "is this a good score?" before they've navigated to the detail page.

**Risk:** Low. This decision has strong precedent (Google Search doesn't show PageRank scores). Users who want Score information will get it immediately on Project Detail, which is one tap away.

---

### D-06: No Sorting Controls on Home

**Decision:** The Home screen has no sorting or filtering controls. The composition is editorially fixed.

**Reasoning:** Home answers "what should I research today?" — a question with an opinionated, curated answer, not a user-controlled one. The product's credibility comes from the quality of the curation, not from giving users a sorting handle. A sort control would imply "you can reorder this according to your own judgment" — which contradicts the product's positioning as a "research desk that has a point of view."

**Markets** is the screen for browsing and filtering. Users who want to sort by 24h gain go to Markets → Top Gainers. Users who want to explore by category go to Markets → Trending Platforms. Home does not need to duplicate these functions.

**Alternative considered:** Add a "Sort by: Score / Trending / New" segment control to Weekly Picks. Rejected — Weekly Picks is already sorted by editorial Score rank (#1 is the highest recommendation). Re-sorting by "Trending" would show a different, algorithmically-ordered list, which is Markets' job.

**Risk:** Medium. Some traders may want to prioritize Unlock Alerts over Top Gainers in their daily review. The fixed order may not match every user's workflow. Mitigation: the Watchlist Summary section provides personalization (it shows their specific tracked items), and the section order can be revisited in v2 if user research reveals strong preferences.

---

### D-07: Market Feed Cards (3-item limit per feed category)

**Decision:** Each Market Feed Card (Recent Fundraises, Recently Added, Unlock Alerts) shows exactly 3 rows. No "expand in place" option. "See all" navigates to a full list.

**Reasoning:** The Home screen is a "today's briefing" overview, not a full research session. 3 items per category is enough to capture attention and signal "there is relevant activity in this category." More than 3 would make Home feel like Markets, defeating the purpose of having two separate screens.

**DESIGN_SYSTEM Rule 46** states: "A maximum of 3 Stat values may appear inline within any single compact card." The 3-item limit for feed cards follows the same principle — density is controlled to preserve scanability.

**Alternative considered:** Show 5 items per feed card with a "show less" collapse. Rejected — it implies a default-expanded state, which contradicts the "depth on demand" principle.

**Alternative considered:** Show items as horizontal mini-chips instead of rows. Rejected — fundraise/unlock data requires at least 2 lines of context (project + amount or project + date) to be actionable; chips are too compact for this.

**Risk:** Low. 3 items is a well-established "preview list" convention used by Binance, CoinMarketCap, and most crypto dashboards in their home-screen feed cards.

---

### D-08: Single horizontal scroller per Trending sub-category (not a segmented carousel)

**Decision:** Trending Projects, Trending Funds, and Trending Platforms are three separate horizontal carousels, each with its own Section Header. They are NOT combined into a single carousel with a Segment Control to switch between them.

**Reasoning:** A Segment Control above a carousel creates an interaction conflict — the user's natural gesture for scrolling the carousel (horizontal swipe) is the same gesture used to switch segments on many mobile platforms. Additionally, a tabbed carousel hides 2/3 of the trending content at all times, making the page feel less comprehensive.

**Three separate scrollers** allow the user to scan all three categories at once during a single vertical scroll, making the Trending section a true "what's moving everywhere today" overview.

**Alternative considered:** Single "TRENDING" section with Project/Fund/Platform as tabs. Rejected — hides two categories, creates gesture conflict, reduces information density on a screen that benefits from showing multiple signals.

**Risk:** Low-medium. Three separate scrollers add approximately 400px of vertical height to the Home screen. If real-world usage shows that users rarely scroll past Weekly Picks to reach Trending, the three scrollers should be collapsed into a single tabbed view in v2 to reclaim that space.

---

### D-09: No live auto-scrolling market ticker

**Decision:** The Market Overview Card does not auto-scroll or animate values on a sub-second cadence. Live updates fire only when new data arrives from the server.

**Reasoning:** Telegram Mini Apps run in WebViews. A sub-second animation loop (like a live ticker) continuously triggers paint cycles, drains battery, and on lower-end Android devices causes scroll jank on the entire page. The cognitive value of watching a price move from $67,420 to $67,423 in real time is near-zero for a research product — traders who need tick-level data use dedicated trading terminals.

**The color-flash animation** (200ms transition when a value changes) provides sufficient "this data is live" feedback without a continuous animation loop.

**Alternative considered:** Polling every 10 seconds, animating all changed values. Acceptable — but still causes unnecessary repaints. Preferred: WebSocket or Server-Sent Events, only animating values that actually changed (not a full card redraw).

**Risk:** Medium. Users accustomed to Binance's live ticker may perceive this product as "less live." Mitigation: the color-flash animation is visually obvious when a value updates. The "live" indicator in the header (if implemented — see Recommendations section) would also signal data freshness.

---

### D-10: Fund entities visually distinct from Project entities everywhere

**Decision:** Fund entities never display a Score Circle, never show a Trend Arrow (24h %, which is a token price signal), and always show portfolio count / avg investor quality instead.

**Reasoning:** Funds are investors, not investable assets. Applying price-direction signals (Trend Arrows, % change) to funds is a category error — funds don't have token prices. Applying a Score Circle to funds would imply a research judgment comparable to project scores, when the scoring methodology is different.

**This distinction is enforced at the component level** (Fund Logo primitive, Fund Card specification, DESIGN_SYSTEM Rule 16, Anti-pattern 29) — not just a styling guideline.

**Risk:** Low. This is a well-justified semantic distinction. The implementation risk is that developers may see "a 140×120px card for Project" and a "140×120px card for Fund" and assume they can use the same component with different data. The component names (Token Logo vs Fund Logo, Score Circle vs portfolio count row) must be kept distinct to prevent this.

---

## 2. Rejected Patterns and Why

| Pattern | Why Rejected |
|---|---|
| **Desktop-style sidebar navigation** | Wrong platform. Telegram Mini Apps are mobile-only. |
| **Drag-to-reorder on Home sections** | Contradicts the editorial curation model. Home is opinionated, not user-configurable. |
| **Infinite scroll on Home** | Home has a finite "today's briefing" answer. An endless feed contradicts the product thesis. |
| **Charts as primary Home content** | Chart visualization is exploration-tier (one tap deeper). Home shows verdicts and signals, not charting. |
| **"Compare projects" feature on Home** | Comparison requires multi-select and a comparison view — this is a future feature, not an MVP concern. |
| **Category color-coding** (DeFi blue, L2 purple) | Creates a competing color system against Score/risk semantics. Prohibited by DESIGN_SYSTEM Rule 17. |
| **Score in search results** | Conflates retrieval (Search) with curation (Home) — see D-05. |
| **Hover-based tooltips** | No mouse in a WebView. Tap-to-reveal is the only valid tooltip trigger. |
| **Multi-step filter panel on Home** | Home has no user-configurable sorting — see D-06. |
| **Table layout for Top Gainers** | Tables are prohibited on mobile (DESIGN_SYSTEM Rule 4, Anti-pattern 1). Restructured as list rows. |

---

## 3. Risks Register

| ID | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| R-01 | **Scroll length feels too long** for users who primarily want Top Gainers or Fundraises (sections near the bottom) | Medium | Medium | Monitor scroll depth analytics in v1. If users rarely reach Fundraises, consider reordering or removing low-engagement sections. |
| R-02 | **Weekly Picks data latency** — if the scoring engine (Phase 2+) is slow to compute, the Weekly Picks section may show skeletons for a long time | High | Medium | Implement server-side caching of Weekly Picks data (computed once per week, not per request). The Home screen should receive pre-computed picks, not trigger computation on load. |
| R-03 | **Telegram WebApp API compatibility** for haptic feedback — not all Telegram clients on all platforms support `HapticFeedback` | Low | Low | Haptics are enhancement, not required functionality. Degrade gracefully: if API is unavailable, skip haptic silently. |
| R-04 | **Fear & Greed API reliability** — if the F&G index source is unavailable, the Market Overview Card's bottom row fails | Low | Medium | Show "—" for F&G value with muted styling when unavailable. Coin prices in the top row remain visible (different API source). The card never goes fully blank. |
| R-05 | **Watchlist state sync** — user adds to Watchlist on Project Detail, returns to Home; Watchlist Summary on Home shows stale data (doesn't include new addition) | Medium | High | Home's Watchlist Summary should read from the same local state store as the Watchlist tab. When Watchlist tab state changes, Home's summary re-derives immediately from the same source. |
| R-06 | **ChainBroker data gaps** — recently added projects may have insufficient data for any Score calculation; showing "Score: 0" or "Score: N/A" on these projects in any context looks broken | Medium | High | Recently Added Cards never show a Score (enforced by COMPONENT_SPEC). This risk only exists if another section (e.g. Trending) surfaces a recently-added project before it has a Score. Mitigation: Trending sections use Score Circle's skeleton/no-data state ("—" numeral, neutral ring) when Score is unavailable. |
| R-07 | **Telegram Mini App height variability** — different Telegram versions and devices report different available heights; the viewport math in this spec assumes 750px which may not be reliable | High | Medium | Implement viewport height detection (`window.innerHeight`) at runtime. If the height is < 680px (unusual, very small screen), consider hiding the Watchlist Summary section by default to preserve the Weekly Picks above-fold guarantee. |
| R-08 | **Fund Card visual ambiguity** — users may confuse Fund Cards and Project Cards if the visual distinction (no Score Circle on Fund Cards) is subtle | Low | Low | Fund Cards use Fund Logo primitive (not Token Logo). The portfolio count row (where Score Circle would be) is visually distinct. The product only has two entity types — users will learn this distinction quickly. |
| R-09 | **Pull-to-refresh conflict with Telegram's own swipe gestures** | Medium | Low | Telegram Mini Apps have configurable `isClosingConfirmationEnabled` and `isVerticalSwipesEnabled` flags. Ensure vertical swipes are enabled (they are by default) and pull-to-refresh does not conflict with Telegram's own downward-swipe-to-close behavior. Test on both iOS and Android Telegram clients specifically. |
| R-10 | **No Fear & Greed data source exists anywhere in the repo** (verified by exhaustive grep across `src/` and `supabase/` — zero matches) | High | Certain | A new provider is required (e.g. alternative.me's Fear & Greed API, which is free and unauthenticated) following the exact `src/providers/<name>/` pattern already established by `coingecko`/`defillama`. This is genuinely unbuilt — not a documentation staleness issue. |
| R-11 | **No Watchlist system exists anywhere in the repo** (no table, no API, no dashboard function — verified by grep) | Critical | Certain | Watchlist Summary (Home) and the entire Watchlist tab cannot be implemented without this. Requires: (a) a `users` table or equivalent Telegram-identity table — none exists today, `src/identity/` is project-identity matching, not user accounts; (b) a `watchlist_items` join table; (c) dashboard + API functions. This is the single largest genuine backend gap blocking personalization-dependent sections of Home. |
| R-12 | **No Top Gainers, Trending Funds, or Trending Platforms data path exists** (verified by grep — zero matches for "gainer"; "trending" only appears inside the CoinGecko provider's coin-trending capability) | Medium | Certain | Top Gainers is buildable today from existing `project_metrics.price_change_24h_percent` (just needs a dashboard function that sorts/limits). Trending Funds/Platforms have no backing data model at all — funds and chains have no momentum/activity signal computed anywhere in this codebase. |

---

## 4. Recommendations Before Implementation

**Correction (verified by repository inspection, not documentation):** SYSTEM_ARCHITECTURE.md states the Scoring Engine and REST API are "planned, Phase 2+, not built." This is stale. Both exist and are functional:

- `src/scoring/score-engine.ts` — full 7-component scoring pipeline (funding, investor, market, tvl, revenue, unlock, momentum), weighted aggregation, grading, plain-language explanations. Pure functions, no I/O.
- `src/scoring-sync/` — writes computed scores to the database, refreshes materialized views.
- `src/api/` — `handleGetHome`, `handleGetProject`, `handleGetFund`, `handleGetSearch`, `handleGetWeeklyRankings`, `handleGetMonthlyRankings`. Has an `openapi.yaml` and tests (`src/api/__tests__/`). Framework-agnostic Fetch API `Request`/`Response` handlers — not yet mounted on an actual HTTP server, but that's a thin-wiring task (mirrors how `src/cli/` sits thinly on top of `src/sync/`), not a missing subsystem.
- `src/dashboard/` — the Dashboard Query Layer. `getWeeklyPicks`, `getMonthlyPicks`, `getTopFunds`, `getNewFunding`, `getUnlockAlerts` already return frontend-ready DTOs backed by real materialized views (`weekly_rankings_mv`, `monthly_rankings_mv`, `top_funds`, `top_projects`).

**Do not propose building these.** Treat them as the foundation to build the Home screen UI on top of.

### 4.1 Genuine prerequisite: Fear & Greed Index

**Verified gap.** Zero references to "fear" or "greed" anywhere in `src/` or `supabase/`. No provider, no table, no mapper.

**Recommended approach:** Add a new provider folder, `src/providers/feargreed/` (or similar), following the exact pattern already established by `src/providers/coingecko/` and `src/providers/defillama/` (SOURCE.md investigation first, then types/schemas/errors/client/provider). The alternative.me Fear & Greed API is free, unauthenticated, and widely used for this exact purpose — but per DEVELOPER_GUIDE.md's "investigate before writing code" rule, this still needs its own SOURCE.md written from live requests, not assumed from prior knowledge of the API.

This is the one Market Overview Card field that cannot be staged from existing code. The other four (BTC, ETH, BNB, Total Market Cap) are reachable through the already-built CoinGecko provider's `getGlobalMarket()` and `listCoinsMarkets()` — see 4.2.

### 4.2 Genuine prerequisite: Watchlist + user identity

**Verified gap — the largest one.** No `users` table, no Telegram-identity table, no `watchlist_items` table, no watchlist API or dashboard function exists anywhere in the schema or codebase. `src/identity/` is unrelated — it resolves *project* identity across providers (ChainBroker/CoinGecko/DefiLlama row reconciliation), not end-user accounts.

**This blocks:** Home's Watchlist Summary section, the entire Watchlist tab, and the Notification Dot badge logic on the bottom nav.

**Recommended approach:**
1. A new migration adding a `users` (or `telegram_users`) table — keyed by Telegram user ID, following the standard RLS pattern from DEVELOPER_GUIDE.md (or a documented metadata-style exception if this table is treated as account infrastructure rather than public content).
2. A `watchlist_items` join table (`user_id`, `project_id` or `fund_id`, `created_at`), with a real unique constraint on `(user_id, project_id)`.
3. A `src/dashboard/watchlist.ts` following the existing Dashboard Query Layer pattern (read-only, frontend-ready DTOs).
4. `src/api/watchlist.ts` handlers (`GET`/`POST`/`DELETE`) following the existing `src/api/` pattern.

This is genuinely unbuilt — it is not a case of the documentation lagging behind the code, the way the Scoring Engine and REST API were.

### 4.3 Genuine prerequisite: Top Gainers, Trending Funds, Trending Platforms

**Top Gainers** is the smallest gap: `project_metrics.price_change_24h_percent` already exists in the schema and is already surfaced via `ProjectMetricsDto`. What's missing is a dashboard function that queries `project_metrics` ordered by that column, limited to N rows. This can be built directly on existing tables — no new provider, no new migration likely needed (verify `project_metrics` has a usable index on that column before assuming zero-migration).

**Trending Funds** and **Trending Platforms** are not buildable from existing data at all — there is no momentum/activity signal computed for funds or chains anywhere in this codebase (CoinGecko's `getTrendingCoins()` only covers coins/projects). These would need new scoring logic or a new provider signal before a dashboard function could expose them. Recommend scoping these as a separate, later task rather than blocking the rest of Home on them — the Home spec already treats each Trending sub-section as independently loading (INTERACTION_SPEC.md Section 5.1), so Trending Projects can ship while Trending Funds/Platforms remain a Section-level "unavailable" state.

### 4.4 Wiring task (not a missing subsystem): Market Overview dashboard function

The CoinGecko provider already exposes `getGlobalMarket()` (total market cap, BTC/ETH dominance) and `listCoinsMarkets()` (per-coin price + 24h%). What's missing is a `src/dashboard/home.ts`-style function (e.g. `getMarketOverview`) that calls these and assembles the Market Overview Card's shape — plus, once 4.1 lands, the Fear & Greed value. This is a thin aggregation task on top of existing provider code, not new infrastructure.

### 4.5 Updated data endpoint reality check

| Section | Data needed | Actual status (verified) |
|---|---|---|
| Market Overview (BTC/ETH/BNB, Mkt Cap) | Price + 24h%, Total Market Cap | CoinGecko provider methods exist (`getGlobalMarket`, `listCoinsMarkets`); dashboard wiring missing (4.4) |
| Market Overview (Fear & Greed) | Index value + band | Fully unbuilt — no provider exists (4.1) |
| Weekly Picks | Score + Grade + Funding Quality + TVL + Unlock Risk | **Built.** `getWeeklyPicks` (`src/dashboard/home.ts`) reads `weekly_rankings_mv` |
| Trending Projects | Momentum-ranked projects | `top_projects` materialized view exists with `momentum_score`/`rank` (migration 008); no dashboard function exposes it yet — small wiring gap, not a data gap |
| Trending Funds | Fund activity signal | Unbuilt, no backing data model (4.3) |
| Trending Platforms | Chain activity signal | Unbuilt, no backing data model (4.3) |
| Watchlist Summary | User's tracked items + price + score | Unbuilt — blocked on user identity + watchlist tables (4.2) |
| Top Gainers | Top N by 24h% | Data exists in `project_metrics`; dashboard function missing (4.3) |
| Recent Fundraises | Fundraises + amount + date | **Built.** `getNewFunding` (`src/dashboard/home.ts`) |
| Recently Added | Recently added projects | Buildable from `projects.created_at`; no dedicated dashboard function seen — verify before assuming a gap |
| Unlock Alerts | Upcoming unlocks | **Built.** `getUnlockAlerts` (`src/dashboard/home.ts`) |

### 4.6 Recommendation: Load Priority Contract

Before implementation, establish a load priority contract between the frontend and backend:

- **Priority 1 (must be fast, < 500ms):** Market Overview Card, Weekly Picks skeleton structure
- **Priority 2 (< 1s):** Trending sections, Watchlist Summary
- **Priority 3 (< 2s acceptable):** Top Gainers, Market Feed Cards

If the backend cannot meet these SLAs, the UX spec's independent-section loading model (each section loads independently, no section blocks another) still provides a reasonable experience — users see fast sections quickly and slower sections after a brief skeleton period.

### 4.7 Recommendation: Offline Cache Strategy

Implement a local cache (AsyncStorage or equivalent) for:
- Last known Weekly Picks (invalidates after 7 days — picks refresh weekly)
- Last known Market Overview values (invalidates after 15 minutes)
- Last known Trending data (invalidates after 4 hours)
- User's Watchlist (always keep locally; sync with server)
- Recent Searches (indefinitely, local only)

This ensures the Home screen is useful even on a slow or interrupted connection — the user sees recent data immediately, then data updates as the network responds.

### 4.8 Recommendation: Telegram Integration Points

Before implementation, verify these Telegram WebApp APIs:

1. **`Telegram.WebApp.initData`** — user identification (for Watchlist sync, Academy membership check)
2. **`Telegram.WebApp.HapticFeedback`** — haptic support (confirm availability per target platform)
3. **`Telegram.WebApp.MainButton`** — if any primary CTA is needed at the bottom (currently not planned for Home, but may be needed for onboarding flow)
4. **`Telegram.WebApp.BackButton`** — for Level 2 screen back navigation (must be wired to in-app back behavior, not just close the Mini App)
5. **`Telegram.WebApp.expand()`** — call on launch to ensure the Mini App fills the available screen height, not a default partial-height view

### 4.9 Recommendation: Performance Budget

Given the Telegram WebView environment:

| Metric | Target |
|---|---|
| Time to first meaningful content (Market Overview Card visible) | < 1.5s on 4G |
| Time to Weekly Picks visible | < 2s on 4G |
| Home screen initial JavaScript bundle | < 200KB (gzipped) |
| Scroll frame rate | 60fps (no jank during vertical scroll) |
| Carousel frame rate | 60fps (no jank during horizontal swipe) |
| Skeleton → Content transition | Zero layout shift (CLS = 0) |

The independent section loading model (Section 5.1 of INTERACTION_SPEC.md) is the primary tool for meeting the "first meaningful content < 1.5s" target — don't wait for all sections before rendering any section.

### 4.10 Recommendation: "See All" Sub-Screens

Before implementation, define the full list sub-screens for each "See all" link on Home:

| "See all" trigger | Destination screen | Contents |
|---|---|---|
| Weekly Picks "View All" | All Picks sub-screen | Full list of this week's scored projects, ranked |
| Trending Projects "See all" | Markets → Trending Projects | Full trending list with Score + 24h% |
| Trending Funds "See all" | Markets → Trending Funds | Full fund list |
| Trending Platforms "See all" | Markets → Trending Platforms | Full platform list |
| Watchlist "Manage ›" | Watchlist tab | Full Watchlist with Segment Control |
| Top Gainers "See all" | Markets → Top Gainers | Extended gainers list (30+ items, infinite scroll) |
| Recent Fundraises "See all" | Markets → Recent Fundraises | Full fundraise feed |
| Recently Added "See all" | Markets → Recently Added | Full recently-added list |
| Unlock Alerts "See all" | Markets → Unlock Calendar | Full calendar view |

These sub-screens are Level 2 screens (drill-in from Home) that reuse existing Markets screen sections. They are NOT new screen designs — they reuse the Markets Template composition with pre-applied filters. This must be specified explicitly to implementation, or developers may create redundant screen components.

---

## 5. Design Principles Applied (Summary Reference)

| Principle | Where applied on Home |
|---|---|
| **Verdict before data** | Weekly Picks: Score + Grade before Funding/TVL/Unlock. Market Overview: macro context before curation. |
| **One accent, used sparingly** | Accent color used only on: "View All" / "See all" links, active bottom nav icon, Search bar cursor. Nowhere else on Home. |
| **Depth on demand** | Every section shows a maximum of 3–5 items + "See all". No section renders its full content inline. |
| **Consistency over novelty** | Score Circle looks identical on Home (Weekly Pick Card), Project Detail, and Watchlist. One design, reused everywhere. |
| **Mobile-first, one-handed** | Weekly Picks carousel in the comfortable thumb zone. Bottom nav always accessible. No critical actions in the top 200px. |
| **Calm under load** | Independent section loading means no blank pages, no single blocking fetch. Content appears progressively. |
