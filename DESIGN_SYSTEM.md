# Design System — Crypto Research Telegram Mini App

**Status: source of truth.** Every future UI implementation (React or otherwise) must conform to this document. If a screen or component isn't described here, extend this document first — do not improvise in code. This document is design-only: no markup, no styling syntax, no framework references.

Grounded in: `SYSTEM_ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`, `UX_DESIGN.md`, and the high-fidelity wireframe pass (Home/Search/Project Detail/Watchlist/Markets/Profile, 5-tab navigation, Market Overview card, Weekly Picks hero).

---

# 1. Product Philosophy

## Design Vision
A premium, single-purpose research companion that lives inside Telegram. It should feel like a **boutique research desk**, not a trading terminal and not a social feed. Every visit should feel fast, calm, and opinionated — the app has a point of view about what matters today, and shows that point of view first.

## UX Goals
- Answer **"what should I research today?"** within the first viewport of Home, with zero scrolling.
- Make the **Score** the universal unit of judgment across the entire app — once a user understands it on Home, it must mean exactly the same thing everywhere else (Watchlist, Markets, Search results excluded by design — see Section 14).
- Never force a decision the user didn't ask for. Every screen answers exactly one question; everything else is one tap away, not on the surface.
- Reduce time-to-confidence: a beginner should be able to form an opinion about a project in under 15 seconds on Project Detail, before reading a single raw metric.

## Information Hierarchy
Three permanent tiers, used consistently across every screen in the product:

1. **Verdict tier** — Score, grade, trend direction, risk flags. Always the first thing rendered in any content block about an entity.
2. **Evidence tier** — funding, tokenomics, metrics, unlock schedule. Supports the verdict; never precedes it.
3. **Exploration tier** — related projects, "see all," other entry points. Always last; always visually quieter (smaller type, muted color, no card chrome).

## Core Principles
- **Verdict before data.** Never show a raw number without first showing what it means.
- **One accent, used sparingly.** Premium feeling comes from restraint, not saturation — see Section 5.
- **Depth on demand.** Every screen shows a *summary*; full detail is always one deliberate tap away (a sheet, a sub-screen, a "see all"), never inline by default.
- **Consistency over novelty.** A Score looks the same on Home, Watchlist, Markets, Search, and Project Detail. A Card behaves the same everywhere it appears.
- **Mobile-first, one-handed.** Every primary action sits in the bottom half of the screen or is reachable via a thumb-friendly sticky element. Nothing critical lives in a top-corner-only position.
- **Calm under load.** High information density is achieved through layout discipline (Section 2–3), not by shrinking text or removing whitespace.

---

# 2. Mobile Grid System

| Property | Value | Notes |
|---|---|---|
| Reference viewport width | **390px** | iPhone 13/14 class — Telegram Mini App default reference device |
| Minimum supported width | 360px | Smallest common Android Mini App viewport; layout must not break here |
| Safe area — top | 44–54px | Reserved for Telegram's own chrome; first app pixel starts below this |
| Safe area — bottom | 34px | Home indicator area; bottom nav content must sit above this, not under it |
| Screen horizontal margin | 16px | Applied to every screen's left/right edge, no exceptions |
| Content padding (inside cards/sheets) | 16px | Standard internal padding for any container component |
| Maximum content width | viewport − 32px (i.e. 358px at reference width) | No component should exceed this except full-bleed horizontal scrollers |
| Scrollable area | Everything between the sticky header and the bottom nav | Default behavior for every screen unless stated otherwise |
| Sticky area — top | Header (56px) | Persists across scroll; may collapse/shrink (see Section 10) but never fully disappears except during text-input focus (Search) |
| Sticky area — bottom | Bottom Navigation (90px = 56px bar + 34px safe area) | Persists on all 5 primary tabs; hidden only on Splash, Login, and while a keyboard is focused |
| Bottom Navigation height | 56px bar height + 34px safe area = 90px total | 5 equal-width tap zones, minimum 64px each at reference width |
| Header height | 56px | Title/back/action icons only — never a place for data |
| Card width rules | Full-bleed cards: viewport − 32px. Horizontal-scroll mini-cards: fixed 140–220px depending on density (see Section 9). Never let a card's width depend on its content — fixed widths only, to keep scroll rhythm predictable | |

---

# 3. Spacing System (8pt scale)

All spacing in this product is a multiple of 4, with 8 as the base unit. Never use an arbitrary value outside this scale.

| Token | Value | Primary usage |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap inside a tight row (e.g. trend arrow to %), divider insets |
| `space-2` | 8px | Gap between stacked text lines inside a component (label → value), gap between list rows in a dense list |
| `space-3` | 12px | Internal padding of compact components (chips, badges, small buttons), gap between cards in a horizontal scroller |
| `space-4` | 16px | **The default.** Screen margins, card internal padding, gap between unrelated inline elements |
| `space-5` | 20px | Gap between a section header and its first content row when extra separation is needed for visual breathing room |
| `space-6` | 24px | Gap between major sections on a screen (e.g. Market Overview → Weekly Picks) |
| `space-7` | 32px | Gap before/after a hero element (Score card, Hero on Project Detail) |
| `space-8` | 40px | Vertical centering offsets on Splash/Login/Empty States |
| `space-9` | 48px | Reserved for large empty-state illustration spacing |
| `space-10` | 64px | Reserved for top-of-screen breathing room on Splash only |

**Rule of thumb:** spacing *within* a component uses 4/8/12; spacing *between* components uses 16; spacing *between sections* uses 24; spacing around hero/empty moments uses 32+.

---

# 4. Typography

