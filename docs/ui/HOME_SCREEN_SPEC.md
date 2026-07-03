# Home Screen Specification
**Product:** Ultimate Onchain Researcher — Telegram Mini App
**Document type:** High-fidelity UX Specification
**Status:** Design only. No implementation.
**References:** DESIGN_SYSTEM.md, COMPONENT_SPEC.md, SYSTEM_ARCHITECTURE.md

---

## 1. Reference Analysis

### 1.1 What to borrow from Binance

| Pattern | Rationale | Adaptation needed |
|---|---|---|
| **Market ticker strip** — primary assets (BTC/ETH/BNB) are always visible in the first content block | Sets macro context instantly, users scan this first before any curated content | Reframe as a static Market Overview Card (not a scrolling ticker) — Telegram Mini Apps cannot sustain a live auto-scrolling ticker reliably in a WebView without battery drain |
| **Price + 24h% always together** — every asset shows both current price and directional change | Eliminates "is this good or bad?" ambiguity in under 100ms | Keep exactly — pairs the Trend Arrow primitive with the Numeric text primitive throughout |
| **Bottom tab bar, 5 items, icon + label** | Thumb-friendly, instant orientation, platform-native on both iOS and Android | Keep exactly per DESIGN_SYSTEM.md Section 9 Bottom Navigation |
| **Horizontal card scrollers per section** | Allows dense content without vertical overload; partial-peek signals "more exists" | Keep the snap-scroll + partial-peek pattern for Weekly Picks, free-scroll for lower-emphasis sections |
| **Pull-to-refresh on main feed** | Muscle-memory behavior for all mobile crypto users | Keep, with native platform physics |
| **Skeleton loading per section** | Avoids blank-screen anxiety; each data source loads independently | Keep exactly — critical for Telegram's cold-start latency |
| **One-hand reachability** — primary actions in lower 60% of screen | Crypto traders check apps standing, commuting, one-handed | Weekly Picks carousel and "See all" actions must land in the thumb zone (below ~280px from top on a 390px reference) |
| **Haptic feedback on key interactions** | Reinforces "this registered" without demanding visual attention | Use: watchlist add/remove, tab switches, pull-to-refresh release. Never for passive data updates |

### 1.2 What to borrow from ChainBroker (information architecture only)

| Pattern | Rationale | Adaptation needed |
|---|---|---|
| **Trending Projects section** | Most time-relevant entry point for active traders | Simplify from ChainBroker's multi-column sortable table → compact horizontal card scroller |
| **Trending Funds section** | Contextualizes which investors are active this week | No Score on Fund Cards (per DESIGN_SYSTEM Rule 16) |
| **Recent Fundraises feed** | High-signal event for traders — fundraises precede price action | Show only 3 items + "See all" link; never the full list inline |
| **Unlock Alerts** | Unlock events directly affect price; must be surfaced proactively | Reframe as a compact list with Risk Indicator, not a calendar grid |
| **Recently Added** | New listings are discovery-driven; traders seek early entries | 3-item compact feed only |
| **Multi-section home feed** | Home is a research briefing, not a single-focus feed | Vertical composition of discrete, named sections replaces ChainBroker's single infinite table |
| **Top Gainers** | Fast-moving traders want directional signals first | Compact 5-item list, not a sortable table |

### 1.3 What NOT to copy from ChainBroker

| Anti-pattern | Why it fails here |
|---|---|
| **Sortable multi-column tables** | Unreadable at 390px. Violates DESIGN_SYSTEM Rule 4 and Anti-pattern 1. Any tabular data is restructured as cards or list rows |
| **Showing all 7 sub-scores inline on card** | Overwhelms at a glance. Violates DESIGN_SYSTEM Anti-pattern 2. Sub-scores live behind "Why?" action only |
| **Category color-coding** (DeFi = blue, L2 = purple) | Creates a competing color system against Score/risk semantics. Violates DESIGN_SYSTEM Rule 17 and Anti-pattern 12 |
| **Search results that show Score** | Confuses Search (retrieval) with Home curation. Violates DESIGN_SYSTEM Rule 36 |
| **Infinite scroll on Home** | Contradicts the product thesis: Home answers one finite question ("what today?"). Violates DESIGN_SYSTEM Anti-pattern 14 |
| **Raw unformatted numbers** | "$1234567890" instead of "$1.2B". Violates DESIGN_SYSTEM Anti-pattern 10 |
| **Full investor list in funding rows** | "led by a16z, Coinbase Ventures, Pantera, Multicoin" — overwhelming. Always summarize to 2 names + "+N more" |

### 1.4 What NOT to copy from Binance

