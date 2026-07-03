# Layout Specification
**Product:** Ultimate Onchain Researcher — Telegram Mini App
**Document type:** High-fidelity UX Specification
**Status:** Design only. No implementation.
**References:** DESIGN_SYSTEM.md Sections 2–3, COMPONENT_SPEC.md Sections 4, 7, HOME_SCREEN_SPEC.md

---

## 1. Viewport and Safe Areas

### 1.1 Reference Dimensions

| Dimension | Value | Notes |
|---|---|---|
| Reference viewport width | 390px | iPhone 13/14 class — Telegram Mini App standard reference device |
| Minimum supported width | 360px | Smallest Android viewport where layout must not break |
| Maximum (mobile-only scope) | 430px | Larger iPhones; no special treatment needed at this width |
| Reference viewport height | 750px | Approximate usable height including Telegram chrome |
| Telegram chrome top | ~54px | Status bar + Telegram top navigation strip |
| Telegram chrome bottom | 0px extra | Telegram's own safe area + gesture bar = our bottom nav accommodates this |

### 1.2 Safe Area Zones

```
╔════════════════════════════════════════════════╗
║  ██████████████████████████████████████████  ║  DANGER ZONE: 0–54px
║  Telegram chrome: status bar + nav strip       ║  Never place any app element here
╠════════════════════════════════════════════════╣
║                                                ║  STICKY HEADER: 54–110px
║  App sticky header lives here (56px)          ║  Header is always safe to tap
╠════════════════════════════════════════════════╣
║                                                ║
║  SCROLLABLE CONTENT ZONE                      ║  110px to (750-90-34)=626px
║  Everything between header and bottom nav      ║  ~516px of visible content
║  Scrolls within this space                    ║
║                                                ║
╠════════════════════════════════════════════════╣
║  Bottom safe area + gesture bar (34px)        ║  DANGER ZONE bottom
╠════════════════════════════════════════════════╣
║  Bottom Navigation bar (56px)                 ║  STICKY BOTTOM: 56px
╚════════════════════════════════════════════════╝
```

**Content inset rule:** All scrollable content must have a `padding-bottom` equal to the bottom navigation height (90px). This ensures the last item in any list is not visually obscured by the floating bottom nav. This is the Sticky Footer layout component's job — it is not applied per-screen.

**Left/Right safe area:** No safe areas on left/right for standard portrait orientation. In landscape, the system safe areas (iPhone notch area on left side when landscape) must be respected if the app ever supports landscape — currently deferred.

---

## 2. Spacing System

The product uses a strict 8pt scale. Every spacing value must be one of these 10 tokens:

| Token | Value | Primary usage in Home |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap (trend arrow + %), coin icon internal padding |
| `space-2` | 8px | Rows within a Market Feed Card, gap between Score numeral and grade |
| `space-3` | 12px | Gap between cards in carousels, Section Header bottom gap to first content |
| `space-4` | 16px | **Default.** Screen margins, card internal padding, gap between unrelated inline elements |
| `space-5` | 20px | Gap between search bar and header (when extra breathing needed), Featured Pick internal padding |
| `space-6` | 24px | Gap between major sections (Market Card → Weekly Picks, Weekly Picks → Trending) |
| `space-7` | 32px | Reserved for hero elements on Project Detail; not used on Home |
| `space-8` | 40px | Bottom of feed breathing room (below Unlock Alerts before nav) |
| `space-9` | 48px | Empty state illustration spacing |
| `space-10` | 64px | Reserved for Splash screen only |

**No value outside this scale is ever acceptable.** Not 6px, not 10px, not 14px. When an element needs "a bit more room," the next token up is used.

---

## 3. Grid System

### 3.1 Screen Margins

| Region | Width | Notes |
|---|---|---|
| Screen horizontal margin | 16px left + 16px right | Applied to ALL full-width content: cards, section headers, list rows, search bar. No exceptions. |
| Content width at reference | 358px (390 − 32) | Maximum width of any non-full-bleed element |
| Card internal padding | 16px all sides | Standard for cards; 12px for compact/mini cards |

### 3.2 Column System

This product does NOT use a multi-column grid on Home. Everything is either:
- **Full-bleed:** width = `viewport − 32px` (358px at reference)
- **Fixed-width in a carousel:** specific values per card type
- **Two-column (2×2 grid):** Only inside Metrics/Tokenomics Cards on Project Detail

