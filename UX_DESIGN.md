# UX Research & Information Architecture — Crypto Research Mini App

*Analysis only — grounded in this project's actual backend capabilities: Weekly Picks, Monthly Rankings, Project Scores, Funding History, Top Funds, Unlock Alerts, Search, Market Metrics, Watchlist (planned), Notifications (planned).*

---

## 1. ChainBroker.io — UX Analysis

### Homepage hierarchy
ChainBroker's homepage is organized like a **research terminal**, not a consumer app:
1. A dense top-line ticker / stats bar (raises, funds active, etc.)
2. A large **funding rounds table** — rows of projects, raise amount, stage, investors, date
3. A **fund leaderboard** sidebar/section
4. Filters (by sector, by round stage, by chain) sitting prominently near the table
5. Everything is information-dense; very little whitespace

The implicit message of the homepage is **"here is all the data, slice it yourself."** It assumes the visitor already knows what a "seed round" or "lead investor" means and arrived with a specific question.

### Navigation
- Flat top navigation: Funding Rounds / Funds / Projects / Rankings / News
- Each section is its own large table-first page
- Filtering and sorting are the primary interaction, not browsing
- No concept of "today's highlight" — every visit looks the same regardless of what changed

### Strengths
- **Data completeness** — funding history, investor names, round stages all visible without clicking through
- **Filterable tables** are genuinely powerful for someone doing comparative research (e.g. "show me all seed rounds in DeFi this month")
- **Fund-centric view** (which funds back which projects) is a feature most consumer apps don't have at all — this is ChainBroker's real differentiator
- Information is *trustworthy-looking*: numbers, dates, sources — feels like a Bloomberg terminal for crypto VC

### Weaknesses
- **No prioritization** — a brand-new $2M pre-seed and a $200M Series B sit in the same visual weight unless you sort manually
- **No "what changed since I last visited"** — nothing decays or surfaces urgency
- **High cognitive load on first visit** — a new user has no idea where to start; there's no onboarding path, just a wall of tables
- **Desktop-table mental model** — columns, sortable headers, dense rows. This breaks down completely on a small mobile screen (truncation, horizontal scroll, tiny tap targets)
- **No personalization** — nothing remembers what you care about; every visit starts from zero

### What should NOT be copied
- **The table-first homepage.** Tables work because desktop users scan columns; on a one-handed mobile screen this becomes truncated text and horizontal scrolling — the single worst pattern for our target device.
- **"Everything visible, nothing prioritized."** Our brief is literally the opposite: *"what should I look at today"* not *"here is everything."*
- **Filter-heavy discovery.** Filters are a power-user tool. Academy members don't arrive with a query in mind ("show me Series A DeFi rounds in Q2") — they arrive wanting to be told something.
- **Assumed vocabulary.** ChainBroker never explains what a score, a tier, or a round stage means. For beginners this is a wall, not a feature.