| Anti-pattern | Why it fails here |
|---|---|
| **Order book, buy/sell panels** | This is a research product, not a trading terminal |
| **Live auto-scrolling ticker** | Performance cost is unjustifiable in a Telegram WebView; color-flash on value change is sufficient |
| **Price chart as hero** | This product's verdict is the Score, not the price chart. Charts are a future Exploration-tier element |
| **Swap/Trade as primary CTA** | No trading functionality exists or is planned |
| **Coin-browsing as primary navigation** | Home answers "what should I research?" not "let me find a specific coin" — that's Search's job |
| **Market cap ranking table** | A table of 100+ rows is Markets page territory (even there, restructured as cards) |

### 1.5 Interactions unsuitable for Telegram Mini Apps

| Interaction | Why it fails in TMA | Replacement |
|---|---|---|
| **Hover states** | No cursor in a WebView | Tap feedback (scale 0.97 + opacity) is the only interaction signal |
| **Right-click context menus** | Long-press is the TMA equivalent; context menus don't exist in WebViews | Long-press opens a Bottom Sheet with secondary actions |
| **Drag-and-drop (reordering)** | Unreliable across iOS/Android WebViews; conflicts with scroll | Watchlist reorder is deferred; swipe-to-remove reserved for future |
| **Custom scroll physics** | Telegram's WebView wraps native scroll; overriding it causes jank | Always use native momentum scroll |
| **Keyboard shortcuts** | No keyboard in a mobile WebView | Irrelevant — never design for them |
| **Hover tooltips** | Cannot trigger on mobile | Tap-to-reveal Tooltip (auto-dismisses in 4s) for ⓘ info icons only |
| **Pinch-to-zoom on content** | Only acceptable in a chart context; zooming the app layout breaks usability | Disable zoom on the app shell; preserve it only for any future chart component |
| **Multi-tab open in background** | Telegram Mini Apps are single-window by design | All navigation is in-app |
| **Desktop sidebar navigation** | Wrong platform | Bottom Navigation only |
| **Fixed floating buttons (FAB)** | Competes with Telegram's own overlay chrome | FAB is reserved-but-unused per DESIGN_SYSTEM Section 6 |

### 1.6 Interactions to simplify

| Complex pattern | Simplified TMA version |
|---|---|
| **Multi-step filter panel** | Single bottom sheet with 2–3 chips max |
| **Hoverable card preview** | Tap → Project Detail. No preview intermediate |
| **Expandable table rows** | Tap row → detail screen or Bottom Sheet |
| **Column sort control** | Sort Icon Button in header → Bottom Sheet listing sort options |
| **Pagination controls** | Infinite scroll with Skeleton rows pre-loading 300px early |
| **Multi-select with checkbox** | Deferred — not needed in MVP scope |
| **Share to social** | System share sheet (native) only |

---

## 2. Home Screen — Composition Overview

### 2.1 Template

Uses the **Home Template** from DESIGN_SYSTEM.md Section 11, extended with additional sections. The fixed composition order below is non-negotiable — no implementation may reorder these sections.

### 2.2 Viewport Math (390px × 750px reference)

```
Total viewport:         750px
Telegram chrome top:     54px  (status bar + Telegram nav strip)
App header:              56px  (sticky, Greeting variant)
Bottom navigation:       90px  (56px bar + 34px safe area)
Usable scrollable area: 604px  (750 − 54 − 56 − safe area chrome)

First screen content (before first scroll):
  Search bar:             44px
  Gap:                    16px
  Market Overview Card:  168px
  Gap:                    24px
  Section Header:         34px
  Gap below header:       12px
  Weekly Picks Carousel: 180px
                         ─────
  Total:                 478px  ← fits within 604px usable

Remaining at fold:       126px  ← reveals top of TRENDING section header
                                   (intentional peek, signals more content)
```

The fold deliberately exposes the beginning of the TRENDING section. Users see there is more to explore without needing a "scroll for more" instruction.

### 2.3 Full Screen Composition (in vertical order)

```
┌──────────────────────────────────────────────┐
│ STICKY TOP ─ Header (Greeting variant, 56px) │  ← Always visible
├──────────────────────────────────────────────┤
│                                              │
│  [A] Search Bar (Entry point variant)        │  ← 44px
│                                              │
│  [B] Market Overview Card                   │  ← 168px (BTC/ETH/BNB + F&G)
│                                              │
│  [C] WEEKLY PICKS                 View All ›│  ← Section Header
│  ┌──────────┐ ┌──────────┐ ┌──────────     │  ← 180px Carousel (snap)
│  │ Pick #1  │ │ Pick #2  │ │ Pick #3  …   │
│  └──────────┘ └──────────┘ └──────────     │
│                                              │
│  ─ ─ ─ ─ ─ ─ ─ FOLD LINE ─ ─ ─ ─ ─ ─ ─  │
│                                              │
│  [D] TRENDING              (3 sub-sections)  │  ← Projects, Funds, Platforms
│                                              │
│  [E] WATCHLIST SUMMARY        Manage ›      │  ← Conditional (3 rows max)
│                                              │
│  [F] TOP GAINERS              See all ›     │  ← 5 rows max
│                                              │
│  [G] 💰 RECENT FUNDRAISES     See all ›     │  ← Market Feed Card (3 rows)
│                                              │
│  [H] 🆕 RECENTLY ADDED        See all ›     │  ← Market Feed Card (3 rows)
│                                              │
│  [I] ⚠️ UNLOCK ALERTS          See all ›     │  ← Market Feed Card (3 rows)
│                                              │
│                    ∼ end of feed ∼           │
│                                              │
├──────────────────────────────────────────────┤
│ STICKY BOTTOM ─ Bottom Navigation (90px)    │  ← Always visible
└──────────────────────────────────────────────┘
```