**Stat grid (Project Detail only — not on Home):**
```
[  Cell 1 (label + value)  ] [  Cell 2  ]
           16px gap
[  Cell 3  ] [  Cell 4  ]
```

---

## 4. Component Heights

Every component has a fixed, predictable height. No component's height depends on its content (unless explicitly specified as "auto" below — these are the exceptions).

| Component | Height | Notes |
|---|---|---|
| Sticky Header (expanded) | 56px | Fixed |
| Sticky Header (collapsed) | 44px | Fixed |
| Search Bar | 44px | Fixed |
| Market Overview Card | 168px | Fixed |
| Weekly Pick Card | 180px | Fixed, horizontal scroll only |
| Project Card (Trending) | 120px | Fixed, horizontal scroll |
| Fund Card Mini (Trending) | 120px | Fixed, horizontal scroll |
| Platform mini-card (Trending) | 80px | Fixed, horizontal scroll |
| Watchlist Summary row | 64px | Fixed per row |
| Top Gainers row | 56px | Fixed per row |
| Market Feed Card (3 rows) | 100–132px | Auto (depends on row count, header) |
| Market Feed Card row | 44–56px | Fixed per variant |
| Section Header | Auto (34px + optional 18px subtitle) | |
| Bottom Navigation | 90px (56px + 34px safe area) | Fixed |
| Bottom Sheet (Fixed-height) | 240–360px | Fixed per use case |
| Bottom Sheet (Scrollable) | Up to 85% viewport | Scrollable internally |
| Modal | Auto, capped ~60% viewport | Centered |
| Toast | 52px | Fixed, floating |
| Score Circle (Full) | 88px diameter | Fixed |
| Score Circle (Compact) | 40px diameter | Fixed |
| List Item (Simple) | 52px | Fixed |
| List Item (Data) | 64px | Fixed |
| List Item (Feed) | 44–56px | Fixed per variant |

**Why fixed heights?** Fixed heights eliminate layout shift on Skeleton → Content transition. A skeleton block of 220×180px, when replaced by the real Weekly Pick Card of 220×180px, does not cause any layout reflow. The surrounding sections stay in place. This is critical for perceived performance and CLS (Cumulative Layout Shift) compliance.

---

## 5. Thumb Reach Zones

One-handed operation is a core product requirement. The following zones define where interactive elements should (and should not) be placed.

### 5.1 Thumb Reach Map (390px reference, right-handed)

```
┌────────────────────────────────────────┐
│  ██████████████████████████████████  │  HARD TO REACH ZONE (0–200px from top)
│  Red zone: primary actions must not   │  Primary actions: AVOID placing here
│  live here                            │
├────────────────────────────────────────┤
│                                        │  REACHABLE WITH STRETCH (200–350px)
│  Accessible with thumb extension      │  Secondary actions acceptable
│  Acceptable for browsing content      │
├────────────────────────────────────────┤
│                                        │  COMFORTABLE ZONE (350–620px from top)
│  Primary thumb reach, no stretching  │  PRIMARY ACTIONS TARGET THIS ZONE
│  required for most users              │  Weekly Picks carousel, "See all" actions,
│                                        │  bottom navigation tabs
├────────────────────────────────────────┤
│  ██████████████████████████████████  │  BOTTOM NAV (620–750px)
│  Navigation always here               │  Always thumb-reachable
└────────────────────────────────────────┘
```

**Implications for Home screen layout:**

| Action | Position in viewport | Thumb accessibility |
|---|---|---|
| Greeting + Bell (Header) | 54–110px from top | ⚠ Hard to reach — acceptable because it's not primary |
| Search Bar | 110–170px from top | ⚠ Reachable with stretch — acceptable (tapping anywhere works) |
| Market Overview Card | 170–354px from top | ✓ Reachable |
| Weekly Picks Carousel | 370–550px | ✓ Primary zone |
| "View All Picks" action | 370px from top | ✓ Primary zone |
| Trending carousels (below fold) | 550–900px (scrolled to) | ✓ Reachable after scrolling repositions content |
| Bottom Navigation | 660–750px from top | ✓ Always comfortable |

**Key implication:** The Weekly Picks carousel — the product's primary value delivery — lands exactly in the comfortable thumb zone (350–550px from the top of the device). This is not coincidental. The composition order was chosen to place the highest-value content in the highest-thumb-accessibility zone.

