# Navigation Specification
**Product:** Ultimate Onchain Researcher — Telegram Mini App
**Document type:** High-fidelity UX Specification
**Status:** Design only. No implementation.
**References:** DESIGN_SYSTEM.md Section 9, COMPONENT_SPEC.md Section 6–7, HOME_SCREEN_SPEC.md

---

## 1. Navigation Architecture

### 1.1 Structure Overview

This product has exactly two navigation levels:

```
Level 1 — Primary (Bottom Navigation, 5 tabs):
  Home → Search → Watchlist → Markets → Profile

Level 2 — Detail (pushed via drill-in from any Level 1 screen):
  Project Detail
  Fund Detail
  Notification Settings   (from Profile)
  Theme Settings          (from Profile)
  About / Terms           (from Profile)
  "See All" sub-screens   (from any Section Header "See all" action)
```

There is no Level 3. Any attempt to add a third navigation level must instead push the feature into a Bottom Sheet or redesign as a sub-section within an existing screen. This constraint is non-negotiable — depth beyond two levels causes "lost in the app" confusion on mobile.

### 1.2 Navigation Entry Points

| Entry point | Type | Navigates to | Transition |
|---|---|---|---|
| Bottom nav tab tap | Primary navigation | That tab's Level 1 screen | Cross-fade 200ms |
| Card tap (any) | Drill-in | Project/Fund Detail | Slide-in from right 280ms |
| "See all ›" | Drill-in | Full list sub-screen | Slide-in from right 280ms |
| "View All" (Weekly Picks) | Drill-in | All Picks sub-screen | Slide-in from right 280ms |
| "Manage ›" (Watchlist Summary) | Tab switch | Watchlist tab | Cross-fade 200ms |
| Search bar (Home, entry point variant) | Tab switch | Search tab + auto-focus | Cross-fade 200ms + keyboard rise |
| Back button / iOS edge swipe | Back navigation | Previous screen | Slide-out to right 280ms |
| Fund name in Funding Card | Drill-in | Fund Detail | Slide-in from right 280ms |
| Investor names in Funding Card | Drill-in | Fund Detail | Slide-in from right 280ms |

### 1.3 Back Navigation Rules

- Back always reverses the forward transition exactly (slide-out to right, mirroring slide-in)
- Back MUST restore the previous screen's exact scroll position
- Back MUST restore any previously open state (e.g. if a Bottom Sheet was open, it re-opens)
- Double-tap on the active bottom nav tab scrolls the current screen to the top (replaces back-to-top button)
- Swiping back from a "See All" sub-screen returns to the Home scroll position where the user was (not the top)
- NEVER silently reset the navigation stack or jump to Home unexpectedly

---

## 2. Bottom Navigation