**What *is* worth keeping (conceptually, not visually):** the fund-centric lens (top funds, who's backing what) and the depth of funding history per project — these are genuinely valuable data we have too (`Top Funds`, `Funding History`), they just need a beginner-friendly presentation layer on top.

---

## 2. Binance Mobile App — UX Analysis

### Information hierarchy
Binance's home screen is a **stack of purpose-built modules**, each answering one question, ordered by how often a typical user needs it:
1. Portfolio/balance snapshot (top, collapsible) — "how much do I have"
2. Quick actions row (Deposit / Trade / Earn / more) — large tap targets, icon + label
3. A horizontally-scrolling "discovery" carousel (promotions, new listings) — easily ignored, doesn't block the page
4. A market list (favorites/watchlist tab pre-selected) — "what's moving"
5. News/content feed at the very bottom

The hierarchy literally encodes priority: **personal data > common actions > discovery > passive content.**

### Discoverability
- Nothing important is more than one tap away from Home
- Search is a **persistent, always-visible affordance** (a search bar/icon docked at the top of Home and Markets, not buried in a menu)
- New/trending assets surface via small badges and a dedicated "hot" list rather than forcing users to browse the entire market list

### Quick actions
- A fixed row of 4–6 icon-buttons for the highest-frequency actions, always in the same position
- These are *verbs* (Buy, Trade, Earn), not destinations — they save a navigation step for the 80% case

### Watchlist experience
- Watchlist is the **default tab** inside Markets, not a separate buried feature — the assumption is "you already have favorites, show those first," with "All markets" as a secondary tab
- Adding to watchlist is a single tap (star icon) directly from any list row or detail page — no separate flow
- Empty watchlist state actively suggests what to add, rather than showing a blank screen

### Search experience
- Search opens to **recent searches + trending/popular** before the user types anything — it's never a blank input box
- Results appear instantly per keystroke, grouped by type (coins first, then other entities)
- Each result row carries just enough context (price, % change) to let you decide without leaving search

### Bottom navigation philosophy
- 4–5 destinations max, each a *noun* representing a top-level mode of use (Home, Markets, Trade, Wallet, more) — not a dumping ground
- The center or most-frequent item is visually emphasized
- Tapping a tab always returns to that tab's root (predictable "home" behavior), never deep state

**The core Binance lesson:** complexity is enormous under the hood (hundreds of trading pairs, derivatives, earn products), but the *home surface* is ruthlessly simplified into "what do I own, what can I do right now, what's worth knowing about today." Depth is one tap away, never on the surface.

---

## 3. Proposed Information Architecture

### Design thesis
Binance's **surface simplicity + action-first home** combined with ChainBroker's **research depth, one layer down**. The home screen answers "what should I look at today"; tapping in gets you ChainBroker-grade depth (scores, funding history, investor names) — but only after the user has chosen to go deeper.

### Bottom Navigation (4 tabs — Binance-style, not more)

```
[ Home ]   [ Search ]   [ Watchlist ]   [ Profile ]
```

- **4 tabs**, not 5 — Telegram Mini App viewport is short; every extra tab bar pixel competes with content. "Markets" as a separate tab is deliberately **not** included — for this audience, "browse the entire market" is not a top-level need; it's a secondary action reachable from Search/Rankings.
- **Home** — the "what should I look at today" answer. Default landing tab.
- **Search** — its own tab (not just an icon) because for a research product, search *is* a primary mode of use, on par with browsing — matches Binance treating search as persistent infrastructure.
- **Watchlist** — personal, return-visit-driving surface. Promoted to a tab (not buried in Profile) because repeat engagement is the product's survival metric.
- **Profile** — settings, notification preferences, about/help. Low-frequency, still needs a fixed home so it's never "lost."

### Screen hierarchy

```
Splash
  └─ Login (Telegram auth — likely automatic/invisible in most cases)
       └─ Home  ─────────────┬────────────────────┐
            │                │                    │
        Weekly Picks    Top Funds list      Unlock Alerts
        (section)        (section)           (section)
            │                │                    │
            ▼                ▼                    ▼
       Project Detail    Fund Detail        Project Detail
            │                │
            ▼                ▼
      [Watchlist toggle] [Watchlist toggle]

       Search (tab) ──► Search Results ──► Project Detail / Fund Detail

       Watchlist (tab) ──► Project Detail / Fund Detail

       Profile (tab) ──► Notification Settings
                     ──► About / Help
```

Every leaf screen (Project Detail, Fund Detail) is reachable from **at least two** entry points (Home and Search, often Watchlist too) — consistent with Binance's "nothing important more than one tap from anywhere" principle.

### Primary actions
(High frequency, must be effortless, large tap targets)
- Open a project from Home → Project Detail
- Search a project/fund by name
- Add/remove a project or fund from Watchlist (single tap, from any list row *and* from detail)
- Switch between Weekly / Monthly ranking view

### Secondary actions
(Lower frequency, fine to require one extra tap or a sub-screen)
- View full Funding History list for a project (vs. the top 1–2 rounds shown inline)
- View a fund's full portfolio
- Configure notification preferences
- View score breakdown / methodology explanation

---

## 4. Low-Fidelity Wireframes (Markdown / ASCII)

### Splash

```
┌───────────────────────────────┐
│                                 │
│                                 │
│                                 │
│           [ LOGO ]              │
│                                 │
│        Crypto Research,         │
│         Made Simple              │
│                                 │
│                                 │
│         ● loading...             │
│                                 │
│                                 │
└───────────────────────────────┘
```

### Login

```
┌───────────────────────────────┐
│                                 │
│           [ LOGO ]              │
│                                 │
│   Welcome to <Product Name>     │
│   Quick crypto research for     │
│   Academy members               │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Continue with Telegram    │ │
│  └───────────────────────────┘ │
│                                 │
│   By continuing you agree to    │
│   the Terms & Privacy Policy    │
│                                 │
└───────────────────────────────┘
```

### Home

```
┌───────────────────────────────┐
│  Hi, Minh 👋          🔔        │  ← greeting + notif icon
├───────────────────────────────┤
│  🔍  Search projects, funds...  │  ← persistent search affordance
├───────────────────────────────┤
│  THIS WEEK'S PICKS      [Weekly▾]│ ← toggle Weekly/Monthly
│ ┌────┐┌────┐┌────┐┌────┐       │
│ │ #1 ││ #2 ││ #3 ││ #4 │  →    │  ← horizontal scroll cards
│ │PRJ ││PRJ ││PRJ ││PRJ │       │
│ │Score││Score││Score││Score│   │
│ │ 92 ││ 88 ││ 85 ││ 83 │       │
│ └────┘└────┘└────┘└────┘       │
├───────────────────────────────┤  ───── fold line (≈ here) ─────
│  UNLOCK ALERTS                  │
│ ┌─────────────────────────────┐│
│ │ ⚠ TOKEN  unlocks in 3 days   ││
│ │   12% of supply · $4.2M      ││
│ └─────────────────────────────┘│
│ ┌─────────────────────────────┐│
│ │ ⚠ TOKEN2  unlocks in 6 days  ││
│ └─────────────────────────────┘│
├───────────────────────────────┤
│  TOP FUNDS                      │
│ ┌──┐ Fund A      12 projects    │
│ ┌──┐ Fund B      9 projects     │
│ ┌──┐ Fund C      8 projects     │
│            See all funds →      │
├───────────────────────────────┤
│  NEW FUNDING                    │
│ ┌─────────────────────────────┐│
│ │ PROJECT raised $5M (Seed)    ││
│ │ led by Fund A, Fund D        ││
│ └─────────────────────────────┘│
│                  See more →     │
├───────────────────────────────┤
│ [ Home ] [Search] [Watch] [Prof]│
└───────────────────────────────┘
```

### Search

```
┌───────────────────────────────┐
│  ←  🔍  Search...           ✕   │
├───────────────────────────────┤
│  RECENT                         │
│   • Aave                        │
│   • Lido                        │
├───────────────────────────────┤
│  TRENDING THIS WEEK              │
│   🔥 PROJECT A                  │
│   🔥 PROJECT B                  │
│   🔥 FUND C                     │
├───────────────────────────────┤
│  (after typing "aav")           │
│  PROJECTS                       │
│  ┌─────────────────────────────┐│
│  │ Ⓐ Aave         Score 91   ☆││
│  └─────────────────────────────┘│
│  FUNDS                          │
│  ┌─────────────────────────────┐│
│  │ Ⓐ Aave Grants DAO          ☆││
│  └─────────────────────────────┘│
├───────────────────────────────┤
│ [ Home ] [Search] [Watch] [Prof]│
└───────────────────────────────┘
```

### Project Detail

```
┌───────────────────────────────┐
│  ←   Aave                  ☆ 🔗 │  ← back, watchlist star, share
├───────────────────────────────┤
│   (logo)  Aave   AAVE          │
│   Lending · Ethereum            │
│                                 │
│   ┌───────────────────────┐    │
│   │      SCORE  91 / A+    │    │
│   └───────────────────────┘    │
│   Price $102.30   ▲ 2.1% (24h)  │
├───────────────────────────────┤  ───── fold line ─────
│  WHY THIS SCORE                │
│  ✓ Strong investor backing      │
│  ✓ Healthy TVL growth            │
│  ⚠ Unlock event in 12 days       │
├───────────────────────────────┤
│  MARKET METRICS                 │
│  Market Cap   $1.2B             │
│  FDV          $1.4B             │
│  TVL          $800M  ▲1.1%       │
│  24h Volume   $5M                │
├───────────────────────────────┤
│  FUNDING HISTORY                │
│  Series A · $5M · Jan 2024       │
│   led by Fund A, Fund D          │
│              View all rounds →   │
├───────────────────────────────┤
│  UPCOMING UNLOCKS                │
│  Jul 10 · Team · 0.5% supply     │
├───────────────────────────────┤
│ [ Home ] [Search] [Watch] [Prof]│
└───────────────────────────────┘
```

### Watchlist

```
┌───────────────────────────────┐
│  Watchlist                      │
├───────────────────────────────┤
│  [ Projects ]   [ Funds ]       │  ← segmented tabs
├───────────────────────────────┤
│ ┌─────────────────────────────┐│
│ │ Aave        91   ▲2.1%   ☆ ││
│ ├─────────────────────────────┤│
│ │ Lido        87   ▼0.4%   ☆ ││
│ ├─────────────────────────────┤│
│ │ Arbitrum    79   ▲0.9%   ☆ ││
│ └─────────────────────────────┘│
│                                 │
│        (empty state if none:)   │
│      "You're not watching        │
│       anything yet."             │
│   [ Browse this week's picks ]   │
├───────────────────────────────┤
│ [ Home ] [Search] [Watch] [Prof]│
└───────────────────────────────┘
```

### Profile

```
┌───────────────────────────────┐
│   (avatar)  Minh                │
│   Academy member                │
├───────────────────────────────┤
│   🔔  Notification settings   ›│
│   ⭐  My Watchlist            ›│
│   ❓  How scores work          ›│
│   ℹ️  About                    ›│
│   📄  Terms & Privacy          ›│
├───────────────────────────────┤
│ [ Home ] [Search] [Watch] [Prof]│
└───────────────────────────────┘
```

### Navigation sketch

```
Splash → Login → Home
                   │
        ┌──────────┼──────────────┬────────────┐
        ▼          ▼              ▼            ▼
   Project Detail  Fund Detail  Search Tab   Watchlist Tab
        ▲          ▲              │            │
        └──────────┴──────────────┴────────────┘
              (every list row everywhere leads here)

  Bottom nav (persistent): Home | Search | Watchlist | Profile
  Profile → Notification Settings / About (one level deep, dead-end)
```

---

## 5. Per-Screen Rationale

### Splash
- **User goal:** none yet — this is a brand/loading moment, not a task.
- **Why this layout:** Telegram Mini Apps cold-start in under a second typically; the splash exists only to avoid a blank white flash and to plant the brand promise ("crypto research, made simple") before any data loads.
- **Why this order:** logo → tagline → loading indicator is the minimum needed; anything more (e.g. onboarding carousels) delays time-to-value, which this audience won't tolerate.

### Login
- **User goal:** get in with the least friction possible.
- **Why this layout:** Telegram Mini Apps can usually authenticate via Telegram's own identity silently — when that's not fully automatic, the screen should still look like *one decision, one button*, not a form.
- **Why this order:** value reminder (who this is for) sits above the single CTA so the button isn't floating contextless; legal text is smallest and last because it's compliance, not persuasion.

### Home
- **User goal:** "What should I look at today?" — answered in under 5 seconds of scrolling.
- **Why this layout:** greeting + search bar first because search is a primary action, not a fallback — it must never require hunting. Weekly Picks is the first content block because it's the single highest-confidence, most "curated for you" signal the backend produces (a ranked, scored shortlist) — it directly answers the brief's stated question. Everything below the fold is *supporting* discovery (unlocks = urgency, funds = trust/credibility, new funding = freshness), in descending order of "how directly does this answer today's question."
- **Why this order:** Weekly Picks (curated, ranked) → Unlock Alerts (urgent/time-sensitive) → Top Funds (credibility/trust signal, slower-changing) → New Funding (interesting but least decision-relevant for a beginner). This mirrors Binance's priority logic: personalized/curated first, time-sensitive second, browsing/passive content last.

### Search
- **User goal:** find a specific project or fund fast, or be inspired if they don't know what to search.
- **Why this layout:** never a blank box — recent + trending are shown immediately (Binance's pattern) so search also works as a secondary discovery surface, not just retrieval.
- **Why this order:** Recent (personal, fastest re-find) above Trending (social proof) above live results — recency of intent outranks popularity.

### Project Detail
- **User goal:** "Should I care about this project?" — a verdict, not a data dump.
- **Why this layout:** the Score is the hero element directly under identity, because for a beginner it *is* the answer to "should I care" — everything below is justification, not the headline. ChainBroker's mistake (raw data with no verdict) is deliberately avoided here.
- **Why this order:** Score → "Why this score" (plain-language reasoning, this is the beginner-friendly translation layer ChainBroker never has) → Market Metrics (quantitative backup) → Funding History (credibility/depth, ChainBroker's strength, but summarized not tabular) → Unlocks (risk/timing, last because it's conditional information, not always present).

### Watchlist
- **User goal:** "What's happening with the things I already care about?"
- **Why this layout:** segmented Projects/Funds tabs (not one mixed list) because the two entity types have different at-a-glance metrics (score+price vs. portfolio size) and mixing them creates visual noise.
- **Why this order:** an actively helpful empty state (not a blank page) is critical — this is the screen most likely to be empty on day one, and Binance's pattern of "suggest something" directly converts a dead-end into a path back to Home.

### Profile
- **User goal:** control settings, find help, low-frequency utility.
- **Why this layout:** flat list of single-purpose rows — no dashboards, no stats here. This screen's entire job is to be predictable and forgettable.
- **Why this order:** Notifications first because it's the only setting expected to be touched often (planned feature); educational content ("how scores work") next because trust-building belongs near settings; legal/about last as it always is.

---

## 6. Widget Placement

### Above the fold (Home, first viewport, no scrolling)
- Greeting + notification icon
- Persistent search bar
- Weekly Picks (top 3–4 cards, horizontally scrollable)

### Below the fold (Home, requires scrolling, still on the primary screen)
- Unlock Alerts (compact list, 2–3 items + "see more")
- Top Funds (compact list, top 3 + "see all")
- New Funding (compact list, 2–3 items + "see more")

### Hidden behind another screen (intentionally not on Home)
- Full Funding History for a project → behind Project Detail → "View all rounds"
- Full Fund portfolio → behind Fund Detail
- Monthly Rankings full list → behind a toggle/sub-view, not duplicated alongside Weekly on Home
- Score methodology / "how scores work" → behind Profile, one tap deep
- Notification preference granularity (which alert types) → behind Profile
- Search filters (by category/chain) → behind Search, as a secondary, collapsed control — never primary

---

## 7. Unnecessary Widgets for Beginners

These exist conceptually in a ChainBroker-style product but should be actively **excluded** or deeply buried for this audience:

- **Raw funding round tables with full investor cap-table breakdowns** — a beginner doesn't need every co-investor listed; "led by Fund A, Fund D +2 more" is enough.
- **Sector/chain filter matrices on the home screen** — power-user research tooling, not a "what should I look at today" feature.
- **Multiple ranking timeframes shown simultaneously** (weekly + monthly + all-time side by side) — pick one default (weekly), let monthly be a toggle, never show three competing lists at once.
- **Raw on-chain wallet/smart-money flow data as a primary widget** — valuable to a professional researcher, meaningless noise to an Academy beginner without heavy explanation; if ever added, it belongs deep in Project Detail, not Home.
- **Sortable/customizable table columns** — desktop research-tool muscle memory; on mobile this becomes a usability trap (tiny controls, accidental taps).
- **Detailed score sub-component breakdowns on the card/list level** (e.g. showing all 7 sub-scores in a Home card) — this belongs one tap deeper, in Project Detail's "Why this score," not cluttering a scannable list.
- **A separate "Markets" browse-everything tab** — as argued in Section 3, this is a ChainBroker-style "see all the data" affordance this product's brief explicitly rejects as a *primary* navigation destination.

---

## 8. Recommended MVP Scope

### Must Have
- Splash + Login (Telegram auth)
- Home: Weekly Picks, Unlock Alerts, Top Funds, New Funding (all four backend capabilities already exist)
- Project Detail: Score + plain-language "why," core Market Metrics, summarized Funding History, upcoming Unlocks
- Fund Detail: overview + portfolio list
- Search: project + fund search, basic recent list
- Watchlist: add/remove (projects + funds), list view, empty state
- Bottom navigation: Home / Search / Watchlist / Profile
- Profile: minimal — account info, About/Terms

### Nice to Have
- Monthly Rankings toggle on Home (backend already supports it — low effort, real value)
- Trending searches on the Search screen (requires light analytics, not core data)
- "Why this score" expandable detail / score methodology screen
- Push-style in-app Notifications for unlock alerts and watchlist price moves (backend planned, not built)
- Segmented Watchlist sort (by score / by % change)

### Future
- Personalized recommendations beyond generic Weekly Picks (e.g. "because you watch Aave")
- Portfolio-style watchlist analytics (aggregate score/performance across watched items)
- Social/sharing features (share a project card to a Telegram chat)
- Multi-language support for Academy's broader audience
- Deeper on-chain/smart-money signals as an advanced, opt-in research mode
- Customizable Home (user reorders/hides sections)