**Total scroll height estimate:** ~1,900px — approximately 3 full screen heights. Compliant with DESIGN_SYSTEM Rule 12.

---

## 3. Section Specifications

### 3.1 [HEADER] Greeting Bar

**Component:** Top App Bar (Greeting variant)
**Height:** 56px
**Sticky:** Yes — permanently. Never disappears. Collapses to slim state (44px) after Market Overview scrolls out of view, showing only the search icon and bell. Does NOT fully hide.

**Content:**
- Left: Greeting text — "Hi, [first name] 👋" in `type-title` (17px/600)
  - Fallback if name unavailable: "Welcome" — never show "Hi, undefined"
  - Maximum display name: 12 characters, truncated with ellipsis
- Right: Bell icon (Icon Button, 24px, 44×44 tap zone)
  - Notification Dot (Dot variant, red, 8px) overlaid when unread alerts exist

**Collapsed state (triggered after ~60px scroll):**
- Height reduces from 56px to 44px over 150ms ease-out
- Greeting text fades out (opacity 0, 100ms)
- Search icon appears in the left area (replaces greeting) — taps navigate to Search tab
- Bell remains right
- Glass blur activates (backdrop-filter) as content scrolls beneath

**Typography:**
- Greeting: `type-title`, `neutral-text-primary`
- No subtitle, no score, no data in the header ever

---

### 3.2 [A] Search Bar

**Component:** Search Bar (Entry point variant)
**Height:** 44px
**Position:** First element in the scrollable body, directly below the sticky header
**Margin:** 16px screen horizontal margin (per grid system), 16px gap above (from header), 16px gap below (to Market Overview Card)

**Appearance:**
```
┌──────────────────────────────────────┐
│  🔍  Search projects, funds...       │
└──────────────────────────────────────┘
  radius-md (12px), neutral-surface bg
```

**Behavior:**
- Not a real text input on Home — it looks like an input but is a tappable affordance
- Tapping anywhere on the bar navigates to the Search tab and auto-focuses the real input
- No dropdown, no suggestions — those exclusively belong to the Search tab screen
- Press state: background lightens slightly, scale 0.99 (very subtle — this looks like an input, not a button)

**States:**
- Default: placeholder text "Search projects, funds..." in `type-body`, `neutral-text-tertiary`
- Pressed: brief background-color tint (100ms), then navigation
- No "focused" state on Home — focus only happens in the Search tab

---

### 3.3 [B] Market Overview Card

**Component:** Market Overview Card (DESIGN_SYSTEM.md Section 9 — named composite card)
**Height:** 168px
**Width:** Full-bleed (viewport − 32px = 358px at reference)
**Radius:** `radius-lg` (16px)
**Elevation:** `elevation-flat` in dark theme; `elevation-raised` in light theme
**Margin:** 16px screen horizontal, 16px gap above (from Search Bar), 24px gap below (to section header)