### 2.1 Structure

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  [⌂]        [🔍]       [★]      [📊]      [👤]          ║
║  Home       Search    Watchlist  Markets   Profile       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  90px total (56px bar + 34px safe area padding)
```

**5 fixed tabs. Never more, never fewer.** Tab order is fixed as shown — research flow (what to look at → find it → save it → browse more → settings).

### 2.2 Tab Specifications

| Tab | Icon (outline resting) | Icon (filled active) | Label | Badge source |
|---|---|---|---|---|
| Home | House outline | House filled | "Home" | None |
| Search | Magnifier outline | Magnifier filled | "Search" | None |
| Watchlist | Star outline | Star filled | "Watchlist" | Notification Dot if any alert exists for a watched item |
| Markets | Chart/Bar outline | Chart/Bar filled | "Markets" | None |
| Profile | Person outline | Person filled | "Profile" | None |

### 2.3 Behavior

**Tab switching:**
- Single tap on inactive tab: 200ms cross-fade to that tab's screen. Active icon switches to filled + accent color instantly with the tap (not delayed until the transition completes)
- Single tap on active tab: scrolls the current screen back to the top (no navigation). Light haptic feedback.
- Icon scale-bounce on tap: 1.0 → 1.15 → 1.0, 150ms ease-out

**Active state visual:**
- Icon: filled variant, `color-accent`
- Label: `type-caption` (13px/400), `color-accent`
- No underline, no indicator pill — the filled icon + accent color is sufficient

**Inactive state visual:**
- Icon: outline variant, `neutral-text-secondary`
- Label: `type-caption` (13px/400), `neutral-text-secondary`

**Hidden state:**
- Hides only when a keyboard is focused (Search tab, text input active)
- Hidden via: slide-down 150ms + fade-out 150ms, simultaneously
- Reappears on keyboard dismiss: slide-up 150ms + fade-in 150ms
- NEVER hidden on any of the 5 primary tabs for any other reason

**Badge (Watchlist tab):**
- Notification Dot (8px, red) appears when any watched item has an alert
- Dot scale-in animation (0 → 1.0 with 10% overshoot, 150ms)
- Removed once user opens Watchlist and the alert is acknowledged

**Glass effect:**
- The bottom nav bar uses `blur-glass` (backdrop-filter blur) in both themes
- This communicates "floating over content" — the same language as the sticky header
- Never opaque-background on bottom nav (glass is mandatory per DESIGN_SYSTEM Section 7)

---

## 3. Search Experience

### 3.1 Navigation to Search

Two paths:
1. **Home Search Bar tap** → Tab switch (cross-fade) + Search tab auto-focuses input
2. **Bottom nav Search tap** → Tab switch (cross-fade) + Search tab; input may or may not auto-focus based on whether the user was on Search before

On first arrival at Search (fresh session), the input is always auto-focused and the keyboard is immediately visible. This is the only screen where auto-focus on arrival is the correct behavior.

### 3.2 Search Screen Layout

```
╔══════════════════════════════════════════════════════════╗
║ ← [🔍  Search projects, funds...                  ✕] ║  44px input
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ─ ─ ─ ─ ─ Default State (no input typed) ─ ─ ─ ─ ─   ║
║                                                          ║
║  RECENT                                    Clear all     ║
║  ○ Celestia                               ✕             ║
║  ○ Arbitrum                               ✕             ║
║  ○ Aave                                   ✕             ║
║  ────────────────────────────────────────────────────    ║
║  TRENDING THIS WEEK                                      ║
║  ○ Monad                                                 ║
║  ○ Eigen Layer                                           ║
║  ○ Story Protocol                                        ║
║  ────────────────────────────────────────────────────    ║
║  POPULAR PROJECTS                                        ║
║  ○ Bitcoin                                               ║
║  ○ Ethereum                                              ║
║  ○ Solana                                                ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                    (keyboard occupies this area)         ║
╚══════════════════════════════════════════════════════════╝
  Bottom nav is HIDDEN while keyboard is focused