Single type family across the app (a geometric/grotesque sans, system-default acceptable — e.g. SF Pro on iOS, Roboto on Android, falling back to Telegram's own font stack). No more than the 10 styles below exist; do not invent new ones in implementation.

| Style | Weight | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| **Display** | Bold (700) | 28px | 34px | −0.2px | Splash tagline, large empty-state headlines only — rare, ceremonial |
| **Heading** | Bold (700) | 20px | 26px | −0.1px | Screen titles, project/fund name on Hero |
| **Title** | Semibold (600) | 17px | 22px | 0px | Section headers ("WEEKLY PICKS"), card titles |
| **Subtitle** | Medium (500) | 15px | 20px | 0px | Section subtitles, secondary row text, list item primary text |
| **Body** | Regular (400) | 15px | 22px | 0px | Paragraph text, "Why this score" rows, descriptions |
| **Caption** | Regular (400) | 13px | 18px | 0.1px | Labels above values, timestamps, muted helper text |
| **Badge** | Semibold (600) | 11px | 14px | 0.2px | Grade letters, status pills, membership tag text |
| **Button** | Semibold (600) | 15px | 20px | 0px | All button labels, text-links ("See all", "View All Picks") |
| **Numeric** | Semibold (600) | 17px | 22px | −0.1px | Prices, percentages, stat values in grids/cards |
| **Score** | Bold (700) | 36px | 40px | −0.5px | The Score number only — the single largest numeral in the entire app, reserved exclusively for this purpose |

**Rule:** the **Score** style must never be reused for any other number (price, TVL, market cap) — its visual exclusivity is what makes the Score legible as "the verdict" at a glance.

---

# 5. Color System

## Philosophy
One primary accent only. Crypto products over-use color (green/red everywhere, rainbow category tags) until nothing reads as important. This system reserves saturated color for exactly three jobs: **the single accent** (brand/primary actions), **directional/semantic state** (gain/loss, risk, success/error), and **the Score gradient** (the product's one proprietary visual signature). Everything else is neutral.

## Theme priority
**Dark theme is primary** — it matches Telegram's own dominant aesthetic, reduces eye strain for "fast scrolling" sessions, and reads as more premium for a financial product (matches Binance, matches most trading terminals). Light theme is a fully-specified secondary, not an afterthought — see Section 12 (Theme setting in Profile).

## Primary Accent
- One accent hue only, used for: primary buttons, active nav icon, active tab indicator, selected chip/segment, links, focus rings.
- **Psychology:** an indigo/violet-leaning blue is recommended over green or orange. Green/orange are already claimed by gain/loss and warning semantics in this product — reusing either as the brand accent would make "is this a price signal or a brand element?" ambiguous. Blue-violet reads as trustworthy, premium, and financial without colliding with any semantic meaning elsewhere in the UI.
- Never use a second accent hue anywhere. "Premium" is reinforced by restraint — a product with one disciplined accent color reads as more expensive than one with five.

## Neutral Colors (Dark theme — primary)
| Token | Role |
|---|---|
| `neutral-bg` | App background, near-black, not pure black (pure black is harsh on OLED for long sessions) |
| `neutral-surface` | Card/component background, one step lighter than `bg` |
| `neutral-surface-elevated` | Sheets, modals, the Score card — two steps lighter than `bg` |
| `neutral-border` | Hairline dividers, card outlines — very low contrast, barely visible |
| `neutral-text-primary` | Near-white, main text |
| `neutral-text-secondary` | Mid-grey, captions/labels |
| `neutral-text-tertiary` | Low-contrast grey, disabled/placeholder text |

## Neutral Colors (Light theme)
Same role set, inverted luminance: `bg` near-white (not pure white — a very light warm-neutral grey reduces glare), `surface` pure white, `surface-elevated` white with a soft shadow (shadows do real work in light theme — see Section 7), text colors inverted to near-black/dark-grey/mid-grey.

## Semantic Colors
| Token | Hue family | Usage |
|---|---|---|
| `success` | Green | Confirmations, positive toasts, "funding quality: strong" |
| `warning` | Amber/Yellow | Caution states, "unlock risk: moderate," non-blocking alerts |
| `danger` | Red | Errors, destructive actions, "unlock risk: high" |
| `info` | Blue (distinct shade from primary accent — cooler/greyer) | Neutral informational banners, tooltips |

## Bullish / Bearish
- `bullish` = same green family as `success` (reinforces "green = good" universally, never break this mapping)
- `bearish` = same red family as `danger`
- Used exclusively for price/percentage direction (24h %, score deltas) and their accompanying trend arrows. Never used for anything non-directional.

## Fear & Greed Colors
A 5-step gradient, mapped to the index's standard bands, used only on the Market Overview card's Fear & Greed value and its optional detail sheet:
| Band | Label | Color family |
|---|---|---|
| 0–24 | Extreme Fear | Deep red |
| 25–44 | Fear | Orange |
| 45–55 | Neutral | Neutral grey-yellow |
| 56–75 | Greed | Yellow-green |
| 76–100 | Extreme Greed | Saturated green |

## Score Colors
A 4-band system tied to the existing grade scale (A+/A/B/C/D — see backend `Grade` type):
| Grade | Color family | Notes |
|---|---|---|
| A+ / A | `success` green | "strong" |
| B | A blue-teal (distinct from both success-green and the primary accent) | "solid, not exceptional" — deliberately not yellow, to avoid implying caution |
| C | `warning` amber | "mixed" |
| D | `danger` red | "weak" |

The Score *number* itself (the 36px numeral) is always rendered in `neutral-text-primary` (white/near-black), never in the grade color — only the grade badge/progress-bar fill uses grade color. This keeps the headline number legible and premium rather than looking like a stoplight.

## Funding Quality Colors
Three states only (matches the Weekly Pick card's "Funding Quality" field): **Strong** (`success`), **Moderate** (neutral grey-blue, not a warning color — moderate funding isn't bad, it's just not exceptional), **Weak/Unknown** (`neutral-text-tertiary`, deliberately desaturated — absence of strong signal is not the same as a warning).

## Unlock Risk Colors
Three states, intentionally reusing the semantic triad directly (this is a real risk signal, unlike Funding Quality): **Low risk** = `success`, **Moderate risk** = `warning`, **High risk** = `danger`.

## Hard rule
Never introduce a category-color system (one color per project category/chain). This is the single most common way crypto products turn "organized" into "noisy" — category is always communicated via text/icon, never via a dedicated hue.

---

# 6. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8px | Chips, small inline tags, skeleton blocks for text lines |
| `radius-md` | 12px | Buttons, list-row cards (compact density), input fields |
| `radius-lg` | 16px | Standard cards (Weekly Pick card, Market Overview card, Project Detail sections) |
| `radius-xl` | 20px | Hero-level cards/illustrations, the Score card specifically |
| `radius-sheet` | 24px (top corners only) | Bottom Sheets — larger than any card radius, signals "this is a temporary overlay, not page content" |
| `radius-avatar` | 50% (full circle) | All avatars and project/fund logos, no exceptions — square logos are masked into circles |
| `radius-badge` | 6px | Notification badges, small status indicators |
| `radius-pill` | 999px (fully rounded) | Segmented controls, filter chips, membership tag, grade badges |

**Rule:** radius scales with a component's "weight" — bigger, more important surfaces get bigger radii. Never mix radius tokens within the same component family (e.g. all cards in a horizontal scroller use the same radius).

---

# 7. Elevation

## Shadow levels
| Level | Token | Usage |
|---|---|---|
| 0 | `elevation-flat` | Default state for most surfaces in dark theme — no shadow, separation comes from `neutral-surface` vs `neutral-bg` contrast alone |
| 1 | `elevation-raised` | Cards on light theme; subtle shadow, barely perceptible, used to lift content off the page |
| 2 | `elevation-floating` | Sticky header once content has scrolled beneath it (both themes) — signals "this is now floating over content" |
| 3 | `elevation-overlay` | Bottom Sheets, Modals, Toasts — strongest shadow in the system, reserved for temporary overlays only |
| 4 | `elevation-popover` | Tooltips, small contextual popovers — strong but small-radius shadow |

## Surface hierarchy
`bg` (base) → `surface` (cards) → `surface-elevated` (sheets, modals, the Score card) → `overlay` (scrims behind modals/sheets, semi-transparent black regardless of theme). Each step up is both lighter (dark theme) and (optionally) more elevated.

## Glass effect rules
A frosted/translucent blur effect is permitted in exactly two places: the **sticky top header** once scrolled (content visible faintly behind it) and the **bottom navigation bar**. This reinforces "these are floating over your content," consistent with both Apple HIG and Telegram's own chrome language. Glass effect must never be used on cards or sheets — it's reserved for *persistent navigation chrome only*, so its meaning stays consistent.

## When to avoid shadows
- Never stack shadows on dark theme surfaces that are already distinguished by background-color contrast — double-signaling elevation (color *and* shadow) reads as visually heavy and dated.
- Never use a shadow on a full-bleed section (e.g. Market Feed compact cards sitting directly on the page background) — shadows are for surfaces that need to look "lifted," not for default content blocks.
- Never use elevation level 3 (overlay-strength shadow) on anything that isn't a temporary, dismissible surface.

---

# 8. Iconography

## Recommended icon style
**Outline-first**, consistent stroke-based icon set (the Apple HIG / Binance convention — never mix outline and filled icons within the same screen except for the one rule below). Geometric, rounded line-caps, no decorative detail — icons must read clearly at 20px.

## Sizes
| Token | Value | Usage |
|---|---|---|
| `icon-xs` | 16px | Inline with Caption text (trend arrows next to %, small inline indicators) |
| `icon-sm` | 20px | Inline with Body/Subtitle text, list row leading icons |
| `icon-md` | 24px | Header action icons (bell, back, share), bottom nav icons |
| `icon-lg` | 32px | Empty-state icons, standalone illustrative icons |
| `icon-xl` | 64–96px | Empty-state illustrations only |

## Stroke Width
1.5px at `icon-sm`/`icon-md`, scaling to 1.75px at `icon-lg`/`icon-xl` so larger icons don't look visually thinner than small ones. Never below 1.5px — thinner strokes disappear on small mobile displays.

## Filled vs Outline
- **Outline = default state** for every icon in the system.
- **Filled = active/selected state only** — specifically: the active bottom nav icon, a filled star once a project is watchlisted, a filled bell once notifications exist. This is the *one* place outline/filled are mixed, and the rule is consistent: filled always means "this is currently true/active," never decorative.

## Emoji usage rules
Emoji are permitted **only inside data content**, never inside chrome (headers, buttons, nav). Approved uses: semantic markers in list rows and section headers that benefit from instant recognition — 🔥 (trending), ⚠️ (risk/unlock alert), 🎓 (Academy membership badge), 💰 (fundraise feed), 🆕 (recently added). Maximum one emoji per row/section header. Never use emoji as a substitute for an icon in interactive elements (buttons, nav, inputs) — those always use the stroke icon set.

## Crypto logo usage
- All project/fund/chain logos rendered inside a circular mask (`radius-avatar`), consistent size per context (28px in list rows, 32px in compact cards, 56px on Project Detail Hero).
- **Fallback:** if no logo asset exists, render a circle filled with `neutral-surface-elevated` containing the entity's first 1–2 letters in `Caption` weight, centered — never show a broken-image icon.
- Logos are never square, never have their own drop shadow, and never sit directly against a colored background that could clash with the logo's own brand colors — always on `neutral-surface` or `neutral-bg`.

---

# 9. Component Library

Every component below is the **only** allowed implementation of its kind — do not create one-off variants in code. Each entry: Purpose · Variants · States · Spacing · When to use · When NOT to use.

### Button
- **Purpose:** primary call-to-action trigger.
- **Variants:** Primary (filled, accent color), Secondary (outline, neutral border), Destructive (filled, `danger`), Text (no container, accent-colored label only).
- **States:** default, pressed (scale 0.97 + slight opacity drop), disabled (40% opacity, no interaction), loading (label replaced by inline spinner, same dimensions).
- **Spacing:** 48px height, 16px horizontal internal padding, full-width minus 16px screen margins by default; inline buttons size-to-content with 12px horizontal padding.
- **Use:** one Primary button per screen maximum at any given time (e.g. "Continue with Telegram," "Retry").
- **Don't:** never stack two Primary buttons side by side — pair Primary with Secondary/Text instead.

### Icon Button
- **Purpose:** single-icon tap target with no label (header actions, watchlist star, share).
- **Variants:** Plain (icon only, transparent background), Contained (icon on a `neutral-surface` circular background — used when floating over imagery/content).
- **States:** default, pressed (background tint at 10% accent opacity), active/toggled (filled icon variant per Section 8), disabled.
- **Spacing:** 44×44px minimum tap target regardless of the icon's visual size (20–24px icon centered within).
- **Use:** header actions, list-row trailing actions.
- **Don't:** never use for a primary action that has a text label available — icon-only buttons are for well-understood, universal actions (back, share, favorite) only.

### Pill
- **Purpose:** compact, fully-rounded label for status or category.
- **Variants:** Neutral (default), Accent (active/selected), Semantic (success/warning/danger background tint).
- **States:** static (pills are not interactive by default) or selectable (see Segment Control/Chip below for interactive variants).
- **Spacing:** 6px vertical / 12px horizontal internal padding, `radius-pill`.
- **Use:** membership badge, grade label container.
- **Don't:** never put more than 2 words inside a pill.

### Chip
- **Purpose:** interactive filter selector (Markets' "Gainers/Losers/New").
- **Variants:** Default (outline), Selected (filled accent).
- **States:** default, selected, disabled.
- **Spacing:** 32px height, 12px horizontal padding, 8px gap between chips in a row, horizontally scrollable row.
- **Use:** Markets filter row only.
- **Don't:** never use Chips for navigation (that's Tabs/Segment Control's job) — Chips filter content in place, they don't navigate.

### Badge
- **Purpose:** small numeric/status indicator overlaid on another element (notification count, "new" dot).
- **Variants:** Dot (no content, just a colored circle), Counter (number, max display "9+").
- **States:** visible / hidden (no "empty badge" state — it's removed entirely when count is zero).
- **Spacing:** Dot = 8px diameter; Counter = min 16px diameter, scales with digit count; positioned top-right of its host icon, overlapping by ~25% of its own size.
- **Use:** bell icon (unread notifications), bottom nav icons (e.g. Watchlist tab badge if an alert exists), Watchlist row trailing dot.
- **Don't:** never use on more than one bottom nav icon simultaneously without strong justification — badge fatigue defeats its own purpose.

### Card
- **Purpose:** the base content container — every other card-type component below is a specialization of this.
- **Variants:** Standard (`radius-lg`, `elevation-flat`/`elevation-raised` per theme), Compact (`radius-md`, used for list-density feed cards).
- **States:** default, pressed (if tappable: background lightens slightly + scale 0.98).
- **Spacing:** 16px internal padding, 16px gap from screen edges, 12–16px gap between sibling cards.
- **Use:** any grouped, self-contained piece of content.
- **Don't:** never nest a Card inside another Card.

### Stat Card
- **Purpose:** display one labeled numeric value with optional trend.
- **Variants:** Single (one stat), Grid (2×2 — used in Market Metrics).
- **States:** default, skeleton (label renders, value shimmers).
- **Spacing:** label in `Caption` above value in `Numeric`, 4px gap; grid cells separated by 16px gutters.
- **Use:** Market Metrics, Tokenomics rows.
- **Don't:** never exceed 4 stats in a single Stat Card grid — split into two grids with section headers instead.

### Score Card
- **Purpose:** the product's signature component — displays the Overall Score + grade + visual progress indicator.
- **Variants:** Full (Project Detail — number + grade label + progress bar), Compact (embedded in Weekly Pick / list rows — number + small grade badge only, no progress bar).
- **States:** default, skeleton, updated (brief highlight animation on value change — see Section 10).
- **Spacing:** Full variant: 100px height, centered content, 16px internal padding, `radius-xl`, `elevation-raised`/`surface-elevated` background (this is the one card allowed to look "more important" than a Standard Card). Compact variant: inline, no dedicated card chrome, just the numeral + grade pill.
- **Use:** exactly once per entity, as the first content element after Hero on Project Detail; compact variant in any list/card showing an entity summary.
- **Don't:** never show a Score without an adjacent grade label — the raw number alone is not self-explanatory to a beginner.

### Project Card
- **Purpose:** summarize one project for Weekly Picks, Related Projects, Markets mini-cards.
- **Variants:** Hero (Weekly Picks — 220×180px, full data: Score/Funding/TVL/Unlock/Why?), Mini (Markets/Related — 140×120px, Score + trend only).
- **States:** default, pressed, skeleton.
- **Spacing:** per Section 2 card-width rules; 12px gap between cards in horizontal scrollers.
- **Use:** any horizontally-scrolling project summary context.
- **Don't:** never use Hero variant in a vertical list — Hero is exclusively for the horizontal Weekly Picks scroller.

### Fund Card
- **Purpose:** summarize one fund (Top Funds, Markets Trending Funds, Fund Detail header).
- **Variants:** List (logo + name + portfolio count, used in Top Funds list), Mini (Markets — logo + name + portfolio count, fixed-width).
- **States:** default, pressed, skeleton.
- **Spacing:** List variant 56–64px row height; Mini variant matches Project Card Mini dimensions for visual consistency in Markets.
- **Use:** anywhere a fund (not a project) needs summarizing.
- **Don't:** never show a Score on a Fund Card — funds don't have a Score, they have an avg. investor score and portfolio size; conflating the two metrics is a data-integrity UX mistake.

### Market Card
- **Purpose:** the Market Overview hero card on Home (BTC/ETH/BNB + Mkt Cap + Fear & Greed).
- **Variants:** single — this is a one-off composite card, not a repeatable pattern.
- **States:** default, skeleton (entire card shimmers as one unit, not per-field), error (inline retry within the card body).
- **Spacing:** 168px height, 16px internal padding, internal 3-column row + divider + 2-column row, per the Home wireframe.
- **Use:** Home only, always the first content block below the search bar.
- **Don't:** never duplicate this card on any other screen — it's a singular "today's weather" moment, not a reusable widget.

### List Item
- **Purpose:** the base row component for any vertical list (Watchlist, Search results, Market Feed lists, Profile rows).
- **Variants:** Simple (label + chevron, e.g. Profile), Data (leading icon/logo + label + trailing value, e.g. Watchlist), Feed (label + secondary line, e.g. Market Feed fundraise entries).
- **States:** default, pressed, skeleton.
- **Spacing:** 44–64px height depending on variant (Simple 52px, Data 64px, Feed 44–56px), 16px horizontal padding, hairline `neutral-border` divider between rows (inset 16px, not full-bleed).
- **Use:** any vertical, scannable list.
- **Don't:** never mix variants within the same list.

### Table Row
- **Purpose:** explicitly **not used** in this product. See Section 14, Rule: "Do not use tables on mobile." Any tabular data (e.g. funding rounds, unlock schedule) is restructured as List Item or Card components instead.

### Progress Bar
- **Purpose:** visualize a bounded value (Score out of 100, supply unlocked %).
- **Variants:** Linear (Score Card), Segmented (visual "dot" bar as shown in wireframes, used inside compact contexts).
- **States:** default, animated-fill (on first render and on value change — see Section 10).
- **Spacing:** 8px height (linear), full width of its container, `radius-pill`.
- **Use:** Score Card, supply-unlocked indicators.
- **Don't:** never use for anything unbounded (e.g. don't try to "progress-bar" a price).

### Tabs
- **Purpose:** switch between peer views that share the same screen context but show different *content sets* without changing the page itself (none currently in this product's screen set beyond Segment Control's use — reserved for future use, e.g. Project Detail "Overview / Activity" if added later).
- **Variants:** Underline (text label + animated underline indicator).
- **States:** default, active, disabled.
- **Spacing:** 48px height, equal-width segments, 16px horizontal padding per tab.
- **Don't:** never use Tabs and Segment Control interchangeably — Tabs are for navigation-like switching with an underline; Segment Control (below) is for filtering a list in place with a pill background.

### Segment Control
- **Purpose:** binary/ternary filter switch (Watchlist's Projects/Funds toggle).
- **Variants:** 2-segment, 3-segment max.
- **States:** default, selected (filled pill background per Section 6), disabled.
- **Spacing:** 36px height, `radius-pill` outer container, inner selected segment also pill-shaped with 4px inset.
- **Use:** Watchlist Projects/Funds.
- **Don't:** never use more than 3 segments — beyond that, use Chips instead.

### Bottom Navigation
- **Purpose:** primary, persistent navigation across the app's 5 top-level destinations.
- **Variants:** none — exactly one implementation, used everywhere.
- **States:** per-tab active (filled icon + accent color + label) / inactive (outline icon + `neutral-text-secondary`).
- **Spacing:** 90px total height (56px bar + 34px safe area), 5 equal-width zones, icon 24px + label `Caption` size with 4px gap, centered vertically within the 56px bar.
- **Use:** Home, Search, Watchlist, Markets, Profile — visible on all five, hidden on Splash/Login and during text-input focus.
- **Don't:** never add a 6th tab — if a new top-level destination is needed, it replaces an existing tab or becomes a sub-destination, see Section 16.

### Top App Bar
- **Purpose:** screen title + contextual actions, sticky.
- **Variants:** Static (title only, e.g. Watchlist, Profile, Markets), Greeting (Home — name + bell), Back+Title+Action (Project/Fund Detail — back, title, watchlist star/share), Search-input (Search screen only).
- **States:** expanded (default scroll position) / collapsed (post-scroll, shrunk per Section 10).
- **Spacing:** 56px height, 16px horizontal padding, icons `icon-md` (24px).
- **Use:** every screen.
- **Don't:** never put more than 2 trailing actions in the header — if more are needed, move them into an overflow sheet.

### Search Bar
- **Purpose:** text input for search, doubles as a navigational affordance on Home.
- **Variants:** Entry point (Home — non-editable-looking, tapping navigates to Search tab), Active (Search tab — real text input, auto-focused).
- **States:** placeholder, focused, typed (with clear "✕" action), disabled.
- **Spacing:** 44px height, `radius-md`, 16px internal horizontal padding, leading search icon (`icon-sm`).
- **Use:** Home (entry point variant), Search tab (active variant).
- **Don't:** never show recent/trending results below the Home entry-point variant — that behavior belongs exclusively to the Search tab.

### Skeleton
- **Purpose:** loading placeholder matching the exact shape of the content about to render.
- **Variants:** Block (cards), Line (text), Circle (avatars/logos).
- **States:** shimmering (animated gradient sweep, see Section 10), never static grey (a static block reads as "broken," not "loading").
- **Spacing:** matches the real component's exact dimensions — no skeleton may differ in size from the content it represents.
- **Use:** any component whose data hasn't arrived yet.
- **Don't:** never use a spinner as a substitute for Skeleton on content-shaped components — spinners are reserved for full-page/full-action loading only (Splash, button loading state).

### Toast
- **Purpose:** brief, non-blocking confirmation (e.g. "Added to Watchlist").
- **Variants:** Success, Info, Error.
- **States:** entering, visible, exiting (auto-dismiss).
- **Spacing:** floats 16px above the bottom nav (or bottom safe area on nav-less screens), 16px horizontal margins, `radius-md`, `elevation-overlay`.
- **Use:** confirmations that don't require the user to act.
- **Don't:** never use Toast for errors that block further progress — those need inline Error State or a Modal.

### Modal
- **Purpose:** interrupt the user for a decision that must be made before continuing (rare in this product by design).
- **Variants:** Confirmation (e.g. "Remove from Watchlist?").
- **States:** entering, visible, exiting.
- **Spacing:** centered, max-width 320px, `radius-lg`, `elevation-overlay`, scrim behind at 60% black regardless of theme.
- **Use:** destructive confirmations only.
- **Don't:** never use Modal for anything informational — that's Bottom Sheet's job. Modal = decision; Sheet = detail.

### Bottom Sheet
- **Purpose:** present supplementary detail without leaving the current screen (Score breakdown, "Why this score" full detail, sort options).
- **Variants:** Fixed-height (short content, e.g. sort options), Scrollable (long content, e.g. full score breakdown).
- **States:** entering (slide up), visible, dragging (if drag-to-dismiss enabled), exiting (slide down).
- **Spacing:** `radius-sheet` top corners, drag handle (4px × 36px, centered, 8px from top), 16px internal padding, max-height 85% of viewport.
- **Use:** any "more detail, same context" need.
- **Don't:** never nest a Bottom Sheet inside another Bottom Sheet.

### Tooltip
- **Purpose:** brief contextual explanation triggered by tapping an info icon (Fear & Greed ⓘ).
- **Variants:** single — small floating label with a pointer/caret toward its trigger.
- **States:** visible, dismissing (tap outside or auto-dismiss after ~4s).
- **Spacing:** max-width 240px, `radius-md`, `elevation-popover`, 8px internal padding.
- **Use:** single-fact explanations only (one sentence max).
- **Don't:** never use Tooltip for anything requiring scrolling or multiple paragraphs — that's Bottom Sheet's job.

### Empty State
- **Purpose:** explain absence of content and suggest a next action.
- **Variants:** Personal (Watchlist — "you're not watching anything yet"), Search ("no results for X"), Section-level (e.g. "no fundraises this week" inline within Markets).
- **States:** static (illustrations don't animate beyond a subtle entrance fade).
- **Spacing:** Personal/Search variants: centered, `icon-xl` illustration, 16px gap to headline (`Subtitle`), 8px gap to helper text (`Caption`), 24px gap to CTA button. Section-level variant: single muted `Caption` line, no illustration.
- **Use:** any zero-content scenario.
- **Don't:** never show a bare "No data" string with no guidance — every Empty State (except section-level) must suggest a next action.

### Error State
- **Purpose:** explain failure and offer recovery.
- **Variants:** Full-page (entity not found, no network), Inline/Section (one section failed, rest of page fine), Form (input-level validation, not currently used but reserved).
- **States:** static, retrying (button shows loading state per Button spec).
- **Spacing:** Full-page: matches Empty State's centered layout. Inline: single-line `Caption` + small retry icon-button, contained within the affected section only.
- **Use:** any failure scenario.
- **Don't:** never let one section's error state visually break the layout of sibling sections — errors must be contained.

### Loading State
- **Purpose:** indicate in-progress work that isn't content-shaped (button submission, page-level initial load before skeleton structure is known).
- **Variants:** Spinner (small, inline — buttons), Full-page (Splash only).
- **Spacing:** Spinner 20–24px, centered within its container.
- **Use:** Splash, button submission.
- **Don't:** never use a spinner where a Skeleton is possible — Skeleton is always preferred once content shape is known.

### Notification Badge
- See **Badge** above (Counter/Dot variants) — this is the same component applied specifically to the bell icon and bottom nav.

### Avatar
- **Purpose:** represent a person (user) or entity (project/fund/chain logo).
- **Variants:** Person (Profile, circular, photo or initials fallback), Entity (project/fund/chain, circular, logo or initials fallback per Section 8).
- **Sizes:** 28px (list rows), 32px (compact cards), 56px (Project Detail Hero), 64px (Profile header).
- **States:** loaded, fallback-initials, skeleton (circle shimmer).
- **Don't:** never use a square or rounded-square avatar anywhere — circular only, no exceptions.

### Divider
- **Purpose:** separate content without a full Card boundary.
- **Variants:** Full-bleed (rare — major section breaks), Inset (16px left inset, the default for list rows).
- **Spacing:** 1px hairline, `neutral-border` color.
- **Use:** between List Item rows, inside Profile's grouped settings list.
- **Don't:** never use a Divider where 16–24px of whitespace alone would communicate the same separation more elegantly — Dividers are for dense lists specifically, not general layout spacing.

### Section Header
- **Purpose:** label a content block on a scrolling page (e.g. "WEEKLY PICKS," "MARKET FEED").
- **Variants:** With action (trailing "See all ›"), Without action.
- **Spacing:** `Title` style, optional `Caption` subtitle below with 4px gap, 16px horizontal margin, 24px gap above (separating from the previous section), 12px gap below (to first content row).
- **Use:** every distinct content block on Home, Markets, Project Detail.
- **Don't:** never make a Section Header tappable as a whole — only the explicit "See all" text-button is interactive, to avoid accidental navigation from a header tap.

### Accordion
- **Purpose:** expand/collapse supplementary detail in place (e.g. an alternative to a Bottom Sheet for "See full breakdown" if inline expansion is preferred over an overlay in a future iteration).
- **Variants:** single row expand/collapse, chevron rotates 180° on expand.
- **States:** collapsed, expanding (animated height + chevron rotation), expanded.
- **Spacing:** header row matches List Item (Simple variant) dimensions; expanded content gets 12px top padding before its first child.
- **Use:** sparingly — prefer Bottom Sheet for anything more than 2–3 lines of revealed content.
- **Don't:** never nest an Accordion inside a Bottom Sheet or vice versa — pick one disclosure pattern per context.

### Carousel
- **Purpose:** horizontally-scrolling row of fixed-width cards (Weekly Picks, Related Projects, Markets mini-card rows).
- **Variants:** Snap (cards snap to alignment on scroll release — used for Weekly Picks, the primary hero scroller), Free (continuous scroll, no snap — used for lower-emphasis rows like Related Projects).
- **States:** default, scrolling (momentum, see Section 10), at-start/at-end (no visual end-cap needed; the next card simply gets cut off at the screen edge, signaling "more exists").
- **Spacing:** first card has full 16px left margin; last card has 16px right margin; 12px gap between cards.
- **Use:** Weekly Picks, Related Projects, Markets Trending rows.
- **Don't:** never combine a Carousel with visible pagination dots — the partially-cut-off next card is sufficient affordance for "swipe for more," and dots add visual clutter this product avoids.

### Tag
- **Purpose:** small, non-interactive text label communicating a category or attribute inline (e.g. "DeFi," "L2" if added to Search results per the earlier UX improvement recommendation).
- **Variants:** Outline only (tags are always low-emphasis — see Section 5's "no category-color system" rule, tags use neutral colors exclusively).
- **Spacing:** matches Chip's compact sizing (12px horizontal padding, `radius-sm` not `radius-pill` — Tags are rectangular-ish to visually distinguish them from interactive Chips).
- **Use:** inline category context next to a name.
- **Don't:** never make a Tag tappable — if it needs to be interactive, it's a Chip, not a Tag.

### Score Gauge
- **Purpose:** the visual progress-bar/dot-bar element inside the Score Card (Full variant).
- **Variants:** Linear bar (primary), Dot-segment bar (the `●●●●●●●●●●○○` pattern from the wireframes — used in Compact Score Card contexts where a full linear bar would be too wide).
- **States:** static fill, animated fill-in on first render/value change (Section 10).
- **Spacing:** 8px height (linear) / inline with text (dot-segment), full width of its container.
- **Don't:** never use Score Gauge to represent anything other than the 0–100 Score — it is visually reserved for this one meaning.

### Risk Indicator
- **Purpose:** compact visual flag for Unlock Risk (and any future risk-classified field).
- **Variants:** Icon+label (⚠ "Unlock event in 12 days" — used in "Why this score" and Unlock Schedule), Dot-only (used in dense list contexts like Weekly Pick cards where space is constrained).
- **Spacing:** icon `icon-xs`/`icon-sm` + `Caption`/`Body` label, 4–8px gap.
- **Use:** anywhere Unlock Risk needs surfacing.
- **Don't:** never use red (`danger`) for Risk Indicator unless the risk is genuinely high-severity (per Section 5's 3-state Unlock Risk color mapping) — don't let every unlock mention look alarming by default.

---

# 10. Motion & Interaction Specification

General principle: motion in this product is **functional, not decorative** — every animation exists to either (a) maintain spatial continuity so the user never feels lost, or (b) provide immediate feedback that an action registered. Nothing animates "for delight" alone.

Standard duration/curve vocabulary used throughout this section:
- **Instant** (0–50ms): state changes with no perceptible transition needed (e.g. text content swap).
- **Quick** (150–200ms, ease-out): micro-interactions, button presses, toggles.
- **Standard** (250–300ms, ease-in-out): page transitions, sheet/modal entrances.
- **Deliberate** (350–450ms, ease-out): hero moments — Splash exit, Score reveal.

| Interaction | Purpose | Duration | Curve | Feeling | User expectation |
|---|---|---|---|---|---|
| **App Launch** | Bridge cold-start to first content | up to 800ms total | — | Calm, branded, never blank-white | App feels considered, not slow |
| **Splash** | Hold brand moment while auth/membership resolves | Deliberate fade-out (350ms) into Home | ease-out | Premium, unhurried but not sluggish | A brief, intentional pause — not a stall |
| **Membership Check** | Silent gate | Instant if passed; no visible transition | — | Invisible when successful | User never consciously notices this step succeeded |
| **Page Transition** (tab→tab) | Switch top-level context | Quick (200ms) cross-fade, no slide | ease-in-out | Flat, instant-feeling | Tabs feel like switching channels, not "traveling" |
| **Page Transition** (drill-in, e.g. Card → Detail) | Maintain spatial continuity | Standard (280ms) slide-in from right | ease-out | Forward, depth-adding | "I went deeper," reinforced by the back gesture reversing it exactly |
| **Back Navigation** | Return to prior context | Standard (280ms) slide-out to right, mirrors drill-in exactly | ease-in | Reversible, predictable | Exact reverse of the forward transition, scroll position restored |
| **Bottom Navigation tap** | Switch tab | Quick (150ms) icon scale-bounce (1.0→1.15→1.0) + Page Transition cross-fade | ease-out (bounce), ease-in-out (fade) | Responsive, tactile | Immediate acknowledgment even before content swaps |
| **Card Tap** | Acknowledge selection before navigating | Quick (100ms) scale to 0.97 on press, springs back on release as navigation begins | ease-out | Tactile, physical | Card feels pressable, not flat/inert |
| **Button Tap** | Acknowledge action | Quick (100–150ms) scale to 0.97 + opacity 0.9 on press | ease-out | Tactile | Immediate, unambiguous "this registered" |
| **Search Open** | Enter retrieval mode | Quick (200ms): keyboard rises, input auto-focuses, bottom nav fades out | ease-out | Focused, mode-shift | Clear "I'm now searching," distraction (nav) recedes |
| **Search Result** appearing | Live filtering feedback | Instant (no animation on text match) but result *rows* fade-in individually, staggered 20ms each, max 5 rows staggered | ease-out | Fast, responsive, alive | Typing feels like it's "finding" things, not just filtering a static list |
| **Project Open** (from any entry point) | Drill into detail | Standard (280ms) slide-in; Hero content fades in 100ms after the slide starts (slight stagger) | ease-out | Smooth arrival, content settles after the container does | The screen "arrives," then "fills in" — never both at once |
| **Loading** | Indicate work in progress | Continuous until resolved | linear (spinner rotation) | Calm, never frantic | A spinner that never feels like it's stuck (rotation speed: ~1 full turn per 1000ms) |
| **Pull To Refresh** | Manually request fresh data | Elastic drag (resists past 80px), release triggers Standard (300ms) refresh indicator | ease-out (release snap-back) | Springy, satisfying, never sluggish | Familiar iOS/Android pattern — must not deviate from platform convention |
| **Skeleton Fade** (skeleton → real content) | Smooth handoff, avoid layout jump | Quick (200ms) cross-fade, skeleton and content occupy identical bounding box throughout | ease-in-out | Seamless, no "pop" | Content feels like it was "always there, just revealing" |
| **Toast** | Brief confirmation | Quick (200ms) slide-up + fade-in entrance; holds 2.5s; Quick (150ms) fade-out exit | ease-out (in), ease-in (out) | Light, unobtrusive | Noticed in peripheral vision, never demands a tap |
| **Modal** | Demand a decision | Standard (250ms) scale-up from 0.95→1.0 + fade-in, scrim fades in simultaneously | ease-out | Deliberate, attention-commanding | Distinctly heavier-feeling than a Toast or Sheet — this is intentional, it's reserved for real decisions |
| **Bottom Sheet** | Reveal supplementary detail | Standard (300ms) slide-up from bottom edge, scrim fades in simultaneously; dismiss = reverse + drag-to-dismiss support | ease-out (in), ease-in (out) | Light, contextual, easily dismissed | Feels like "the screen grew a drawer," not a new page |
| **Accordion** | Reveal inline detail | Quick (200ms) height auto-animate + chevron rotation (200ms, synced) | ease-in-out | Smooth, no jump | Content below the accordion shifts smoothly, never snaps |
| **Tab Switch** (Segment Control) | Filter content in place | Quick (150ms) pill-background slide to new position; content swap cross-fades 150ms, slightly overlapped | ease-out | Snappy, mechanical-feeling (this is filtering, not navigating — should feel lighter than a Page Transition) | Instant content change, indicator catches up visually |
| **Watchlist Update** (add/remove) | Confirm state change | Quick (150ms) star icon fill/unfill with a brief scale-bounce (1.0→1.3→1.0) | ease-out | Satisfying, immediate | Combined with a Toast — visual (star) + textual (toast) confirmation together |
| **Live Market Update** (price/score ticking) | Reflect real-time-ish data change without jarring the user | Quick (200ms) color-flash on the changed value only (brief tint of `bullish`/`bearish`, fading back to neutral text color) | ease-out | Subtle, peripheral-aware | User notices something changed without losing reading position |
| **Notification** (in-app badge appearing) | Surface new information | Quick (150ms) badge scale-in (0→1.0 with slight overshoot to 1.1) | ease-out | Attention-getting but small | Noticed without requiring acknowledgment |
| **Error Animation** | Signal failure clearly but calmly | Quick (150ms): icon/text fade-in, optional single subtle horizontal shake (±4px, 200ms) only for form-level validation errors, never for page-level errors | ease-out | Clear, not alarming | A shake is felt, not jarring — reserved for the single most input-adjacent error case |
| **Retry** | Re-attempt failed action | Button enters Loading state instantly on tap (Quick, 100ms), reverts to normal or succeeds per actual result | ease-out | Responsive, no perceived delay before feedback | Tapping retry must never feel like "did that even register?" |
| **Long Press** | Reveal secondary actions (reserved for future use — e.g. quick-remove from Watchlist without opening detail) | Quick (150ms) contextual menu/sheet appears after a ~400ms hold threshold | ease-out | Deliberate, discoverable but not accidental | 400ms threshold prevents accidental triggers during normal scrolling |
| **Swipe** (e.g. swipe-to-remove on Watchlist row, reserved) | Quick destructive/secondary action | Follows finger 1:1 during drag; Quick (150ms) snap to revealed action or snap-back if released before threshold (~40% of row width) | linear (drag-following), ease-out (snap) | Direct manipulation, physical | Matches iOS Mail/Telegram's own swipe-action convention exactly — never invent a new swipe distance/threshold |
| **Infinite Scroll** (e.g. "See all" full lists) | Load more content as the user approaches the end | Skeleton rows appear ~300px before reaching the true list end, replaced by real content as it resolves | — | Seamless, never an abrupt stop | User should rarely if ever hit a hard "end of list" wall on a "see all" screen |
| **Momentum Scroll** | Native platform scroll physics | Platform-default (iOS/Android native momentum + bounce/overscroll) | platform-native | Familiar | Never override native scroll physics with custom easing — this is the one place "platform default" beats a custom spec |
| **Haptic Feedback** (suggestions) | Reinforce key confirmations physically | Light impact: button taps, tab switches. Medium impact: Watchlist add/remove, successful action confirmations. Selection-changed haptic: Segment Control / Chip selection. Never use haptics for passive events (page load, incoming data update) | — | Physical confirmation | Reserved for *user-initiated* state changes only — never fired for passive/background events |
| **Micro Animations** | General-purpose for any small state change not listed above | Quick (150–200ms), ease-out | — | Snappy | Default fallback spec when implementing a small interaction not explicitly covered here |
| **Success Feedback** | Confirm a positive outcome | Toast (per above) + optional Medium haptic | — | Warm, brief | Never a full-screen celebratory animation — that's disproportionate for this product's tone |
| **Failure Feedback** | Confirm a negative outcome | Inline Error State appears (per Section 9) + optional single haptic "error" pattern (if platform supports a distinct error haptic) | — | Calm, informative, not punishing | User should feel informed, never blamed |
| **Score Change Animation** | Reflect a Score updating (e.g. weekly refresh while viewing) | Score Gauge re-animates its fill (Standard, 300ms) from old value to new; numeral cross-fades (Quick, 200ms) old→new digit | ease-in-out | Noticeable but not alarming | This is a rare event (scores update weekly) — when it happens, it should feel like a small, specific moment, not routine |
| **Price Change Animation** | Reflect live-ish price ticking | Per "Live Market Update" above | — | Subtle | Consistent with Live Market Update — same spec, this row exists for cross-reference clarity |
| **Fear & Greed Update** | Reflect index value changing | Quick (200ms) color transition along the 5-band gradient (Section 5) as the value crosses a band boundary, numeral cross-fades | ease-in-out | Ambient, weather-like | Should feel like watching a gauge needle move, not a jarring number swap |

---

# 11. Screen Templates

Every screen in the product is an instance of one of these templates. A new screen is built by selecting a template, not by designing from scratch.

### Home Template
- **Header:** Greeting variant (collapses to slim search-only bar on scroll).
- **Body:** vertically scrollable; composition order is fixed: Search entry → Market Card → Section Header + Carousel (Weekly Picks) → repeating Section Header + compact List/Feed blocks (Market Feed).
- **Footer:** none (Bottom Navigation is the persistent app-level footer, not a screen-specific one).
- **Sticky elements:** Top App Bar (collapsing), Bottom Navigation.
- **Scrollable areas:** entire body; Weekly Picks carousel scrolls horizontally independent of vertical body scroll.
- **Primary CTA:** none persistent — each Weekly Pick card's tap-through *is* the primary action, not a separate button.
- **Secondary CTA:** "See all" / "View All Picks" text-buttons per section.

### Markets Template
- **Header:** Static title ("Markets").
- **Body:** sticky filter Chip row directly below header, then a fixed sequence of Section Header + Carousel/List blocks (Trending Projects → Trending Funds → Trending Platforms → Top Gainers → Top Losers → Recently Added → Recent Fundraises → Unlock Calendar).
- **Footer:** none.
- **Sticky elements:** Top App Bar, Chip filter row (sticks just below header once header is collapsed/scrolled), Bottom Navigation.
- **Scrollable areas:** entire body vertically; each Carousel section scrolls horizontally.
- **Primary CTA:** none persistent — tapping any item is the action.
- **Secondary CTA:** "See all" per section.

### Search Template
- **Header:** Search-input variant, auto-focused on entry.
- **Body:** two mutually-exclusive states rendered in the same scroll container — Default (Recent → Trending → Popular) and Typed (live grouped results, Projects then Funds).
- **Footer:** none.
- **Sticky elements:** Search Bar itself; Bottom Navigation hides while keyboard is focused, reappears on dismiss.
- **Scrollable areas:** result/list body only.
- **Primary CTA:** none — tapping a result navigates directly.
- **Secondary CTA:** "✕" per Recent item (remove), none for Trending/Popular.

### Project Detail Template
- **Header:** Back+Title+Action variant (back, name, watchlist star + share); collapses to back+name-only (no price) on scroll.
- **Body:** fixed vertical sequence — Hero → Score Card (Full) → Why This Score → Funding → Tokenomics → Market Metrics → Unlock Schedule → Related Projects (Carousel).
- **Footer:** none — watchlist action lives in the header, not a footer bar, to keep it reachable via thumb without adding a sixth persistent chrome element.
- **Sticky elements:** Top App Bar (collapsing); Bottom Navigation (this is a tab-reachable screen, nav stays visible).
- **Scrollable areas:** entire body vertically; Related Projects carousel scrolls horizontally.
- **Primary CTA:** Watchlist toggle (header icon button).
- **Secondary CTA:** "See full breakdown" (opens Bottom Sheet), "View all rounds," "See all" (Unlock Schedule if more than one upcoming).

### Watchlist Template
- **Header:** Static title ("Watchlist") + optional sort/filter icon action.
- **Body:** sticky Segment Control (Projects/Funds) below header, then a vertical List of Data-variant List Items.
- **Footer:** none.
- **Sticky elements:** Top App Bar, Segment Control, Bottom Navigation.
- **Scrollable areas:** the list body; each segment maintains independent scroll position.
- **Primary CTA:** none persistent — Empty State shows "Browse Weekly Picks" as its CTA when applicable.
- **Secondary CTA:** none.

### Profile Template
- **Header:** Static title ("Profile").
- **Body:** Person Avatar + name/handle/membership block, then a flat grouped List of Simple-variant List Items (Telegram Account, Academy Membership, Notification Settings, Theme, Feedback, About, Terms).
- **Footer:** app version string, centered, `Caption`, muted.
- **Sticky elements:** Top App Bar, Bottom Navigation (body rarely needs to scroll at this list length).
- **Scrollable areas:** body, only if content exceeds viewport.
- **Primary CTA:** none — this screen has no single dominant action by design (utility tone, per Section 1).
- **Secondary CTA:** each row's chevron-tap navigates to its sub-screen.

---

# 12. Accessibility

- **Contrast:** all text must meet WCAG AA (4.5:1 for body text, 3:1 for large/`Heading`+ text) against its background in both themes. `neutral-text-tertiary` is the one intentionally low-contrast token and must never be used for content the user needs to act on (labels/disabled states only).
- **Touch Targets:** 44×44px minimum for every interactive element, per Apple HIG — enforced even when an icon's *visual* size is smaller (e.g. a 20px icon still gets a 44px tap zone). This applies to List Item trailing actions, Chip close buttons, and every Icon Button without exception.
- **Minimum Font Sizes:** no text below 11px (`Badge`) anywhere in the app; body-reading text (`Body`, `Subtitle`) never below 15px, in line with the "fast scrolling, one-handed" brief — small text slows reading and increases mis-taps.
- **Screen Reader:** every icon-only interactive element (Icon Button, bottom nav items, watchlist star) must carry a text label for assistive technology even though no visible label renders; every Skeleton must be marked as a loading region so screen readers announce "loading" rather than reading nothing or stale content; live-updating values (price, score) must use a polite (not assertive) live-region annotation so updates don't interrupt other reading.
- **Color Blindness:** every color-coded meaning in this system (bullish/bearish, score grade, risk level, Fear & Greed) must be paired with a non-color signal — direction arrows (▲/▼) for bullish/bearish, the letter grade itself for Score, the explicit risk word ("High risk") for Unlock Risk, and the explicit label ("Greed") for Fear & Greed. Color is reinforcement, never the sole carrier of meaning, anywhere in this product.
- **Motion Reduction:** every animation in Section 10 must have a reduced-motion equivalent — Quick/Standard/Deliberate transitions collapse to a simple cross-fade or instant cut when the platform's reduce-motion setting is active; the Watchlist star bounce and Score Gauge fill-animation become instant state changes; Pull-to-Refresh's elastic drag remains (it's a direct-manipulation gesture, not decorative motion) but its release animation shortens to Quick.
- **Large Text Support:** the type scale (Section 4) must support platform-level text-size scaling without breaking layout — Stat Card grids, List Item rows, and Score Card must use flexible (not fixed-pixel-cropped) text containers so a user with enlarged system text sees wrapped, still-legible text rather than truncated/overlapping content. Card *dimensions* (e.g. Project Card's 220×180px) may need to grow vertically to accommodate this rather than clipping text.

---

# 13. Design Tokens

| Category | Token | Value |
|---|---|---|
| **Spacing** | `space-1` … `space-10` | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px |
| **Radius** | `radius-sm` | 8px |
| | `radius-md` | 12px |
| | `radius-lg` | 16px |
| | `radius-xl` | 20px |
| | `radius-sheet` | 24px (top corners) |
| | `radius-avatar` | 50% |
| | `radius-badge` | 6px |
| | `radius-pill` | 999px |
| **Elevation** | `elevation-flat` | 0 — level 0 |
| | `elevation-raised` | level 1 |
| | `elevation-floating` | level 2 |
| | `elevation-overlay` | level 3 |
| | `elevation-popover` | level 4 |
| **Typography** | `type-display` | 700 / 28px / 34px / −0.2px |
| | `type-heading` | 700 / 20px / 26px / −0.1px |
| | `type-title` | 600 / 17px / 22px / 0px |
| | `type-subtitle` | 500 / 15px / 20px / 0px |
| | `type-body` | 400 / 15px / 22px / 0px |
| | `type-caption` | 400 / 13px / 18px / 0.1px |
| | `type-badge` | 600 / 11px / 14px / 0.2px |
| | `type-button` | 600 / 15px / 20px / 0px |
| | `type-numeric` | 600 / 17px / 22px / −0.1px |
| | `type-score` | 700 / 36px / 40px / −0.5px |
| **Color** | `color-accent` | single primary hue (indigo-violet family) |
| | `color-bg` / `color-surface` / `color-surface-elevated` | neutral scale, theme-dependent |
| | `color-success` / `color-warning` / `color-danger` / `color-info` | semantic family |
| | `color-bullish` / `color-bearish` | = success / danger |
| | `color-score-a` / `color-score-b` / `color-score-c` / `color-score-d` | green / teal-blue / amber / red |
| | `color-fng-1` … `color-fng-5` | deep red → orange → neutral → yellow-green → saturated green |
| **Animation Duration** | `duration-instant` | 0–50ms |
| | `duration-quick` | 150–200ms |
| | `duration-standard` | 250–300ms |
| | `duration-deliberate` | 350–450ms |
| **Opacity** | `opacity-disabled` | 40% |
| | `opacity-pressed` | 90% |
| | `opacity-scrim` | 60% (black, both themes) |
| | `opacity-badge-tint` | 10% (semantic background tints, e.g. Pill semantic variant) |
| **Blur** | `blur-glass` | applied only to sticky Top App Bar (post-scroll) and Bottom Navigation, per Section 7's glass-effect rule |

---

# 14. Design Rules

1. Weekly Picks must always appear above the fold on Home.
2. Search must always be accessible within one tap from any screen (either the Search tab or a Home search-bar entry point).
3. A Project Score must never appear without an adjacent grade label or "Why this score" affordance nearby.
4. Do not use tables on mobile — restructure tabular data as List Items or Cards.
5. Avoid horizontal scrolling for anything except explicitly-designed Carousels (Weekly Picks, Related Projects, Markets trending rows) — never for tabular/grid content.
6. Never place more than 5 cards in a vertical stack before the user must scroll to see the next section.
7. Never show more than 4 KPI/stat values inside one Stat Card grid.
8. Never use more than one primary accent color anywhere in the interface.
9. Every screen must answer exactly one core user question — if a screen needs two headlines, it should be two screens.
10. The bottom navigation must never exceed 5 items.
11. Every list/grid of unbounded length must offer a "See all" rather than rendering its full length inline.
12. No screen (except Project/Fund Detail at full depth) should require more than 3 full screen-heights of scrolling to reach its end.
13. Every interactive element must have a minimum 44×44px tap target, regardless of visual icon size.
14. Every Card type has exactly one fixed dimension set per context — no dynamically-sized cards within the same scroller.
15. Score, once introduced on Home, must use the exact same visual language (number style, grade colors) on every other screen it appears.
16. Funds must never display a Score — only Projects have Scores; Funds show portfolio size/avg. investor quality instead.
17. Category/chain must never be communicated via a dedicated background color — text/icon only.
18. Every Empty State (except section-level inline ones) must include a suggested next action, not just an explanation of absence.
19. Every section-level error must be contained to that section — one failed data source must never blank an entire screen.
20. Skeletons must exactly match the dimensions of the content they represent — no generic placeholder shapes.
21. Spinners are reserved for full-page loads and button-submission states only; everything else uses Skeletons.
22. Toasts auto-dismiss; they must never require a user tap to disappear.
23. Modals are reserved exclusively for decisions the user must explicitly confirm or cancel — never for passive information.
24. Bottom Sheets are reserved for supplementary detail; they must never contain a primary navigation action that duplicates the bottom nav.
25. Never nest a Bottom Sheet inside a Modal, or a Modal inside a Bottom Sheet.
26. Drill-in navigation (Home → Detail) always slides from the right; back navigation always mirrors it exactly in reverse.
27. Tab switches (bottom nav) always cross-fade; they never slide, to keep tab-switching feeling instantaneous rather than spatial.
28. Every icon-only button must have an accessible text label even with no visible label rendered.
29. Every color-coded meaning must have a non-color-dependent backup signal (icon, arrow, or text).
30. No more than one emoji per row or section header, and never inside chrome (nav, buttons, headers' structural text).
31. Filled icons indicate active/selected state only — outline is always the resting/default state.
32. Logos and avatars are always circular; never square or rounded-square.
33. The Score numeral's type style (`type-score`, 36px bold) is reserved exclusively for the Score — no other number in the app may use it.
34. A Project Card's Hero variant only appears in horizontal scrollers, never in a vertical list.
35. Funding round / unlock data is always summarized (e.g. "led by Fund A, Fund D +2 more") in list/card contexts; full detail is one tap deeper.
36. Search results must never display a Score — scoring is revealed only after opening a Project Detail screen.
37. Search must always show Recent + Trending content before the user types anything — never a blank input.
38. Every text input auto-focuses when its screen is the primary purpose of that screen (Search); inputs on secondary screens (e.g. Feedback) do not auto-focus.
39. The bottom navigation hides only while a keyboard is focused or on pre-auth screens (Splash, Login) — never on any of the 5 primary tabs otherwise.
40. Pull-to-refresh is available on every primary list/feed screen (Home, Watchlist, Markets) and follows native platform gesture physics exactly.
41. No screen may have two Primary Buttons visible simultaneously.
42. Destructive actions (e.g. remove from Watchlist via long-press/swipe) always require either a confirm Modal or an undo-able Toast — never an instant, irreversible single tap with no feedback.
43. Section Headers are never themselves tappable as a whole — only their explicit "See all" sub-element is interactive.
44. Every horizontally-scrolling Carousel must visually cut off its last visible card at the screen edge to signal "more exists" — no carousel may end flush with the viewport edge when more content follows.
45. Dividers are reserved for dense list contexts; general layout separation uses whitespace (`space-6`/`space-7`), not dividers.
46. A maximum of 3 Stat values may appear inline within any single compact card (e.g. a Weekly Pick card's Score/Funding/TVL/Unlock count as 4 distinct signals and are therefore laid out as labeled rows, not a single inline KPI strip).
47. Theme (light/dark) must be a fully-specified, equally premium experience in both modes — dark is primary/default, but light is never a degraded fallback.
48. Haptic feedback is reserved for user-initiated state changes only — never fired for passive/background data updates (e.g. a live price tick must never trigger a haptic).
49. Every number that can update live (price, score, Fear & Greed) must animate its change with a brief color-flash, never an abrupt re-render with no transition.
50. No new top-level navigation destination is added without first asking "does this replace an existing tab, or does it belong one tap deeper inside Profile/Markets?" — the 5-tab limit (Rule 10) is treated as a hard constraint, not a starting point.
51. Every screen template (Section 11) must be reused as-is for any new screen of the same category — a new "X Detail" screen reuses the Project Detail Template's header/body/footer structure rather than inventing a new one.
52. Markdown/long-form text content (e.g. Feedback, About) is the only context where Body-style paragraph text may exceed 3 lines without truncation.

---

# 15. UX Anti-patterns

Mistakes a future developer must actively avoid — several are direct lessons from studying ChainBroker and generic crypto-dashboard UI:

1. **Building a sortable, multi-column table for any mobile screen** — the single most common ChainBroker-style mistake; always restructure as cards/list items instead.
2. **Showing every sub-score (all 7 components) inline on a list/card** — overwhelms scanability; sub-scores belong behind "Why this score."
3. **Treating Search results like a ranked recommendation feed** (showing Score, sorting by quality) — Search is relevance-based retrieval, not curation; do not blur this with Home's curation logic.
4. **Adding a 6th bottom nav tab "just this once"** — always means restructuring an existing tab or pushing the feature one level deeper instead.
5. **Using red/green for anything other than directional price/score-grade/risk meaning** — e.g. never use red as a generic "important" highlight color outside its semantic role.
6. **Introducing a second accent color for "variety"** — directly contradicts the one-accent premium principle; resist the urge even for a single promotional banner.
7. **Square or rounded-square avatars/logos** — breaks the established circular-avatar convention and looks inconsistent next to every other entity in the app.
8. **Spinners used for content that has a known shape** — always use Skeleton instead; a spinner here reads as "this app doesn't know what it's loading."
9. **A blank Search input with no Recent/Trending content** — forces the user to think of a query with zero prompting; always pre-populate.
10. **Showing raw, unformatted large numbers** (e.g. "1234567890" instead of "$1.2B") — every numeric value must go through the product's number-formatting convention.
11. **A funding history "table" listing every co-investor by name with no summarization** — overwhelming; always summarize ("led by X, Y +2 more") with full detail one tap deeper.
12. **Category-color-coding projects** (e.g. all DeFi projects tinted blue, all L2s tinted purple) — creates a second, conflicting color language against the Score/risk system.
13. **Auto-playing animations on data that updates frequently** (e.g. animating every single price tick aggressively) — causes visual fatigue on a "fast scrolling" app; use the subtle color-flash spec (Section 10), nothing louder.
14. **A "Discover"-style infinite algorithmic feed on Home** — contradicts the entire product thesis ("what should I look at today," a finite, curated answer) — Home must always have a defined, finite end, not an endless feed.
15. **Tabs (underline-style) used as a filter mechanism** — confuses the Tabs/Segment Control distinction (Section 9); filtering in-place always uses Segment Control or Chips.
16. **A Modal used for non-critical confirmations** (e.g. "Added to Watchlist!" as a Modal) — this belongs in a Toast; Modals are reserved for real decisions only.
17. **Nesting interactive Cards inside other Cards** — breaks tap-target predictability and visual hierarchy.
18. **Putting a Primary Button inside a horizontally-scrolling Carousel card** — buttons inside horizontal-scroll contexts create tap-vs-swipe ambiguity; use a Text-style "Why?" affordance instead (smaller, less button-like).
19. **Hiding the bottom navigation on a primary tab screen "to give more space to content"** — bottom nav must remain persistent on all 5 tabs; removing it breaks the core navigation mental model.
20. **Designing Light theme as an inverted afterthought** (just flipping dark colors without re-checking contrast/elevation logic) — light theme needs its own elevation/shadow treatment (Section 7), not a naive inversion.
21. **Using emoji inside buttons or navigation labels** — emoji are for data content only (Section 8); chrome uses the icon set exclusively.
22. **A Score Gauge or Progress Bar used to represent an unbounded value** (e.g. trying to "progress-bar" a percentage change that can exceed 100%) — Progress Bar/Score Gauge are reserved for genuinely bounded 0–100 values.
23. **Letting a single slow backend call block the entire Home screen's render** — every section must load and skeleton/error independently (Section 9, 14 Rule 19).
24. **Showing a generic "Error" message with no recovery action** — every Error State needs a Retry or a clear next step.
25. **Long-press or swipe gestures with no visual affordance hinting they exist** — if a gesture is added (Section 10), some passive visual cue (e.g. a subtle partial-reveal on initial encounter) is required, or it remains undiscoverable.
26. **Resetting scroll position to the top on every back-navigation** — back navigation must restore the exact prior scroll position, not just the prior screen.
27. **Using platform-non-native scroll easing "for brand consistency"** — momentum scroll must always use native physics (Section 10); a custom-eased scroll feels broken to users regardless of intent.
28. **Designing Watchlist's empty state as a bare "No items" label** — must always include a suggested action (Section 9, Rule 18).
29. **Treating Fund entities visually identical to Project entities** (giving Funds a Score, an Unlock Risk indicator, etc.) — Funds and Projects have genuinely different data shapes; don't force visual parity where the underlying data doesn't support it.
30. **Adding decorative gradients, particle effects, or skeuomorphic textures "to feel premium"** — in this system, premium is achieved through restraint, spacing discipline, and one-accent color control (Section 1, 5) — decorative visual flourishes contradict the stated design vision, not reinforce it.
31. **Letting Project Detail show Market Metrics before the Score and Why-This-Score sections** — directly undermines the verdict-first information hierarchy that is this product's core differentiation from ChainBroker.

---

# 16. Future Scalability

This system is built so the following features extend it **without a redesign**, because each maps onto components, templates, and rules already defined:

### AI Chat
A new top-level surface (likely reached from Profile or a future 6th-tab reconsideration — see Rule 50) can reuse: **List Item** (chat history rows), **Card** (AI-generated insight cards, styled identically to existing summary cards so AI output never looks visually "bolted on"), **Bottom Sheet** (quick AI explanations triggered from a "Why this score" context, a natural extension of the existing "See full breakdown" pattern), and the existing **Skeleton/Loading** vocabulary for streaming responses. The Score Card's "Why this score" text is already structured as short, plain-language explanation — exactly the format an AI explanation layer would generate, meaning AI Chat can *replace or augment* that copy without any new visual pattern.

### Portfolio
Reuses **Watchlist's entire template** (Segment Control, Data List Item, price-movement row pattern) with an added aggregate **Stat Card grid** at the top (total value, total change) — a header pattern already specified for Market Metrics. No new component is required; Portfolio is structurally "Watchlist + a Stat Card."

### Trading Journal
Reuses **List Item (Feed variant)** for journal entries and **Card** for entry detail, following the same Section Header + "See all" pattern already used throughout Home/Markets. A "new entry" action follows the established single-Primary-Button-per-screen rule (Rule 41).

### Push Notifications
The **Notification Badge**, **Toast**, and bell icon in the Top App Bar (Home header) are already fully specified — push notifications simply populate the existing badge/bell affordance and, on tap, route into the existing Project/Fund Detail templates. No new visual system is needed, only a new data source feeding an already-designed component.

### Academy
Already partially integrated via the **Academy Membership** row and badge in Profile (Section 11). A deeper Academy surface (course content, progress) would reuse **Card** (course/lesson cards, same dimensions as Project Cards for visual consistency), **Progress Bar** (lesson completion, reusing the exact bounded-0–100 pattern already defined for Score), and the **Section Header + "See all"** browsing pattern from Markets.

### Admin Dashboard
The only surface in this list likely to need genuinely different patterns (denser tabular data is legitimate for an internal, desktop-likely admin tool) — but even there, the **token system** (Section 13), **color semantics** (Section 5), and **typography scale** (Section 4) should be reused wholesale for brand consistency, even if Admin Dashboard is allowed to break the "no tables on mobile" rule (Rule 4) since it is explicitly not the mobile-first, beginner-facing surface this system was designed for. Treat Admin Dashboard as a sibling design system that *inherits* tokens from this one rather than a screen built within this one.

**The general scalability principle:** every future feature above is "new data inside existing components," not "new components for new data." If a future feature seems to require an entirely new visual pattern, that is a signal to extend this document deliberately (new component spec, new rule) — not to improvise inline in implementation.