**Internal layout:**
```
┌──────────────────────────────────────────────────────┐  168px
│                                                      │
│  ₿ BTC            Ξ ETH            ⬡ BNB           │  Row 1: 3-col equal
│  $67,420          $3,610           $580             │  type-numeric
│  ▲ +1.2%          ▼ −0.4%          ▲ +0.8%          │  trend arrows
│                                                      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ divider ─ ─ ─ ─ ─ ─ ─ ─ ─   │  1px neutral-border
│                                                      │
│  Total Market Cap                Fear & Greed  ⓘ   │  Row 2: 2-col split
│  $2.34T  ▲ +0.9%                62 / Greed          │  62 uses fng color
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Column breakdown:**
- Row 1: 3 equal-width columns (≈119px each at reference)
  - Each column: coin icon (20px, top), price in `type-numeric`, 24h% + Trend Arrow in `type-caption`
  - Coin icons: BTC (₿ or logo), ETH (Ξ or logo), BNB (⬡ or logo) — use Token Logo primitive at 20px
- Divider: 1px `neutral-border`, full internal width, 8px margin above and below
- Row 2: left col (≈60%) = Total Market Cap label + value + Trend Arrow; right col (≈40%) = Fear & Greed label + ⓘ icon + value + band label
  - Fear & Greed value rendered in the appropriate `fng-N` color from the 5-band system
  - ⓘ icon (Icon Button, `icon-xs`, 16px, 44×44 tap zone) opens Tooltip: "This index measures whether the market is driven by fear or greed today."
  - Band label rendered in the same fng color

**All 5 values are always simultaneously visible. Never scroll internally.**

**Loading state:** Entire card shimmers as one Skeleton Block. Internal structure does not partially reveal — the card is either fully loading (shimmer) or fully visible.

**Error state:** If only market data fails: macro row (Total Mkt Cap + F&G) shows inline "Couldn't load" `Caption` with a small retry icon. Coin prices, if already loaded, remain visible. Never blank the whole card.

**Animation:** Live value changes fire the color-flash animation per DESIGN_SYSTEM Section 10 "Live Market Update" spec — 200ms `bullish`/`bearish` tint fading back to `neutral-text-primary`. Fear & Greed band crossings animate the gradient color transition (200ms).

**Interaction:** Card is NOT tappable as a whole. Only the ⓘ icon on Fear & Greed is interactive.

---

### 3.4 [C] Weekly Picks Carousel

**Component:** Section Header (with "View All" action) + Horizontal Carousel + Weekly Pick Cards
**Section Header height:** 34px (Title text) + 12px gap below = 46px
**Carousel height:** 180px (card height)
**Gap above section header:** 24px (from Market Overview Card)
**Gap below carousel:** 24px (to next section)

**Section Header:**
```
WEEKLY PICKS                          View All ›
```
- Left: "WEEKLY PICKS" in `type-title`, `neutral-text-primary`
- Right: "View All ›" in `type-button`, `color-accent` — navigates to a "All Picks" full-list sub-screen
- No subtitle

**Carousel behavior:** Snap-to-card on scroll release (the primary Weekly Picks scroller). Always partially cuts off the last visible card to signal "more exists." First card has 16px left inset; 12px gap between cards.

**Weekly Pick Card (220×180px):**
```
┌───────────────────────────────────┐  180px
│                                   │
│  [●] Project Name         #1      │  Token Logo (28px) + name type-title + rank
│                                   │
│     ╔═══╗   78                   │  Score Circle Compact (40px ring)
│     ║   ║   A+                   │  numeral type-numeric + grade Pill
│     ╚═══╝                        │
│                                   │
│  ─────────────────────────────   │  internal divider
│  Funding   ●●●●○○  Strong        │  Progress dots + Funding Quality label
│  TVL       ↗ chart  +12%         │  Sparkline (Area) + Trend Arrow + %
│  Unlock    ⚠ 14 days            │  Risk Indicator (dot-only if high, icon+text)
│                                   │
│  Why this score? ›               │  Text button, accent color — opens Bottom Sheet
│                                   │
└───────────────────────────────────┘
```

**Information hierarchy within card:**
1. Project identity (logo + name + rank) — instant orientation
2. Score + Grade — the verdict
3. Three supporting signals — evidence for the verdict
4. "Why?" — escape hatch to full reasoning

**Maximum 4 data signals per card.** Never add a 5th field. Never show sub-score breakdown inline.

**Rank badge:** Shown as "#1", "#2", etc. in `type-caption`, `neutral-text-secondary`, top-right corner. Not shown if set is not explicitly ranked.

**State: Loading** → Full-card Skeleton Block (220×180px single shimmer, logo circle placeholder + 4 line placeholders)
**State: Error** → Card retains its 220×180px footprint. Content replaced by muted "Couldn't load" in `type-caption`, centered. Card remains tappable (retries on tap).
**State: Empty** → If zero picks exist this week: Section shows a Section-level muted Caption ("No picks this week — check back on Monday") without a Carousel.

**Interaction:**
- Entire card tap → Project Detail screen (slide-in transition, 280ms)
- "Why this score? ›" tap → Bottom Sheet opens with Score Breakdown Card content — does NOT navigate away from Home
- Press state: scale 0.97 (100ms ease-out), springs back on release as navigation begins

---

### 3.5 [D] Trending

**Structure:** Three sub-sections stacked vertically, each with its own Section Header and horizontal Carousel. The parent label "TRENDING" does not appear — each sub-section is independently labeled.

**Gap above first sub-section:** 24px (from Weekly Picks carousel)
**Gap between sub-sections:** 16px
**Gap below last sub-section:** 24px

#### 3.5.1 Trending Projects

**Section Header:** "TRENDING PROJECTS" (Title) + "See all ›" (links to Markets → Trending Projects)
**Carousel:** Free-scroll (no snap), 3–5 Project Cards visible, partially cuts off the last

**Project Card (140×120px):**
```
┌────────────────────┐  120px
│  [●] Project Name  │  Token Logo (32px) + name type-subtitle
│                    │
│     ╔══╗  82      │  Score Circle Compact (40px) + numeral
│     ║  ║  A       │  Grade Pill
│     ╚══╝          │
│                    │
│  ▲ +8.2%          │  Trend Arrow + 24h% type-caption
│                    │
└────────────────────┘
  140px width