```

**The input is never blank on arrival.** Always shows Recent → Trending → Popular before the user types anything. This is mandatory — a blank search input with no suggestions forces the user to think of a query with zero help (DESIGN_SYSTEM Anti-pattern 9).

### 3.3 Search Input States

| State | Appearance | Behavior |
|---|---|---|
| **Placeholder** | "Search projects, funds..." in `neutral-text-tertiary` | Shows Recent/Trending/Popular sections below |
| **Focused (empty)** | Cursor visible, placeholder fades but stays until typing begins | Same as placeholder state — sections unchanged |
| **Typed (1+ characters)** | Input text in `neutral-text-primary`, "✕" clear button appears (44×44 tap zone) | Switches to Typed results state below (debounced 200ms) |
| **Cleared** | "✕" removed, placeholder restores | Returns to Recent/Trending/Popular |

### 3.4 Default State Sections (no input)

#### Recent Searches

```
RECENT                                      Clear all
```
- Section header: "RECENT" in `type-title` + "Clear all" in `type-button`, `color-accent` (right)
- Up to 5 recent searches stored locally (client-side only, not synced)
- Each row: Search Result Card (48px) — circle (○, 20px) + name + "✕" remove button (right, 44×44 tap zone)
- "✕" removes that individual recent entry. "Clear all" removes all recent entries simultaneously
- On "Clear all": rows fade out in a 150ms staggered sequence (30ms per row), section header disappears
- Tapping a recent row fills the input and triggers the Typed state immediately (no navigation)
- **Ordering:** Most recent first (chronological descending)
- **Empty:** Section is hidden when no recent searches exist — never shows "No recent searches" message

#### Trending Searches

```
TRENDING THIS WEEK
```
- Section header: "TRENDING THIS WEEK" in `type-title` — no action
- Up to 5 trending searches (server-provided, refreshed daily)
- Each row: Search Result Card (48px) — entity logo + name (no remove button — not personal data)
- These are projects/funds currently attracting search activity across all users
- Tapping a trending row fills the input and triggers Typed state immediately

#### Popular Projects

```
POPULAR PROJECTS
```
- Section header: "POPULAR PROJECTS" in `type-title` — no action
- Up to 5 high-Score projects (server-provided, updated weekly with Weekly Picks)
- Each row: Search Result Card (48px) — Token Logo + name
- These are editorially significant, not algorithmically trending
- Tapping a popular row fills the input and triggers Typed state immediately

### 3.5 Typed State (instant results)

Activates as the user types, debounced at 200ms to avoid querying on every keystroke.

```
╔══════════════════════════════════════════════════════════╗
║ ← [🔍  aave                                        ✕]  ║  44px input
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  PROJECTS                                        2       ║
║  ○ Aave          [DeFi]                                  ║
║  ○ Aave V3 (Deprecated)  [DeFi]                          ║
║  ────────────────────────────────────────────────────    ║
║  FUNDS                                           1       ║
║  [●] Aave Grants DAO                                     ║
║                                                          ║
║  ─ ─ ─ ─ ─ ─ "3 results for aave" ─ ─ ─ ─ ─ ─ ─      ║  (muted caption)
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                    (keyboard occupies this area)         ║
╚══════════════════════════════════════════════════════════╝
```

**Category grouping:**
- Results grouped by type: PROJECTS first, then FUNDS
- Section header for each: category name in `type-title` + result count (numeric, `neutral-text-secondary`) in `type-caption`
- If a category has zero results, its section header is hidden entirely
- If both categories have zero results: show Empty State ("No results for "{query}"") with a suggested action ("Try a different name or ticker")

**Result ordering within category:**
- Ordered by relevance (prefix match > substring match > fuzzy), not Score
- Maximum 5 results per category inline (no "see all within category" needed — typing more refines results naturally)

**Result appearance animation:**
- Each result row fades in individually, staggered 20ms per row, ease-out
- Maximum stagger animation: 5 rows × 20ms = 100ms total entrance
- No exit animation — results clear instantly on next keystroke

**Instant results:** No loading state for results < 200ms. If results take > 200ms (network query): show a single skeleton row per category while loading, then animate real results in.

### 3.6 Project Result Card

```
┌──────────────────────────────────────────────────────┐  48px
│  [●] Project Name        [DeFi]                      │
└──────────────────────────────────────────────────────┘
  Token Logo (28px) + name type-subtitle + optional Tag (type-badge)
```

**Maximum content: name + logo + optional one Tag.** No Score, no price, no trend — by design. Score is only revealed after opening Project Detail. This is the strictest hard rule in the Search design.

**Tag logic:** Show category Tag only if the project name alone is ambiguous (e.g., "Aave" is unambiguous; a query for "usd" where multiple stablecoins appear benefits from category tags "DeFi", "CDP", "RWA").

**Tap behavior:** Navigates to Project Detail. Adds the project name to Recent Searches.

### 3.7 Fund Result Card

```
┌──────────────────────────────────────────────────────┐  48px
│  [●] Fund Name                                       │
└──────────────────────────────────────────────────────┘
  Fund Logo (28px) + name type-subtitle (no Tag for funds — category is always "VC/Fund")