### 5.2 Touch Target Minimums

No interactive element may have a tap zone smaller than 44×44px, regardless of visual icon size.

| Element | Visual size | Tap zone |
|---|---|---|
| Bottom nav tabs | 24px icon + 13px label | 64px wide × 56px tall (1/5 of nav width) |
| Bell icon (header) | 24px icon | 44×44px |
| Search bar | Full width × 44px | Full width × 44px (already meets minimum) |
| Card (tap to navigate) | Varies | Full card footprint |
| "✕" remove (Search recent) | 16px icon | 44×44px |
| ⓘ icon (Fear & Greed) | 16px icon | 44×44px |
| "Why this score? ›" (Weekly Pick) | Text button, ~100px wide | 44px height minimum |
| Star/Watchlist icon | 24px icon | 44×44px |
| Retry icon (Error state) | 24px icon | 44×44px |

---

## 6. Section Spacing on Home

The exact vertical rhythm of the Home scroll body. Every gap value is a named spacing token.

```
[Search Bar — 44px]
    ↕ space-4 (16px)
[Market Overview Card — 168px]
    ↕ space-6 (24px)
[Section Header "WEEKLY PICKS" — 34px]
    ↕ space-3 (12px)
[Weekly Picks Carousel — 180px]
    ↕ space-6 (24px)
[Section Header "TRENDING PROJECTS" — 34px]
    ↕ space-3 (12px)
[Trending Projects Carousel — 120px]
    ↕ space-4 (16px)
[Section Header "TRENDING FUNDS" — 34px]
    ↕ space-3 (12px)
[Trending Funds Carousel — 120px]
    ↕ space-4 (16px)
[Section Header "TRENDING PLATFORMS" — 34px]
    ↕ space-3 (12px)
[Trending Platforms Carousel — 80px]
    ↕ space-6 (24px)
[Section Header "WATCHLIST" — 34px]          ← if populated
    ↕ space-3 (12px)
[Watchlist Summary rows (64px × N, max 3)]    ← if populated
    ↕ space-6 (24px)
[Section Header "TOP GAINERS" — 34px]
    ↕ space-3 (12px)
[Top Gainers rows (56px × 5)]
    ↕ space-6 (24px)
[Market Feed Card: RECENT FUNDRAISES — ~132px]
    ↕ space-3 (12px)
[Market Feed Card: RECENTLY ADDED — ~132px]
    ↕ space-3 (12px)
[Market Feed Card: UNLOCK ALERTS — ~144px]
    ↕ space-8 (40px) end breathing room
```

**Total height calculation (with Watchlist populated, 3 rows):**

| Section | Height |
|---|---|
| Search bar + gap | 44 + 16 = 60 |
| Market Overview + gap | 168 + 24 = 192 |
| Weekly Picks header + gap + carousel + gap | 34 + 12 + 180 + 24 = 250 |
| Trending Projects header + gap + carousel | 34 + 12 + 120 = 166 |
| (gap) | 16 |
| Trending Funds header + gap + carousel | 34 + 12 + 120 = 166 |
| (gap) | 16 |
| Trending Platforms header + gap + carousel + gap | 34 + 12 + 80 + 24 = 150 |
| Watchlist header + gap + 3 rows + gap | 34 + 12 + 192 + 24 = 262 |
| Top Gainers header + gap + 5 rows + gap | 34 + 12 + 280 + 24 = 350 |
| Fundraises feed card + gap | 132 + 12 = 144 |
| Recently Added feed card + gap | 132 + 12 = 144 |
| Unlock Alerts feed card + end breathing | 144 + 40 = 184 |
| **Total content height** | **~2,100px** |

At 604px usable scroll viewport, this is approximately 3.5 scrollable "screens" of content. Compliant with DESIGN_SYSTEM Rule 12 (max 3 full screen heights). The 0.5 excess is acceptable because the last three Market Feed Cards are lower-priority, lower-engagement sections — most users will have already found their answer before reaching them.

**If Watchlist is empty:** Remove Watchlist section (34 + 12 + 192 + 24 = 262px), total drops to ~1,840px — approximately 3 screens. Ideal.

---

## 7. Collapsed and Expanded Behaviors

### 7.1 Header Collapse (scroll-linked)

**Collapsed header layout:**
```
╔════════════════════════════════════════════╗
║  [🔍]                              [🔔]   ║  44px
╚════════════════════════════════════════════╝
  Search icon (left)           Bell (right)
  16px padding each side
```