```

**Maximum 2 data signals:** Score + 24h trend. No Funding Quality, no Unlock Risk — that depth is for Weekly Pick Cards only.

**Card count:** Show 5 in carousel (partial peek at 6th). "See all" links to full Markets list.

#### 3.5.2 Trending Funds

**Section Header:** "TRENDING FUNDS" + "See all ›"
**Carousel:** Free-scroll, Fund Card Mini variant (140×120px)

**Fund Card Mini (140×120px):**
```
┌────────────────────┐  120px
│  [●] Fund Name     │  Fund Logo (32px) + name type-subtitle
│                    │
│  12 projects       │  Portfolio count type-numeric
│  in portfolio      │  label type-caption
│                    │
│  Avg ○ 71          │  Avg investor score (Score Circle compact, small)
│                    │
└────────────────────┘
  140px width
```

**No Score Circle** on Fund Cards. Avg investor score displayed as a separate field with explicit label "Avg" to distinguish from Project Score. This visual distinction is non-negotiable.

#### 3.5.3 Trending Platforms

**Section Header:** "TRENDING PLATFORMS" + "See all ›"
**Carousel:** Free-scroll, Platform mini-cards (name + Chain Logo only, no secondary metric)

**Platform mini-card (120×80px):**
```
┌───────────────────┐  80px
│      [●]          │  Chain Logo (40px, centered)
│  Ethereum         │  name type-subtitle, centered
└───────────────────┘
  120px width