```

Identical spec to Project Result Card, without the Tag. Fund entities are visually distinct from project entities only by using the Fund Logo primitive (not Token Logo) — same circular mask, different primitive name to prevent accidental Score rendering.

---

## 4. Sticky Elements

### 4.1 Sticky Header Behavior

**On Home:**

| Scroll position | Header state | Height | Content |
|---|---|---|---|
| 0–60px | Expanded | 56px | "Hi, [name] 👋" + bell icon |
| 60–120px | Transitioning | 56px → 44px | Greeting fades out (opacity: 1→0), search icon fades in (opacity: 0→1), over 60px of scroll |
| 120px+ | Collapsed | 44px | Search icon (left) + bell icon (right), glass effect active |

**Glass effect:** Activated once content scrolls beneath the header. Applies `blur-glass` to the header background. This is the only way to signal "header is now floating over content" without an opaque block that hides content.

**Never fully hide:** The header stays at minimum 44px at all times. It is the user's primary orientation anchor. Removing it causes "where am I?" confusion on a multi-section feed.

**On all other screens:**
- Header is always 56px
- No collapse/expand behavior
- Glass effect applies immediately (these screens don't have a hero element scrolling beneath the header)

### 4.2 Bottom Navigation (always sticky)

The bottom navigation never scrolls with content. It is fixed to the bottom of the viewport at all times on all 5 primary tabs. The only exception is keyboard focus (Search screen), where it slides down and hides.

**Content inset:** The scrollable body of every screen has a bottom padding equal to the bottom navigation height (90px) so the last item in any list is not obscured by the nav bar. This is enforced by the Sticky Footer layout component — not by each screen individually.

### 4.3 Filter Chips (Markets screen only)

On the Markets screen, the Filter Chips row sticks directly below the collapsed header once the user scrolls. This is specific to Markets and does not apply to Home.

---

## 5. Deep Linking

Every screen must be deep-linkable. Deep links are how push notifications route users directly to the relevant Project/Fund Detail.

| Screen | Deep link path (illustrative) |
|---|---|
| Home | `/home` |
| Search | `/search` |
| Search with query | `/search?q=aave` |
| Watchlist | `/watchlist` |
| Markets | `/markets` |
| Profile | `/profile` |
| Project Detail | `/project/{slug}` |
| Fund Detail | `/fund/{slug}` |
| Markets → Top Gainers | `/markets/gainers` |
| Markets → Unlock Calendar | `/markets/unlocks` |
| Markets → Recent Fundraises | `/markets/fundraises` |

**Notification routing:** Unlock Alert notification → `/project/{slug}` (opens Project Detail, scrolled to Unlock Schedule section). Score update → `/project/{slug}`. New fundraise → `/project/{slug}` (scrolled to Funding section).

**Behavior on deep link arrival:** The app loads the target screen directly. A "back" button appears on Level 2 screens even on deep link arrival — tapping it goes to Home (not the previous app state, since there is none).

---

## 6. Tab-Level State Preservation

| Leaving a tab | Returning to that tab |
|---|---|
| Home at any scroll position | Restored to exact scroll position |
| Search with query typed | Query cleared, returns to default state (Recent/Trending/Popular) |
| Watchlist at any scroll | Restored to exact scroll position |
| Markets at any scroll | Restored to exact scroll position AND active filter chip |
| Profile at any scroll | Restored to exact scroll position |

**Why Search clears on tab switch:** Search is a transactional screen — the user's intent is to find something specific and navigate away. Preserving a stale query on return creates confusion ("why is it still showing Aave results?"). The Recent Searches list is the persistence mechanism for "what I was looking at," not the query field itself.

---

## 7. Navigation Anti-Patterns to Avoid

1. **Never navigate to a new screen within a Bottom Sheet** — sheets are overlay detail, not navigation waypoints
2. **Never put a primary navigation action inside a Bottom Sheet** — duplicate of bottom nav is confusing
3. **Never push more than one level from Home in a single interaction** — Card tap → Project Detail is one level; tapping a fund from inside Project Detail adds one more level, then back navigation should return to Project Detail, not Home
4. **Never use a Modal for navigation** — Modals interrupt flow and must not be used as routers
5. **Never hide the bottom navigation on a primary tab screen** — even on deep sub-screens reachable from Home, the bottom nav stays visible
6. **Never auto-navigate without user intent** — data refreshes, score updates, and incoming notifications must never auto-navigate the user away from what they're currently reading