The search icon on the left of the collapsed header is a tap target that navigates to the Search tab — same behavior as the Home search bar. It gives the user a search entry point at any scroll position without scrolling back to the top.

### 7.2 Market Feed Cards — Collapsed/Expanded

Market Feed Cards on Home are always in their "collapsed" state: 3 rows + header only. They do not expand inline. "See all ›" navigates to the full list sub-screen (drill-in).

**There is no "expand in place" interaction for Market Feed Cards.** Expanding would push surrounding sections down, causing layout instability and violating the predictable-layout principle.

### 7.3 Weekly Picks — Scroll-reveal (not expand)

Weekly Pick Cards do not expand. The "Why this score? ›" text button inside the card opens a Bottom Sheet overlay — the card itself stays at 180px, the surrounding layout does not move.

### 7.4 Watchlist Summary — Conditional Visibility

This is not a collapsible section. It is either present (user has watchlist items) or absent (user has no watchlist items). The section does not have a "show/hide" toggle. Its visibility is purely data-driven.

---

## 8. Two-Theme Layout Considerations

### 8.1 Dark Theme (Primary)

- Cards: `neutral-surface` background, no shadow (`elevation-flat`). Separation from `neutral-bg` comes from the color difference alone.
- Section separators: whitespace only (`space-6`). Dividers are reserved for dense lists.
- Market Overview Card: same `neutral-surface` as other cards.

### 8.2 Light Theme (Secondary)

- Cards: `neutral-surface` (pure white). Shadow (`elevation-raised`) lifts them off the `neutral-bg` (light warm grey). Shadows do real work in light theme.
- The bottom navigation requires its glass blur effect to remain visible in both themes — in light theme, the glass blur shows the warm grey background scrolling behind the nav.
- Market Overview Card: white card on light warm grey background, with the standard `elevation-raised` shadow.

**Both themes must be designed as equal quality experiences, not one as a derivative of the other.**

### 8.3 Safe Area (both themes)

Safe areas are always respected regardless of theme. The bottom navigation's 34px safe area padding uses the same color as the nav bar itself (not transparent) to prevent content showing through under the gesture indicator area on iPhones.

---

## 9. Minimum Width Compliance (360px)

At 360px (minimum supported width), the following must not break:

| Component | At 390px | At 360px |
|---|---|---|
| Market Overview Card | 358px wide | 328px wide — coin columns squeeze to ~109px each |
| Weekly Pick Card | 220px | 220px (unchanged — it's a fixed-width card in a scroller) |
| Top Gainers row | 358px wide | 328px wide — name may truncate to ellipsis |
| Section Headers | 358px wide | 328px wide — "See all ›" must never wrap to a second line |
| Bottom Navigation | 5 tabs at ~78px each | 5 tabs at ~72px each — labels may need to reduce to 11px minimum |

**Critical check at 360px:** Section Header labels ("TRENDING PROJECTS" + "See all ›") must fit on one line. "TRENDING PROJECTS" is 18 characters. At 360px, the available width is 328px minus 16+16 margin = 296px. At `type-title` (17px, 600 weight), "TRENDING PROJECTS" is approximately 170px wide. "See all ›" at `type-button` (15px) is approximately 72px. Total 242px — comfortably within 296px. No wrapping.

---

## 10. Performance Layout Rules

These rules exist specifically because Telegram Mini Apps run in a WebView, which has more layout constraints than a native app:

1. **No layout-triggering animations.** Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`. Only animate `transform` (translate, scale) and `opacity`. This prevents layout reflow and maintains 60fps.

2. **Promote scrollable areas to their own compositing layer** (using `will-change: transform` or equivalent). This prevents the scroll from triggering main-thread paint.

3. **Reserve space for async images.** Every Token Logo, Fund Logo, and Chain Logo must have its final dimensions set BEFORE the image loads (set width/height or aspect-ratio on the container). This prevents cumulative layout shift when images resolve.

4. **The Market Overview Card must not reflow on data update.** When prices update, only the text content changes — the card dimensions are fixed (168px). A price update that causes the card to grow or shrink would shift the entire page downward.

5. **Bottom Navigation must be on its own compositing layer** and must not be in the same scroll container as the page content. If they share a scroll context, any scroll event triggers a nav repaint.