```

Platforms are the leanest card in this product — logo + name only. No score, no metric. The chain is context, not a scoreable entity.

---

### 3.6 [E] Watchlist Summary

**Visibility:** Conditional — this section is hidden entirely when the user's Watchlist is empty. Zero-item state shows nothing (not an empty state message; the section is simply absent from the page).

**Rationale:** A new user should not see an empty Watchlist section on their first Home visit. The section earns its position by having content to show.

**Section Header:** "WATCHLIST" + "Manage ›" (navigates to Watchlist tab)
**Gap above:** 24px
**Gap below:** 24px

**Content:** Maximum 3 rows (the top 3 items by "last interacted" order). If the user has 1–2 items, only 1–2 rows appear; the section does not pad with empty rows. If user has ≥4 items, only the top 3 appear — "Manage ›" is the path to all.

**Watchlist Summary Row (64px per row, full-bleed):**
```
[●] Project Name       ○ 82  A     $67,420  ▲ +1.2%
[●] Fund Name            —         12 proj   +3 this week
```

- Projects: Token Logo (28px) + name + Score Circle (Compact, 40px ring) + Grade Pill + current price + 24h% + Trend Arrow
- Funds: Fund Logo (28px) + name + portfolio count + weekly new entries count (if available)
- Notification Dot (Dot, 8px, red) in the trailing position if an alert condition exists

**Rows separated by inset Divider (16px left inset, 1px, `neutral-border`).**

**Interaction:** Entire row tappable → Project/Fund Detail
**Loading:** Row-level Skeleton Block (64px per row)
**Error:** Stale-data inline banner at the top of the section — "Couldn't refresh — showing saved data" in `Caption`, `warning` tint. Rows remain visible with last-known values, muted.

---

### 3.7 [F] Top Gainers

**Section Header:** "TOP GAINERS" + "See all ›" (links to Markets → Top Gainers)
**Gap above:** 24px
**Gap below:** 24px
**Card container:** Standard Card (`radius-lg`, `elevation-flat`), full-bleed

**Content:** 5 rows maximum inline. "See all" is the only path to a ranked list beyond 5.

**Gainer Row (56px per row, full-bleed):**
```
┌────────────────────────────────────────────────┐
│  1  [●] Project Name         ▲ +28.4%          │
│  2  [●] Project B            ▲ +19.1%          │
│  3  [●] Project C            ▲ +14.7%          │
│  4  [●] Project D            ▲ +11.2%          │
│  5  [●] Project E            ▲  +8.8%          │
└────────────────────────────────────────────────┘
```

- Rank number: `type-caption`, `neutral-text-secondary`, fixed 24px width
- Token Logo: 28px
- Project name: `type-subtitle`, `neutral-text-primary`
- 24h%: `type-numeric`, `color-bullish` (always positive in Gainers), right-aligned
- Trend Arrow: always Up in this list — included for accessibility (color is not the only indicator)
- Rows separated by inset Divider

**No Score shown.** Gainers is a pure price-performance list — conflating Score with price direction is a data-integrity violation. A project can be a top gainer and have a low Score.

**Loading:** 5-row Skeleton Block, staggered shimmer
**Error:** Section shows inline "Couldn't load" Caption + retry icon
**Empty:** Section-level muted Caption: "No significant gainers today"

---

### 3.8 [G] Recent Fundraises

**Component:** Market Feed Card (Fundraise variant)
**Height:** 100–120px depending on row count
**Gap above:** 24px
**Gap below:** 12px (tighter between sibling feed cards)

**Header row (inline with the card, not a Section Header):**
```
💰 RECENT FUNDRAISES                  See all ›
```
- 💰 emoji permitted here per DESIGN_SYSTEM Section 8 (emoji in section headers for instant recognition, max 1 per header)
- "RECENT FUNDRAISES" in `type-title`
- "See all ›" in `type-button`, `color-accent` → Markets → Recent Fundraises

**3 fundraise rows (44px each):**
```
[●] Project Name     $25M Seed         2d ago
[●] Project Name     $10M Series A     4d ago
[●] Project Name     $50M Series B     6d ago
```
- Token Logo (28px) + project name `type-subtitle` + amount `type-numeric` + round type `type-caption` + relative date `type-caption`, right-aligned, `neutral-text-secondary`
- Investor names NOT shown at this density — the Market Feed Card is a glance-level list only. Full investor detail is one tap deeper (Project Detail → Funding section)

**Row interaction:** Tappable → Project Detail
**"See all ›":** → Markets Fundraises sub-screen

---

### 3.9 [H] Recently Added

**Component:** Market Feed Card (Recently-Added variant)
**Height:** 100–120px
**Gap above:** 12px (tight grouping with sibling feed cards)
**Gap below:** 12px

**Header row:**
```
🆕 RECENTLY ADDED                     See all ›
```

**3 rows (44px each):**
```
[●] Project Name     DeFi Protocol       added 1d ago
[●] Project Name     L2 Network          added 3d ago
[●] Project Name     Infrastructure      added 5d ago
```
- Token Logo (28px) + name `type-subtitle` + category `type-caption`, `neutral-text-secondary` + relative date `type-caption`, right-aligned

**No Score shown.** Newly added projects may not have sufficient data for a meaningful Score. Showing one risks displaying a misleadingly low default.

---

### 3.10 [I] Unlock Alerts

**Component:** Market Feed Card (Unlock variant)
**Height:** 100–120px
**Gap above:** 12px
**Gap below:** 40px (end of feed breathing room before the bottom of scroll content)

**Header row:**
```
⚠️ UNLOCK ALERTS                      See all ›
```

**3 rows (56px each — slightly taller to accommodate the 2-line layout):**
```
[●] Project Name    Jul 2  •  1.2% supply  •  ⚠ High Risk
[●] Project Name    Jul 5  •  0.8% supply  •  ◦ Low Risk
[●] Project Name    Jul 9  •  2.1% supply  •  ▲ Moderate
```
- Token Logo (28px) + name `type-subtitle`
- Second line: date `type-caption` + separator • + % of supply `type-numeric` + separator • + Risk Indicator (icon + label)
- Risk Indicator uses the 3-state color mapping: Low=`success`, Moderate=`warning`, High=`danger`

**Sort order:** By date ascending (soonest first). Risk level is displayed but does not determine order — date does.

**"See all ›":** → Markets → Unlock Calendar

---

## 4. Full Screen ASCII Wireframe

The following wireframe represents the Home screen at the 390px reference width. Each character block is approximately 10px. Approximate heights shown on the right.

```
╔══════════════════════════════════════════════════╗
║ TELEGRAM CHROME (status bar + Telegram nav)       ║  ~54px
╠══════════════════════════════════════════════════╣
║ Hi, Alex 👋                              [🔔]    ║  56px STICKY HEADER
╠══════════════════════════════════════════════════╣
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  16px gap
║ ┌──────────────────────────────────────────────┐ ║
║ │  🔍  Search projects, funds...               │ ║  44px SEARCH BAR
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  16px gap
║ ┌──────────────────────────────────────────────┐ ║
║ │  ₿ BTC      Ξ ETH      ⬡ BNB              │ ║
║ │  $67,420    $3,610      $580               │ ║  168px MARKET OVERVIEW
║ │  ▲+1.2%     ▼−0.4%      ▲+0.8%             │ ║
║ │  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  │ ║
║ │  Total Mkt Cap $2.34T ▲0.9%  F&G: 62 Greed│ ║
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  24px gap
║  WEEKLY PICKS                       View All › ║  34px header
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px gap
║ ┌─────────────────────┐ ┌─────────────────────  ║
║ │ [●] Celestia    #1  │ │ [●] Eigen     #2      ║  180px WEEKLY PICKS
║ │    ╔══╗  78  A+    │ │    ╔══╗  71  B       ║  CAROUSEL (snap)
║ │    ╚══╝           │ │    ╚══╝              ║
║ │ Funding ●●●● Strong│ │ Funding ●●● Moderate  ║
║ │ TVL    ↗   +12%   │ │ TVL    ↘   −3%       ║
║ │ Unlock ⚠ 14 days  │ │ Unlock ◦ Low risk     ║
║ │ Why this score? › │ │ Why this score? ›     ║
║ └─────────────────────┘ └─────────────────────  ║
║ ─ ─ ─ ─ ─ ─ ─ ─ FOLD (first screen) ─ ─ ─ ─ ─║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  24px gap
║  TRENDING PROJECTS              See all ›      ║  34px
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px
║ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────     ║  120px carousel
║ │[●]Proj │ │[●]Proj │ │[●]Proj │ │[●]Proj  …  ║
║ │  ╔╗82A │ │  ╔╗71B │ │  ╔╗65B │ │            ║
║ │  ▲+8.2%│ │  ▲+4.1%│ │  ▲+3.0%│ │            ║
║ └────────┘ └────────┘ └────────┘ └────────     ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  16px gap
║  TRENDING FUNDS                 See all ›      ║  34px
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px
║ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────     ║  120px carousel
║ │[●]Fund │ │[●]Fund │ │[●]Fund │ │[●]Fund  …  ║
║ │  12 proj│ │ 8 proj │ │ 21 proj│ │            ║
║ │Avg ○71 │ │Avg ○68 │ │Avg ○75 │ │            ║
║ └────────┘ └────────┘ └────────┘ └────────     ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  16px gap
║  TRENDING PLATFORMS             See all ›      ║  34px
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px
║ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────   ║  80px carousel
║ │  [●] │ │  [●] │ │  [●] │ │  [●] │ │  [●]    ║
║ │Ether │ │Solana│ │ Base │ │ Arb  │ │ Stk  …  ║
║ └──────┘ └──────┘ └──────┘ └──────┘ └──────   ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  24px gap
║  WATCHLIST                      Manage ›       ║  34px [if populated]
║ ┌──────────────────────────────────────────────┐ ║
║ │[●] Ethereum  ○82 A+  $3,610   ▼ −0.4%   [•]│ ║  64px rows ×3
║ │[●] Aave      ○65 B   $190     ▲ +1.2%      │ ║
║ │[●] Arbitrum  ○58 C   $1.82    ▲ +0.6%      │ ║
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  24px gap
║  TOP GAINERS                    See all ›      ║  34px
║ ┌──────────────────────────────────────────────┐ ║
║ │ 1 [●] Project A              ▲ +28.4%        │ ║
║ │ 2 [●] Project B              ▲ +19.1%        │ ║  56px rows ×5
║ │ 3 [●] Project C              ▲ +14.7%        │ ║
║ │ 4 [●] Project D              ▲ +11.2%        │ ║
║ │ 5 [●] Project E              ▲  +8.8%        │ ║
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  24px gap
║ ┌──────────────────────────────────────────────┐ ║
║ │ 💰 RECENT FUNDRAISES          See all ›       │ ║
║ │ [●] Project A   $25M Seed          2d ago     │ ║  Market Feed
║ │ [●] Project B   $10M Series A      4d ago     │ ║  Card
║ │ [●] Project C   $50M Series B      6d ago     │ ║  ~132px
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px gap
║ ┌──────────────────────────────────────────────┐ ║
║ │ 🆕 RECENTLY ADDED             See all ›       │ ║
║ │ [●] Monad      L2 Network      added 1d ago   │ ║  Market Feed
║ │ [●] Initia     Infrastructure  added 3d ago   │ ║  Card
║ │ [●] Story      IP Protocol     added 5d ago   │ ║  ~132px
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  12px gap
║ ┌──────────────────────────────────────────────┐ ║
║ │ ⚠️ UNLOCK ALERTS               See all ›       │ ║
║ │ [●] Project A  Jul 2 • 1.2% supply  ⚠ High   │ ║  Market Feed
║ │ [●] Project B  Jul 5 • 0.8% supply  ◦ Low    │ ║  Card
║ │ [●] Project C  Jul 9 • 2.1% supply  ▲ Mod    │ ║  ~144px
║ └──────────────────────────────────────────────┘ ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  40px end breathing room
╠══════════════════════════════════════════════════╣
║ [Home]  [Search]  [Watch]  [Markets]  [Profile] ║  90px BOTTOM NAV
╚══════════════════════════════════════════════════╝
```

---

## 5. Visual Hierarchy Summary

| Section | Priority | Visual Weight | Spacing Above | Height | Collapsed | Expanded |
|---|---|---|---|---|---|---|
| Header (Greeting) | 1 — Always | Heading 20px bold | Sticky | 56px (→44px collapsed) | Slim bar, search icon, bell | Full greeting + bell |
| Search Bar | 2 — Always | Body 15px, tertiary color | 16px from header | 44px | N/A (static) | N/A — tap navigates away |
| Market Overview Card | 3 — High | Numeric 17px, 3-col | 16px below search | 168px | Never collapses | Always fully visible |
| Weekly Picks | 4 — Highest | Title 17px semibold header + 180px cards | 24px | 46px header + 180px carousel | N/A (scroll reveals) | Cards fully visible in carousel |
| Trending (3 sub) | 5 — High | Title headers + 120px cards | 24px (first sub) | 34px headers + 120–80px carousels | N/A | Each scroller independently visible |
| Watchlist Summary | 6 — Conditional | Subtitle rows | 24px | 34px header + 64px×N | Hidden when empty | Shows top 3 rows |
| Top Gainers | 7 — Medium | Caption rank + Subtitle name + Numeric % | 24px | 34px header + 56px×5 | N/A | 5 rows always visible |
| Recent Fundraises | 8 — Medium | Feed card, Body text | 24px | ~132px | N/A | 3 rows visible |
| Recently Added | 9 — Medium | Feed card, Caption density | 12px | ~132px | N/A | 3 rows visible |
| Unlock Alerts | 10 — Medium-Low | Feed card, Risk color indicators | 12px | ~144px | N/A | 3 rows visible |

---

## 6. Screen-Level States

### 6.1 Initial Load (cold start)

Every section loads and skeletons independently. The header and search bar render immediately (static, no data needed). Sections load in this priority order:

1. Market Overview Card (single fetch, fastest)
2. Weekly Picks (curated, pre-computed — fast)
3. Watchlist Summary (user-specific, requires auth — medium)
4. Trending sections (aggregated, medium)
5. Top Gainers (aggregated, medium)
6. Market Feed Cards (three separate fetches, lower priority)

No section blocks any other. A section that is still loading shows its Skeleton Block. A section that fails shows its inline Error State. Other sections continue independently.

### 6.2 Pull to Refresh

Available on the entire Home scroll. User drags down past 80px resistance point → releases → all sections simultaneously enter Skeleton state and re-fetch. Native iOS/Android elastic physics must be preserved. Medium haptic on release.

Partial refresh is NOT supported — it's all-or-nothing to avoid a "stale data next to fresh data" confusion.

### 6.3 Offline State

On full loss of connectivity:
- Header shows a 1px `warning` tint hairline below it (subtle, not a full banner)
- Each section shows last-known content (from cache), with a muted `Caption` label: "Showing saved data"
- Market Overview Card values are displayed with muted `neutral-text-secondary` color (not primary), signaling "this is not live"
- Pull to refresh is allowed but shows an appropriate error toast: "No connection — couldn't refresh"
- Watchlist Summary falls back to cached data without a warning (personal data, less time-critical than market data)

### 6.4 Empty State (new user, no Watchlist)

Watchlist Summary section is hidden (not shown with an empty state — the section is simply absent). The rest of Home functions normally. This is by design — the first-time experience is identical to the returning experience, just without the Watchlist section.

### 6.5 Error State (all sections fail)

If all data fetches fail simultaneously (e.g., backend is down):
- Each section independently shows its inline Error State (retry button within the section)
- Never a full-page error — the header, search, and bottom nav remain fully functional
- This ensures the user can still navigate to Search, Watchlist, and other tabs

---

## 7. Fear & Greed — Detailed Spec

Fear & Greed occupies the right column of the Market Overview Card's bottom row. It is the most "interpretive" data point on the card and needs extra care.

**Display format:** `{value} / {label}` — e.g., "62 / Greed"
- Value: `type-numeric` (17px/600), rendered in the appropriate `fng-N` color
- Label: `type-caption`, same `fng-N` color
- ⓘ icon: `icon-xs` (16px), tappable, 44×44 tap zone, opens Tooltip

**Tooltip content (one sentence, auto-dismisses at 4s):**
"This index measures market sentiment daily — below 25 is extreme fear, above 75 is extreme greed."

**Band colors (from DESIGN_SYSTEM Section 5):**
| Value | Label | Color token |
|---|---|---|
| 0–24 | Extreme Fear | `color-fng-1` (deep red) |
| 25–44 | Fear | `color-fng-2` (orange) |
| 45–55 | Neutral | `color-fng-3` (neutral grey-yellow) |
| 56–75 | Greed | `color-fng-4` (yellow-green) |
| 76–100 | Extreme Greed | `color-fng-5` (saturated green) |

**Animation:** When the value crosses a band boundary (rare intraday event), the color transitions smoothly over 200ms. The numeral cross-fades simultaneously.

**Why not a visual gauge?** A gauge would require 80px+ of vertical space. The Market Overview Card's 168px budget is already fully allocated. The color-coded number communicates the same information faster, at zero additional height cost. A future "expanded" state could show a gauge in a Bottom Sheet (tap the value row to expand), but is not in MVP scope.
