# Component Specification — Crypto Research Telegram Mini App

**Status: implementation contract.** This document is the binding interface between Product Design and Frontend Engineering. Every screen in the product must be assembled exclusively from the components defined here. If a screen appears to need something not defined in this document, the correct action is to extend this document first — never to invent a one-off component in code.

Builds directly on `DESIGN_SYSTEM.md` (tokens, color, typography, spacing, motion vocabulary) and the wireframe/IA decisions in `UX_DESIGN.md` and the high-fidelity wireframe pass (Home/Markets/Search/Project Detail/Watchlist/Profile, 5-tab navigation). Where this document names a token (e.g. `space-4`, `radius-lg`, `duration-quick`), it refers to the exact token defined in `DESIGN_SYSTEM.md` Section 13 — this document does not redefine tokens, it consumes them.

---

# 1. Component Philosophy

## Why reusable components exist
A research product earns trust through **consistency** — if a Score looks different on Home than on Project Detail, the user's confidence in the number itself erodes, even if the underlying data is correct. Reusable components guarantee that every place "Score" appears, it behaves and reads identically. This is not a development-efficiency argument first — it is a *trust* argument. Development efficiency is the second, still-real benefit.

## Composition over duplication
No screen owns its own version of a Card, a List Item, or a Button. Every screen is a **composition** of existing components arranged in a specific order (see Section 7). When a new screen needs something that looks 90% like an existing component, the correct move is to add a variant to the existing component (Section 3/5 already define variant slots for this reason) — never to fork it into a new, similarly-named component. Duplication is the single fastest way a design system decays into inconsistency.

## Mobile-first
Every component in this document is specified at the **390px reference width** first, with a **360px minimum** constraint checked second. No component is designed at a larger breakpoint and then "shrunk" — there is no larger breakpoint in this product's scope (mobile-only, one-handed, Telegram Mini App). Components that would need fundamentally different behavior at a larger size (e.g. multi-column grids) are explicitly out of scope rather than half-supported.

## Consistent spacing
Every component's internal padding and external margin is drawn from the 8pt scale (`DESIGN_SYSTEM.md` Section 3) — never an arbitrary pixel value. A component that needs "a bit more room" uses the next token up (e.g. `space-4` → `space-5`), never an in-between value invented for that one case.

## Consistent interaction
A given gesture means the same thing everywhere it's used: tap always opens/activates, long-press always reveals secondary actions (where supported), swipe always reveals a destructive/quick action (where supported), pull-down always refreshes. No component reinterprets a gesture's meaning based on context.

## Consistent animation
Every component's motion is drawn from the duration/curve vocabulary in `DESIGN_SYSTEM.md` Section 10 (`duration-instant/quick/standard/deliberate`). A component never invents its own timing — Section 8 of this document maps every component to its exact motion behavior, leaving no room for ad hoc animation choices in implementation.

---

# 2. Component Hierarchy

```
App
 │   The Telegram Mini App shell itself: persistent Bottom Navigation,
 │   theme context, safe-area handling. Exists exactly once.
 ▼
Page
 │   One of the 6 top-level screens (Home, Markets, Search, Project
 │   Detail, Watchlist, Profile) or a sub-screen reached one level
 │   deeper (Fund Detail, Notification Settings, etc.). Owns a Screen
 │   Template (DESIGN_SYSTEM.md Section 11) and is responsible for
 │   data-fetching orchestration only — it contains no visual logic
 │   of its own beyond arranging Sections in order.
 ▼
Section
 │   A named, vertically-stacked content block within a Page (e.g.
 │   "WEEKLY PICKS," "MARKET FEED," "WHY THIS SCORE"). Always begins
 │   with a Section Header (Layout Component, Section 4) and contains
 │   one or more Cards, a List, or a Carousel. A Section never
 │   contains another Section.
 ▼
Card
 │   A self-contained, bounded visual unit representing one entity or
 │   one grouped idea (one project, one fund, one market snapshot, one
 │   feed item). Cards are the atomic unit of *content* in this
 │   product — see the full Card Library, Section 5.
 ▼
Widget
 │   A composed sub-element used inside a Card that combines multiple
 │   Primitives into one meaningful unit (e.g. a "Score + Grade"
 │   widget combining Score Circle + Tag; a "Price + Trend" widget
 │   combining Text + Trend Arrow). Widgets are reused across multiple
 │   Card types but never appear directly inside a Page or Section —
 │   they only exist inside a Card.
 ▼
Primitive
     The smallest indivisible visual unit (Text, Icon, Avatar, Badge,
     etc.) — see Section 3. Primitives carry no business logic and no
     awareness of "project" or "fund"; they only know how to render a
     string, an icon, a number, or a shape.
```

**Rule of containment:** a level may only contain instances of the level directly below it (Page contains Sections; Section contains Cards/Lists/Carousels; Card contains Widgets and Primitives; Widget contains only Primitives). Skipping a level (e.g. a Page rendering a bare Primitive directly) is not permitted — it signals a missing Card/Widget definition, not a shortcut to take.

---

# 3. Primitive Components

### Text
- **Purpose:** render any string content using one of the 10 type styles.
- **Variants:** Display, Heading, Title, Subtitle, Body, Caption, Badge, Button, Numeric, Score (per `DESIGN_SYSTEM.md` Section 4 — Text is the single primitive that implements all 10 styles, never a separate primitive per style).
- **States:** default, truncated (single-line ellipsis), multi-line (wraps, max-lines configurable per usage), muted (uses `neutral-text-secondary`/`tertiary` color).
- **Props:** style variant, color override (semantic colors only — never an arbitrary hex), max lines, alignment.
- **Spacing:** no self-margin; spacing is always controlled by the parent Widget/Card.
- **Sizing:** intrinsic to content + line-height per style; never fixed-width unless explicitly truncating.
- **Usage:** every label, value, and paragraph in the app.
- **Anti-patterns:** never hardcode a font size outside the 10 defined styles; never use Display style outside Splash/Empty-State headlines.

### Icon
- **Purpose:** render a single glyph from the outline icon set (`DESIGN_SYSTEM.md` Section 8).
- **Variants:** Outline (default), Filled (active/selected state only).
- **States:** default, active (filled + accent color), disabled (`opacity-disabled`).
- **Props:** glyph name, size token (`icon-xs/sm/md/lg/xl`), color (defaults to `currentColor`-equivalent inheriting from context).
- **Spacing:** no self-margin; gap to adjacent Text controlled by parent (`space-1` typical for inline pairing).
- **Sizing:** 16/20/24/32/64–96px per size token.
- **Usage:** every iconographic need in the app — nav, headers, inline indicators.
- **Anti-patterns:** never mix Outline and Filled within the same Widget; never use a custom one-off glyph outside the defined icon set.

### Image
- **Purpose:** render a non-logo raster/vector image (illustrations for Empty/Error states, future Academy lesson thumbnails).
- **Variants:** Illustration (centered, fixed aspect ratio), Thumbnail (rectangular, `radius-md`, used only by future-proof components, Section 14).
- **States:** loaded, loading (Skeleton Block beneath), failed (falls back to a generic placeholder icon, never a broken-image glyph).
- **Props:** source, aspect ratio, fit mode (contain only — never crop content-bearing illustrations).
- **Spacing:** governed by parent Empty/Error Layout (Section 4).
- **Sizing:** `icon-xl` (64–96px) for empty-state illustrations; otherwise context-defined.
- **Usage:** Empty States, Error States, future Academy content.
- **Anti-patterns:** never use Image for anything that is actually a logo (Token Logo/Fund Logo/Chain Logo are separate primitives, below) — Image is reserved for illustrative, non-entity content.

### Avatar
- **Purpose:** represent a person (Telegram user).
- **Variants:** Photo, Initials-fallback.
- **States:** loaded, fallback, skeleton (circle shimmer).
- **Props:** size (28/32/56/64px per `DESIGN_SYSTEM.md` Section 9), source.
- **Spacing:** none self; gap to adjacent Text per parent Widget.
- **Sizing:** always circular (`radius-avatar`).
- **Usage:** Profile header only — Avatar is exclusively for the *user*, never for projects/funds/chains (those use the dedicated logo primitives below).
- **Anti-patterns:** never use Avatar for an entity logo; never render it non-circular.

### Divider
- **Purpose:** thin separator line.
- **Variants:** Inset (16px left inset, default for list rows), Full-bleed (rare, major section breaks).
- **States:** static only — non-interactive.
- **Props:** variant, orientation (horizontal only — no vertical dividers in this system).
- **Spacing:** 1px height, sits between sibling rows with no additional margin (the rows' own padding provides the surrounding space).
- **Sizing:** 1px, `neutral-border` color.
- **Usage:** dense lists (Watchlist rows, Profile settings rows).
- **Anti-patterns:** never use Divider as a substitute for section-level whitespace (`space-6`/`space-7`) — see `DESIGN_SYSTEM.md` Rule 45.

### Spacer
- **Purpose:** explicit, named whitespace between sibling elements when a layout container's own gap property isn't applicable (e.g. an intentionally larger one-off gap inside a Card).
- **Variants:** none — a Spacer takes a single size token as its only configuration.
- **States:** n/a (invisible, non-interactive).
- **Props:** size token (`space-1` … `space-10`).
- **Sizing:** exact value of the chosen token, applied along the parent's layout axis.
- **Usage:** sparingly — most spacing should come from a container's built-in gap; Spacer exists for the rare exception.
- **Anti-patterns:** never use a Spacer with a value outside the 8pt scale; never use multiple consecutive Spacers where a single larger token would do.

### Badge
- **Purpose:** small numeric/status indicator overlaid on a host element.
- **Variants:** Dot (no content), Counter (number, "9+" cap at double digits).
- **States:** visible / removed-when-zero (no empty/zero visual state exists).
- **Props:** count (omit for Dot), color (defaults to `danger` for alerts, `color-accent` for neutral "new" indicators).
- **Spacing:** overlaps host element's top-right corner by ~25% of Badge's own size.
- **Sizing:** Dot 8px diameter; Counter min 16px diameter, grows with digit count, `radius-badge`/`radius-pill` depending on size.
- **Usage:** bell icon, bottom nav icons, Watchlist row trailing indicator, Notification Card unread state.
- **Anti-patterns:** never show a Badge with a value of zero; never place more than one Badge on the same host element.

### Tag
- **Purpose:** non-interactive inline label communicating category/attribute (e.g. "DeFi," "L2").
- **Variants:** Outline only (neutral color, per `DESIGN_SYSTEM.md`'s "no category-color system" rule).
- **States:** static.
- **Props:** label text (max 2 words).
- **Spacing:** 12px horizontal / 6px vertical internal padding.
- **Sizing:** `radius-sm`, height auto-sized to `Caption` text + padding (~22px).
- **Usage:** inline next to a project/fund name when category context adds value (Search results, Project Detail Hero).
- **Anti-patterns:** never make a Tag tappable (use Chip instead); never color-code Tags by category.

### Chip
- **Purpose:** interactive filter selector.
- **Variants:** Default (outline), Selected (filled accent).
- **States:** default, selected, disabled, pressed.
- **Props:** label, selected (boolean), onSelect.
- **Spacing:** 12px horizontal padding, 8px gap between sibling Chips.
- **Sizing:** 32px height, `radius-pill`.
- **Usage:** Markets filter row exclusively.
- **Anti-patterns:** never use Chip for navigation between Pages — only for in-place filtering.

### Pill
- **Purpose:** small, fully-rounded static label container (grade badges, membership tag).
- **Variants:** Neutral, Accent, Semantic (success/warning/danger background tint).
- **States:** static.
- **Props:** label, variant.
- **Spacing:** 6px vertical / 12px horizontal padding.
- **Sizing:** `radius-pill`, height auto (~24–28px).
- **Usage:** Score grade label, "Academy Member" badge.
- **Anti-patterns:** never make a Pill interactive — if it needs to respond to taps, it is a Chip.

### Progress
- **Purpose:** visualize a bounded 0–100 value.
- **Variants:** Linear bar, Dot-segment bar (compact contexts).
- **States:** static fill, animating-fill (on first render / value change).
- **Props:** value (0–100), variant, color (typically a Score grade color).
- **Spacing:** full width of host container.
- **Sizing:** 8px height (Linear), `radius-pill`.
- **Usage:** Score Circle's surrounding ring (see below), Score Breakdown Card sub-score bars, supply-unlocked indicators.
- **Anti-patterns:** never use for unbounded values.

### Sparkline
- **Purpose:** tiny inline trend visualization (price/score history over a short window) with no axes, labels, or interactivity.
- **Variants:** Line (default), Area (filled beneath the line, used when emphasizing magnitude e.g. TVL trend).
- **States:** loaded, skeleton (flat shimmering line), no-data (renders a flat neutral-grey dash instead of an empty chart).
- **Props:** data series (array of values), color (bullish/bearish, derived from first-vs-last value), variant.
- **Spacing:** none self; sized to fill its allotted Widget slot exactly.
- **Sizing:** typical footprint 48×24px (compact card contexts) up to 80×32px (Project Detail TVL trend).
- **Usage:** Weekly Pick Card's TVL Trend field, Market Overview's per-asset micro-trend (optional), Project Detail Market Metrics.
- **Anti-patterns:** never add axis labels, gridlines, or tooltips to a Sparkline — if detailed charting is needed, that is an explicitly out-of-scope future component, not a Sparkline variant.

### Score Circle
- **Purpose:** the product's signature visual — a circular ring (Progress, circular variant) surrounding the Score numeral.
- **Variants:** Full (Project Detail — large, numeral + grade label beneath), Compact (list/card contexts — small ring, numeral only, no label).
- **States:** default, skeleton (ring + numeral both shimmer as one shape), updating (ring re-animates fill, numeral cross-fades — `DESIGN_SYSTEM.md` Score Change Animation).
- **Props:** score (0–100), grade (A+/A/B/C/D, derives ring color), size (Full/Compact).
- **Spacing:** none self; centered within its host Card/Widget area.
- **Sizing:** Full: 88px diameter ring, `type-score` (36px) numeral centered. Compact: 40px diameter ring, `type-numeric` (17px) numeral centered.
- **Usage:** Score Card (Full), every Card type that summarizes a Project (Compact) — Weekly Pick, Project Card, Compact Project Card, Watchlist Card, Search Result Card.
- **Anti-patterns:** never render the numeral without the surrounding ring, even in the most compact context — the ring is what makes "Score" instantly recognizable as a distinct UI element from any other number in the app.

### Risk Indicator
- **Purpose:** compact flag for Unlock Risk (or any future risk-classified field).
- **Variants:** Icon+label (e.g. "⚠ Unlock in 12 days" — used in Why-This-Score, Unlock Card), Dot-only (space-constrained card contexts, e.g. inside Weekly Pick Card's 4-metric row).
- **States:** Low (success), Moderate (warning), High (danger).
- **Props:** level, label (optional, omitted in Dot-only variant).
- **Spacing:** `space-1` icon-to-label gap.
- **Sizing:** `icon-xs`/`icon-sm` + `Caption`/`Body` text.
- **Usage:** anywhere Unlock Risk needs surfacing.
- **Anti-patterns:** never default to `danger` color for an unspecified/unknown risk level — unknown must render as neutral, not alarming.

### Trend Arrow
- **Purpose:** directional indicator paired with a percentage change.
- **Variants:** Up (bullish), Down (bearish), Flat (neutral — used when change is within a near-zero threshold, e.g. ±0.05%).
- **States:** static; optionally animates on value change (`DESIGN_SYSTEM.md` Live Market Update spec).
- **Props:** direction (derived from the paired numeric value, never set independently).
- **Spacing:** `space-1` gap to its paired percentage Text.
- **Sizing:** `icon-xs` (16px).
- **Usage:** every 24h % field across the app (Watchlist, Market Overview, Top Gainers/Losers, Project Detail price).
- **Anti-patterns:** never show a Trend Arrow without its paired percentage value — the arrow alone is not self-explanatory.

### Token Logo
- **Purpose:** circular project/coin logo.
- **Variants:** Loaded, Initials-fallback.
- **States:** loaded, fallback, skeleton.
- **Props:** source, symbol (for fallback initials), size.
- **Spacing:** none self.
- **Sizing:** 28/32/56px per context (list row / compact card / Hero), always `radius-avatar`.
- **Usage:** every Project-entity reference across the app.
- **Anti-patterns:** never apply a drop shadow or colored background behind a Token Logo that could clash with the asset's own brand color.

### Fund Logo
- **Purpose:** circular fund logo. Identical spec to Token Logo, separated as its own primitive only because Funds and Projects are never visually interchangeable (`DESIGN_SYSTEM.md` Rule 16/Anti-pattern 29) — keeping them as distinct primitives prevents a future implementation from accidentally rendering a Fund where Project styling (e.g. a Score ring) is implied.
- **Usage:** every Fund-entity reference (Top Funds, Fund Card, Funding Card's investor logos).

### Chain Logo
- **Purpose:** circular blockchain/platform logo (Ethereum, Solana, Base, etc.). Identical spec to Token Logo, separated as its own primitive for the same reasoning as Fund Logo — chains are a distinct entity type from Projects and Funds (Markets' "Trending Platforms" section).
- **Usage:** Project Detail Hero (chain context line), Markets Trending Platforms.

### Loading Dot
- **Purpose:** minimal inline loading indicator for very small contexts where a full Skeleton Block would be disproportionate (e.g. a single inline value still resolving inside an otherwise-loaded row).
- **Variants:** single (3-dot pulsing sequence).
- **States:** animating only.
- **Props:** size (defaults to `Caption`-text-height equivalent, ~13px).
- **Sizing:** ~24px wide total (3 dots + gaps).
- **Usage:** rare — an already-rendered List Item row where one field's value is still resolving asynchronously after the row itself appeared.
- **Anti-patterns:** never use Loading Dot for a component's primary/first-rendered content — that always uses Skeleton Block.

### Skeleton Block
- **Purpose:** loading placeholder matching the exact shape of pending content.
- **Variants:** Block (rectangular, for cards), Line (text-shaped), Circle (avatars/logos).
- **States:** shimmering (animated gradient sweep, continuous until content resolves).
- **Props:** shape variant, exact width/height (always matches the real component it stands in for).
- **Spacing:** identical to the real content's spacing — zero layout shift on resolve.
- **Sizing:** matches host component exactly.
- **Usage:** any component awaiting data.
- **Anti-patterns:** never use a generic/mismatched-size Skeleton; never use Skeleton for full-page loads (that's a Loading Layout concern, Section 4) — Skeleton is for content-shaped regions specifically.

### Notification Dot
- **Purpose:** the specific Dot-variant Badge usage for "something here changed/needs attention" (distinct naming from generic Badge because of its specific semantic: unread/unseen state, not a count).
- **Variants:** single (red dot, 8px).
- **States:** visible / removed-once-seen.
- **Props:** none beyond visibility boolean.
- **Usage:** Watchlist row (pending event exists), bell icon (unread notifications exist), bottom nav Watchlist tab icon (if an unseen alert exists for a watched item).
- **Anti-patterns:** never combine Notification Dot and Counter Badge on the same element — pick the one that matches whether the underlying state is binary (seen/unseen) or countable (N items).

---

# 4. Layout Components

### Section Header
- **Height:** auto (Title text ~22px + optional Caption subtitle ~18px + their internal gap).
- **Padding:** 16px horizontal margin matching screen gutters; `space-6` (24px) gap above (separation from prior Section); `space-3` (12px) gap below (to first content row).
- **Spacing:** 4px gap between Title and optional Subtitle.
- **Behavior:** optionally renders a trailing "See all ›" Text+Icon action (Button primitive, Text variant); the header text itself is never tappable, only the explicit action is.

### Scrollable Section
- **Height:** intrinsic to content (this is a layout behavior, not a fixed-height container).
- **Padding:** inherits screen's 16px horizontal margin; vertical padding `space-4` (16px) between this Section and adjacent Sections, layered with Section Header's own `space-6` top gap.
- **Spacing:** children (Cards/Lists) stack with `space-3` (12px) gap by default.
- **Behavior:** the default container for any vertically-stacked group of Cards/List Items within a Page; participates in the Page's single vertical scroll, never creates its own independent scroll context (that's Horizontal Carousel's job).

### Horizontal Carousel
- **Height:** matches its tallest child card exactly (180px for Hero-density rows, 120–132px for Mini/compact rows).
- **Padding:** first child gets a 16px left inset, last child gets a 16px right inset (so the scroller's content aligns with the screen's gutters at rest).
- **Spacing:** `space-3` (12px) gap between cards.
- **Behavior:** Snap-to-card on scroll release for primary/hero rows (Weekly Picks); free/continuous scroll for lower-emphasis rows (Related Projects, Markets trending). The next card is always partially visible at the trailing edge to signal "more exists" — never ends flush with the viewport.

### Grid
- **Height:** auto, rows wrap based on container width.
- **Padding:** 16px horizontal screen margin; internal cell gutters `space-4` (16px) both axes.
- **Spacing:** fixed 2-column layout only (this product's reference width does not support 3+ columns at readable density) — used exclusively for Stat Card grids (Market Metrics, Tokenomics).
- **Behavior:** static, non-scrolling within itself; cells are never independently tappable unless explicitly specified by the Stat Card itself.

### List
- **Height:** auto, sum of row heights + dividers.
- **Padding:** 16px horizontal screen margin (applied to row content, not the divider, which insets to match).
- **Spacing:** rows separated by 1px Divider (Inset variant) — no additional gap beyond the divider and each row's own internal padding.
- **Behavior:** vertical-only, participates in Page scroll; supports Pull To Refresh when it is the primary content of its Page (Watchlist); supports per-row swipe/long-press where the underlying Card type defines it.

### Bottom Sheet Layout
- **Height:** auto up to 85% of viewport height, scrollable internally beyond that.
- **Padding:** 16px internal padding on all sides below the drag handle.
- **Spacing:** drag handle (4×36px) centered with 8px top/bottom margin before content begins.
- **Behavior:** slides up from bottom edge (`duration-standard`, ease-out), scrim fades in simultaneously; dismiss via drag-down past a velocity/distance threshold, tap-outside on the scrim, or an explicit close action; never stacks (a second Bottom Sheet request replaces, not layers on top of, the first).

### Modal Layout
- **Height:** auto, capped at a comfortable reading height (~60% viewport), centered vertically and horizontally.
- **Padding:** 24px internal padding (more generous than Bottom Sheet's 16px, reflecting the decision-weight of this layout).
- **Spacing:** 16px gap between message text and action buttons.
- **Behavior:** scale-up + fade-in entrance (`duration-standard`), scrim fades in simultaneously; always presents exactly two actions side-by-side (confirm/cancel) or one full-width action — never three or more.

### Sticky Header
- **Height:** 56px expanded; collapses to a slimmer 44px state once the Page scrolls past its hero content (Home's Market Overview, Project Detail's Hero).
- **Padding:** 16px horizontal.
- **Spacing:** icon-to-title gaps per Top App Bar component (Section 6).
- **Behavior:** glass/blur effect applies only once content has scrolled beneath it (`DESIGN_SYSTEM.md` Section 7); never fully disappears except during Search's keyboard-focused state.

### Sticky Footer
- **Height:** 90px (56px bar + 34px safe area) — this layout slot is occupied exclusively by Bottom Navigation in this product; no screen defines its own custom Sticky Footer.
- **Behavior:** persists across all 5 primary tabs; hidden on Splash, Login, and while a text input is focused (Search).

### Search Layout
- **Height:** full remaining viewport below the Sticky Header.
- **Padding:** 16px horizontal for all list content beneath the input.
- **Spacing:** `space-5` (20px) gap between the Recent/Trending/Popular sections in the default (pre-typing) state.
- **Behavior:** swaps instantly between Default state (Recent → Trending → Popular) and Typed state (live grouped results) based on input content — both states share this one Layout, never two separate screens.

### Empty Layout
- **Height:** centered within the available content area (not the full viewport — respects Sticky Header/Footer bounds).
- **Padding:** `space-8` (40px) vertical breathing room above/below the centered content block.
- **Spacing:** `icon-xl` illustration → 16px gap → Subtitle headline → 8px gap → Caption helper text → 24px gap → CTA Button (when applicable).
- **Behavior:** static (no animation beyond a subtle entrance fade, `duration-quick`); the section-level inline variant (e.g. "No fundraises this week") does not use this full Layout — it's a single muted Caption line within the affected Card/Section instead.

### Loading Layout
- **Height:** full viewport (Splash) or full content area (initial Page load before any Skeleton-shaped structure is known).
- **Padding:** centered content, no fixed padding values — purely a centering container.
- **Spacing:** n/a (single centered element — Loading Dot or a small spinner).
- **Behavior:** used only at the two true "unknown shape" moments in the app (Splash, and the brief instant before a Page's Skeleton structure can render); every other loading scenario uses Skeleton Block within the normal Page layout instead.

---

# 5. Card Library

*This is the most important section — every Card below is fully specified and is the only permitted implementation of its kind. "Maximum number of displayed values" is a hard cap, not a guideline.*

### Market Overview Card
- **Purpose:** one-glance macro market context (BTC/ETH/BNB, Total Market Cap, Fear & Greed).
- **Visual hierarchy:** 3-column coin row (equal weight) above a divider, 2-column macro-stat row below.
- **Information priority:** the 3 coins are peers (no single coin emphasized); Fear & Greed is the most "interpretive" value and sits last, after the more literal Total Market Cap.
- **Required fields:** BTC/ETH/BNB price + 24h %, Total Market Cap + 24h %, Fear & Greed value + label.
- **Optional fields:** none — this card's composition is fixed; it does not support add/remove fields.
- **Variants:** single (no variants — this is a singular, named card, not a reusable pattern instantiated elsewhere).
- **Loading:** entire card shimmers as one Skeleton Block unit (not per-field) — its composition is fixed enough that partial-loading would look broken.
- **Empty:** not applicable (always has data once the app has any connectivity).
- **Error:** inline retry within the card body, replacing the macro-stat row only (coin prices, if already loaded, remain visible).
- **Interaction:** non-tappable as a whole; optionally the Fear & Greed value is tappable to open a Tooltip (one-sentence explainer).
- **Animation:** per-field color-flash on live value change (Live Market Update spec); Fear & Greed gradient-color transition on band-crossing.
- **Height:** 168px.
- **Spacing:** 16px internal padding; 8px gap between the two internal rows and their divider.
- **Maximum displayed values:** 5 (BTC, ETH, BNB, Mkt Cap, Fear & Greed) — hard cap per `DESIGN_SYSTEM.md`/Section 11.
- **Anti-patterns:** never add a 4th coin "while we're at it"; never let this card scroll horizontally internally — all 5 values are always simultaneously visible.

### Weekly Pick Card
- **Purpose:** the product's hero unit — one curated, scored project for this week.
- **Visual hierarchy:** Token Logo + name → Score Circle (Compact) → 3 supporting signals (Funding Quality, TVL Trend, Unlock Risk) → "Why?" action.
- **Information priority:** Score is the verdict, shown first/largest; the 3 supporting signals justify it; "Why?" is the escape hatch to full reasoning.
- **Required fields:** project name, logo, Score, grade, Funding Quality (Pill), TVL Trend (Sparkline + Trend Arrow), Unlock Risk (Risk Indicator, Dot-only variant).
- **Optional fields:** rank number (#1, #2...) — shown when the card is part of an explicitly ranked set.
- **Variants:** Standard (this spec).
- **Loading:** full-card Skeleton Block (logo circle + lines + ring placeholder).
- **Empty:** not applicable at the card level (absence is handled by the parent Carousel/Section, not by an empty Weekly Pick Card).
- **Error:** card renders with a muted "Couldn't load" Caption replacing its content, retains its fixed footprint in the Carousel.
- **Interaction:** entire card is tappable → Project Detail; "Why?" is a separate, smaller tap target opening a Bottom Sheet (Score Breakdown Card content) without navigating away.
- **Animation:** entrance fade-in when the Carousel first renders (`duration-quick`, staggered per card by 30ms); press state scales to 0.97.
- **Height:** 180px.
- **Width:** 220px (fixed, horizontal-scroll context only).
- **Spacing:** 16px internal padding; `space-2` (8px) between each of the 4 stacked rows.
- **Maximum displayed values:** 4 metrics (Score, Funding, TVL, Unlock) — never add a 5th without removing one.
- **Anti-patterns:** never include a Primary Button inside this card (tap-vs-swipe ambiguity in a horizontal scroller — see `DESIGN_SYSTEM.md` Anti-pattern 18); never show all 7 score sub-components here.

### Featured Pick Card
- **Purpose:** a single, larger-emphasis variant of Weekly Pick Card reserved for the #1 ranked pick specifically, when a screen wants to give it outsized visual weight (e.g. a future "Today's Top Pick" moment on Home, distinct from the Weekly Picks carousel).
- **Visual hierarchy:** same field set as Weekly Pick Card, laid out full-width instead of fixed-width-in-a-scroller, with the Score Circle rendered at a larger size (closer to Compact-large, ~56px ring instead of 40px).
- **Required fields:** identical to Weekly Pick Card.
- **Variants:** this *is* the variant — Featured Pick Card is conceptually "Weekly Pick Card, full-width emphasis variant," not a fully independent card type; it shares the same field set, loading/empty/error behavior, and interaction model.
- **Height:** 200px (full-width, taller than the compact 180px to accommodate the larger Score Circle).
- **Width:** full-bleed (viewport − 32px).
- **Spacing:** 20px internal padding (slightly more generous than Weekly Pick Card's 16px, reinforcing its outsized importance).
- **Maximum displayed values:** 4 metrics, same cap as Weekly Pick Card.
- **Anti-patterns:** never use Featured Pick Card inside a horizontal Carousel — its full-width footprint is reserved for single, standalone placement only.

### Project Card
- **Purpose:** general-purpose project summary used outside the Weekly Picks context (Related Projects, Markets Trending Projects).
- **Visual hierarchy:** Token Logo → name → Score Circle (Compact) → Trend Arrow.
- **Required fields:** name, logo, Score, grade.
- **Optional fields:** one Tag (category), shown only in contexts with room (not in the tightest Mini variant).
- **Variants:** Standard (140×120px, used in Markets/Related Projects carousels).
- **Loading:** Skeleton Block matching exact footprint.
- **Empty:** n/a (handled by parent Carousel).
- **Error:** muted "—" placeholder in place of Score, logo falls back to initials; card remains tappable (retries on tap).
- **Interaction:** entire card tappable → Project Detail.
- **Animation:** press scale to 0.97; entrance fade per Carousel stagger.
- **Height:** 120px.
- **Width:** 140px.
- **Spacing:** 12px internal padding; `space-1` between stacked elements.
- **Maximum displayed values:** 2 (Score + Trend) plus name/logo — deliberately leaner than Weekly Pick Card, since this Card's job is browsing density, not deep justification.
- **Anti-patterns:** never add Funding Quality or Unlock Risk to this card — that depth is reserved for Weekly Pick Card and Project Detail only.

### Compact Project Card
- **Purpose:** the leanest project reference, used inside dense vertical Lists where a full Card would be too tall (e.g. a future "search results as cards" treatment, or Score Breakdown Card's "related context" row).
- **Visual hierarchy:** Token Logo (small) + name, inline, with Score Circle (Compact, smallest size) trailing.
- **Required fields:** name, logo, Score.
- **Optional fields:** none.
- **Variants:** single.
- **Height:** 48px (single row, not card-chrome — no border/shadow, sits directly in a List).
- **Width:** full-bleed.
- **Spacing:** 16px horizontal padding (matches List Item).
- **Maximum displayed values:** 1 (Score only — no Trend Arrow, no Tag).
- **Anti-patterns:** never give this component Card-level elevation/border — it is intentionally a List Item visually, named "Card" only for its conceptual role as a project-summary unit in this library.

### Funding Card
- **Purpose:** summarize one funding round within Project Detail's Funding section.
- **Visual hierarchy:** round type + amount (headline) → date → summarized investor list.
- **Required fields:** round type, amount raised, announced date, lead investor name(s) (summarized, "+N more" beyond 2 names).
- **Optional fields:** FDV at round time (shown only if available).
- **Variants:** single.
- **Loading:** Skeleton Block, 3 lines.
- **Empty:** Project Detail's Funding Section shows a single muted Caption ("No funding data available yet") instead of rendering zero Funding Cards.
- **Error:** inline retry within the Funding Section, not per-card.
- **Interaction:** non-tappable by default; investor names are tappable individually → Fund Detail.
- **Animation:** none beyond standard list entrance.
- **Height:** 72px.
- **Width:** full-bleed.
- **Spacing:** 16px internal padding; 8px gap between sibling Funding Cards within the Funding Section.
- **Maximum displayed values:** 3 (round type+amount counts as one headline value, date, investors) — full cap-table detail is explicitly deferred to "View all rounds."
- **Anti-patterns:** never list every co-investor by name inline — always summarize past 2 names.

### Fund Card
- **Purpose:** summarize one fund (Top Funds list, Markets Trending Funds, Fund Detail header context).
- **Visual hierarchy:** Fund Logo → name → portfolio project count.
- **Required fields:** name, logo, portfolio project count.
- **Optional fields:** avg. investor score (shown only in Top Funds context where ranking by this value is the section's purpose).
- **Variants:** List (56–64px row, Top Funds), Mini (140×120px, Markets trending carousel — matches Project Card's Mini footprint for visual rhythm consistency).
- **Loading:** Skeleton Block per variant's exact footprint.
- **Empty:** n/a (parent Section handles absence).
- **Error:** muted fallback, logo to initials, count to "—", remains tappable.
- **Interaction:** entire card tappable → Fund Detail.
- **Animation:** press scale 0.97; entrance fade.
- **Height:** 64px (List) / 120px (Mini).
- **Maximum displayed values:** 2 (portfolio count + optional avg. score) — **never a Score Circle** (Anti-pattern: Funds never display a Score).
- **Anti-patterns:** never render a Score Circle on a Fund Card under any circumstance.

### Watchlist Card
- **Purpose:** the personal, return-visit-driving row for a watched Project or Fund.
- **Visual hierarchy:** logo → name → Score Circle (Compact, Project rows only) → 24h % + Trend Arrow → Notification Dot (conditional).
- **Required fields:** name, logo, Score (Project rows) or portfolio count (Fund rows), 24h % + direction.
- **Optional fields:** Notification Dot — shown only if a qualifying event exists (per the explicit rule defined in `DESIGN_SYSTEM.md` Anti-pattern/Weakness discussion: unlock within 7 days AND >1% supply, or score moved ≥5 points this week).
- **Variants:** Project row, Fund row (field set differs per the Fund Card "no Score" rule above — Fund rows show portfolio count where Project rows show Score Circle).
- **Loading:** Skeleton Block per row.
- **Empty:** handled at the List/Page level (Watchlist's Empty Layout), not by this Card.
- **Error:** stale/cached data shown with a small inline "couldn't refresh" Caption above the list (List-level, not per-row).
- **Interaction:** entire row tappable → Project/Fund Detail; long-press (future-reserved) → quick-remove contextual action; swipe (future-reserved) → quick-remove.
- **Animation:** Notification Dot scale-in on first appearance; 24h % value color-flashes on live update; star/watchlist removal triggers a brief row fade-out + height-collapse if removed from this screen directly.
- **Height:** 64px.
- **Width:** full-bleed.
- **Spacing:** 16px horizontal padding, 8px gap between rows (via Divider, not margin).
- **Maximum displayed values:** 3 (Score/count, 24h%, notification state).
- **Anti-patterns:** never show sub-scores or funding detail here — this row is a monitoring surface, not a research surface.

### Unlock Card
- **Purpose:** summarize one upcoming token unlock event.
- **Visual hierarchy:** date (leading, most scannable) → project name → allocation type → % of supply / USD value.
- **Required fields:** date, project name, % of supply.
- **Optional fields:** USD value, allocation type label (Team/Ecosystem/etc.) — shown when available.
- **Variants:** Standard (Project Detail's Unlock Schedule, Markets' Unlock Calendar), Compact (Home's Market Feed — date + name + % only, no USD value).
- **Loading:** Skeleton Block, 2 lines.
- **Empty:** Section-level muted Caption ("No upcoming unlocks") rather than zero cards.
- **Error:** inline retry within its Section.
- **Interaction:** tappable → Project Detail (when shown outside Project Detail itself; non-tappable when already inside that project's own Project Detail page).
- **Animation:** Risk Indicator color reflects severity per the existing 3-band mapping; no other motion beyond list entrance.
- **Height:** 64px (Standard) / 56px (Compact).
- **Maximum displayed values:** 3 (Standard) / 2 (Compact).
- **Anti-patterns:** never omit the Risk Indicator's severity coloring "to keep it neutral" — risk must always be visually legible, not just textual.

### Recently Added Card
- **Purpose:** flag a newly-onboarded project/fund/platform.
- **Visual hierarchy:** logo → name → "added Xd ago" Caption.
- **Required fields:** name, logo, relative added-date.
- **Optional fields:** none.
- **Variants:** single — always rendered inside a compact feed-style List (Home Market Feed, Markets Recently Added section), never as a standalone large card.
- **Height:** 44px row.
- **Maximum displayed values:** 1 (the relative date) beyond name/logo.
- **Anti-patterns:** never show a Score on this card — "recently added" entities frequently have insufficient data for a meaningful Score yet; showing one risks displaying a misleadingly low/default value.

### Trending Card
- **Purpose:** flag a project/fund/platform currently gaining attention, used in Markets' Trending Projects/Funds/Platforms sections.
- **Visual hierarchy:** logo → name → Score Circle (Compact, Projects only) or portfolio count (Funds) → Trend Arrow.
- **Required fields:** name, logo, the entity-appropriate secondary metric (Score for Projects, count for Funds, none for Platforms beyond name+logo).
- **Variants:** Project-Trending (= Project Card, Standard variant, reused identically), Fund-Trending (= Fund Card, Mini variant, reused identically), Platform-Trending (logo + name only, no secondary metric — Chain Logo + Text).
- **Note:** "Trending Card" is a **contextual label for an existing Card type**, not a new visual component — Trending Projects renders Project Cards, Trending Funds renders Fund Cards (Mini), Trending Platforms renders a minimal logo+name card. This avoids a 4th near-duplicate card type existing solely for Markets.
- **Anti-patterns:** never build a separate "TrendingProjectCard" component distinct from Project Card — reuse is mandatory here (Section 1's composition-over-duplication principle applied directly).

### Market Feed Card
- **Purpose:** the compact, multi-item feed container used on Home (Recent Fundraises / Recently Added / Upcoming Unlocks, 3 items each + "See all").
- **Visual hierarchy:** Section icon+title+"See all" header row → up to 3 child rows (each a Funding Card-summary line, Recently Added Card, or Unlock Card Compact variant respectively).
- **Required fields:** section title, icon, up to 3 child item rows.
- **Optional fields:** none.
- **Variants:** Fundraise variant, Recently-Added variant, Unlock variant — same outer container, different inner row type per the Card types above.
- **Loading:** header renders immediately (static), 3 row-shaped Skeleton Blocks beneath.
- **Empty:** inner body replaced with a single muted Caption line ("No new fundraises this week"), header remains.
- **Error:** inline retry replacing the row area only.
- **Interaction:** "See all" navigates to the relevant Markets section; individual rows tappable → respective Detail screen.
- **Animation:** standard list entrance; no special motion.
- **Height:** 100–132px depending on variant (2–3 rows + header).
- **Width:** full-bleed.
- **Spacing:** 14px internal padding, 8px gap between child rows.
- **Maximum displayed values:** exactly 3 child rows, never more — "See all" is the only way to see a 4th.
- **Anti-patterns:** never let this card grow past 3 visible rows "because there's room" — the 3-item cap is what keeps Home's Market Feed feeling like a glance, not a sub-page.

### Metrics Card
- **Purpose:** Project Detail's quantitative Market Metrics block (market cap, FDV, TVL, volume, etc.).
- **Visual hierarchy:** 2×2 Stat Card grid (Grid Layout Component), each cell = label (Caption) above value (Numeric), optional Trend Arrow inline with TVL/price-derived cells.
- **Required fields:** market cap, 24h volume, TVL (+ change), one more context-dependent metric (fees, FDV).
- **Optional fields:** any additional metric beyond the core 4 is explicitly deferred — see Section 11's 4-value cap.
- **Variants:** single.
- **Loading:** each grid cell's value shimmers independently (label renders immediately, static).
- **Empty:** if a project genuinely has no metrics data, the entire card is omitted from the page (not rendered with all-dash placeholders) and the Section Header still appears with a muted Caption fallback.
- **Error:** inline retry replacing the grid.
- **Interaction:** non-tappable.
- **Animation:** per-cell color-flash on live update.
- **Height:** auto (~120px for a 2×2 grid).
- **Maximum displayed values:** 4.
- **Anti-patterns:** never use a 3-column or asymmetric grid here — always 2×2 for scan-pattern consistency with Tokenomics Card below.

### Tokenomics Card
- **Purpose:** Project Detail's supply/allocation context.
- **Visual hierarchy:** stacked label/value rows (not a grid — these values vary in label length more than Metrics Card's, so a 2-column grid reads worse here).
- **Required fields:** circulating supply (with max supply as a fraction), FDV.
- **Optional fields:** total supply (if distinct from max supply), allocation breakdown (deferred to a future Bottom Sheet if added — not inline by default).
- **Variants:** single.
- **Loading:** Skeleton Block, 3 lines.
- **Empty:** card omitted entirely if no tokenomics data exists (same rule as Metrics Card).
- **Height:** auto (~96px for 3 rows).
- **Maximum displayed values:** 3 stacked rows.
- **Anti-patterns:** never force this into the same 2×2 grid as Metrics Card — different data shapes need different internal layouts, even within one visual "Card" family.

### Score Breakdown Card
- **Purpose:** the full, all-7-sub-scores detail revealed via "See full breakdown" — lives inside a Bottom Sheet, not inline on the page.
- **Visual hierarchy:** Overall Score Circle (Full, repeated from the page above it for context) → 7 individual sub-score rows, each a label + Progress (Linear) + numeral.
- **Required fields:** all 7 sub-scores (funding, investor, market, tvl, revenue, unlock, momentum) with their values and a one-line plain-language note each.
- **Optional fields:** none — this is the one place all 7 are appropriate, since the user explicitly requested depth.
- **Variants:** single.
- **Loading:** Skeleton Block per row, 7 rows.
- **Error:** inline retry within the Sheet, sheet remains open.
- **Interaction:** non-tappable rows (informational only); Sheet dismiss via drag/scrim-tap/close icon.
- **Animation:** Bottom Sheet entrance per Layout spec; each Progress bar fill-animates in sequence (staggered 30ms per row) on first reveal.
- **Height:** auto, scrollable Bottom Sheet (7 rows + header exceeds a Fixed-height sheet).
- **Maximum displayed values:** 7 (this is the explicit exception to the general "max 4" card rule, justified by being an intentional, opt-in depth view, not a default-visible card).
- **Anti-patterns:** never surface this content inline on the main Project Detail page — it must always live behind the explicit "See full breakdown" action.

### Bull Case Card
- **Purpose:** a future-reserved, explicitly positive-framing summary card (e.g. AI- or editorially-generated "why this could do well") — defined now to reserve its slot in the Why-This-Score section's layout, not yet populated by any current backend capability.
- **Visual hierarchy:** small "Bull Case" label (success-tinted) → up to 3 bullet points.
- **Required fields:** at least 1 bullet point.
- **Variants:** single.
- **Height:** auto, max 3 lines of bullets.
- **Maximum displayed values:** 3 bullets.
- **Anti-patterns:** never show Bull Case without its Bear Case counterpart present somewhere on the same screen — one-sided framing undermines the product's research-tool credibility.

### Bear Case Card
- **Purpose:** the symmetric negative-framing counterpart to Bull Case Card.
- **Visual hierarchy:** "Bear Case" label (warning-tinted, not danger — a bear case is caution, not an error state) → up to 3 bullet points.
- **Required fields:** at least 1 bullet point.
- **Height/Maximum:** identical spec to Bull Case Card.
- **Anti-patterns:** never tint Bear Case with `danger` red — that miscasts "things to watch" as an active error/alarm.

### Related Project Card
- **Purpose:** the Project Detail page's bottom-of-page navigation-exit row.
- **Visual hierarchy:** identical to Project Card (Standard, Mini footprint) — this is a usage-context label, not a new visual component, exactly like Trending Card's relationship to Project Card/Fund Card above.
- **Required fields:** same as Project Card.
- **Optional addition specific to this context:** a one-line "why related" Tag (e.g. "Same category," "Backed by a16z too") per the earlier UX-improvement recommendation — shown when the relation reason is known.
- **Anti-patterns:** never build a separate component for this — reuse Project Card.

### Notification Card
- **Purpose:** one row inside a future Notification Center (Section 14) or the bell-icon dropdown/sheet.
- **Visual hierarchy:** icon (context-dependent: unlock/score-change/fundraise) → message (Body, 2-line max) → relative timestamp (Caption) → unread Notification Dot.
- **Required fields:** icon, message, timestamp.
- **Optional fields:** unread state.
- **Variants:** Unlock-alert, Score-change, Fundraise, System/Generic.
- **Height:** 64px.
- **Maximum displayed values:** message + timestamp (2 values) + icon + unread dot.
- **Anti-patterns:** never let a notification message exceed 2 lines — longer content belongs behind a tap-through to the relevant Detail screen.

### Profile Card
- **Purpose:** the Profile Page's header identity block (Avatar + name + handle + membership Pill).
- **Visual hierarchy:** Avatar (64px) → name (Heading) → handle (Caption) → membership Pill.
- **Required fields:** name, avatar.
- **Optional fields:** handle, membership Pill (shown only for actual Academy members).
- **Variants:** single.
- **Height:** auto (~100px).
- **Maximum displayed values:** 3 (name, handle, membership) beyond the avatar.
- **Anti-patterns:** never add stats (e.g. "Member since," watchlist count) directly into this card — Profile is intentionally quiet (per `DESIGN_SYSTEM.md` Section 1); such stats belong in a separate settings row if ever needed, not the identity header.

### Search Result Card
- **Purpose:** one row in Search's typed-state results list.
- **Visual hierarchy:** logo → name → ticker/category Tag (optional) — **no Score, no price**.
- **Required fields:** name, logo.
- **Optional fields:** ticker (Projects), category Tag.
- **Variants:** Project-Result, Fund-Result (identical layout, different entity).
- **Height:** 48px.
- **Maximum displayed values:** 1 (the optional ticker/tag) beyond name/logo — deliberately the leanest card in the entire library, by design (Section 1, Search philosophy).
- **Anti-patterns:** never add a Score Circle or price to this card under any circumstance — this is the one hard exception that must never be "improved" with more data, per the explicit Search design decision.

---

# 6. Navigation Components

### Bottom Navigation
- **Interaction:** single tap switches the active Page; tapping the already-active tab scrolls its Page back to the top (standard "tap home icon to go home" convention) rather than doing nothing.
- **Animation:** active icon scale-bounce (1.0→1.15→1.0, `duration-quick`) on tap; Page content cross-fades (`duration-quick`); active indicator (icon fill + accent color + label color) transitions instantly with the tap, never lags behind the Page transition.
- **States:** active (filled icon, accent color, label visible/emphasized), inactive (outline icon, `neutral-text-secondary`), badged (Notification Dot or Counter overlaid, independent of active/inactive state).

### Search Bar
- **Interaction:** Home variant is a tap-to-navigate affordance (not directly editable in place — tapping it always transitions to the Search Page with the real input auto-focused); Search Page variant is a live, real text input.
- **Animation:** Home variant has no special motion beyond standard press feedback; Search Page variant's focus triggers the keyboard rise + Bottom Navigation fade-out (`duration-quick`) described in `DESIGN_SYSTEM.md` Section 10.
- **States:** placeholder, focused, typed (shows a trailing "✕" clear action), disabled (rare — only during an auth/connectivity gate).

### Back Button
- **Interaction:** single tap or native edge-swipe-back gesture (where the platform supports it) — both must be wired to the identical navigation action.
- **Animation:** triggers the standard Back Navigation page transition (`duration-standard`, slide-out to right, mirroring the forward slide-in exactly); icon itself has only the standard Icon Button press feedback.
- **States:** default, pressed, disabled (only at the true root of a navigation stack, where Back Button is not rendered at all rather than shown disabled).

### Segment Tabs
- **Interaction:** single tap selects a segment, immediately filtering the content below in place (no page navigation).
- **Animation:** selected-segment pill background slides to the new position (`duration-quick`, ease-out); content beneath cross-fades with a slight overlap (`duration-quick`).
- **States:** default (unselected segment), selected, disabled (an entire Segment Tabs control may be disabled while its data source is unavailable, e.g. Watchlist's Funds tab during an outage — shown at `opacity-disabled`).

### Filter Chips
- **Interaction:** single tap toggles a Chip's selected state, re-sorting/filtering the Page's content; multiple Chips may be mutually exclusive (Markets' All/Gainers/Losers/New) or independently toggleable depending on the specific filter set's semantics — this must be specified per usage, not assumed.
- **Animation:** selected-state fill transitions `duration-quick`; the Chip row itself has standard horizontal-scroll momentum.
- **States:** default, selected, disabled.

### Sort Menu
- **Interaction:** tapping a sort-trigger Icon Button opens a Bottom Sheet (Fixed-height variant) listing sort options as a simple List; selecting an option closes the Sheet and re-orders the underlying content.
- **Animation:** standard Bottom Sheet entrance/exit; the selected sort option's row shows a brief checkmark-appear animation (`duration-quick`) before the Sheet auto-dismisses.
- **States:** trigger icon (default/pressed), Sheet row (default/selected).

### Pagination
- **Interaction:** this product does not use traditional numbered pagination anywhere — long lists use Infinite Scroll (`DESIGN_SYSTEM.md` Section 10) instead. Pagination as a component is reserved/defined here only for a future Admin Dashboard context (Section 14's explicit "sibling system" carve-out), not for any mobile screen in this product.
- **Anti-pattern:** never introduce numbered pagination controls on any mobile screen in this product.

### Floating Action
- **Interaction:** this product does not currently use a Floating Action Button (FAB) on any screen — every primary action in this product's IA is either a header icon action (Watchlist star) or a Carousel/Card tap, never a floating, screen-independent button. This component is defined here as explicitly **reserved-but-unused**: if a future feature genuinely needs a persistent cross-screen quick-action (e.g. a future "Ask AI" entry point), it must be specified with its own motion/placement rules added to this document before implementation — never added ad hoc.

---

# 7. Screen Composition

*No screen may introduce a component not defined in Sections 3–6. If a screen's design appears to need something new, extend this document first.*

### Home
```
HomePage
 ├─ Top App Bar (Greeting variant — collapsing)
 ├─ Search Bar (Home/entry-point variant)
 ├─ Market Overview Card
 ├─ Section Header ("WEEKLY PICKS," with view toggle + "View All")
 │   └─ Horizontal Carousel → Weekly Pick Card × N
 ├─ Section Header ("MARKET FEED" group)
 │   ├─ Market Feed Card (Fundraise variant)
 │   ├─ Market Feed Card (Recently-Added variant)
 │   └─ Market Feed Card (Unlock variant)
 └─ Bottom Navigation
```

### Markets
```
MarketsPage
 ├─ Top App Bar (Static title — "Markets")
 ├─ Filter Chips (sticky, below header)
 ├─ Section Header ("TRENDING PROJECTS") → Horizontal Carousel → Project Card × N
 ├─ Section Header ("TRENDING FUNDS") → Horizontal Carousel → Fund Card (Mini) × N
 ├─ Section Header ("TRENDING PLATFORMS") → Horizontal Carousel → Chain Logo+Text mini-cards × N
 ├─ Section Header ("TOP GAINERS") → List → compact gain rows (Text + Trend Arrow)
 ├─ Section Header ("TOP LOSERS") → List → compact loss rows
 ├─ Section Header ("RECENTLY ADDED") → List → Recently Added Card × N
 ├─ Section Header ("RECENT FUNDRAISES") → List → Funding Card (summary-line form) × N
 ├─ Section Header ("UNLOCK CALENDAR") → List → Unlock Card (Standard) × N
 └─ Bottom Navigation
```

### Search
```
SearchPage
 ├─ Top App Bar (Search-input variant, auto-focused)
 ├─ Search Layout
 │   ├─ (Default state) Section Header "RECENT" → List → Search Result Card × N (with ✕ remove)
 │   ├─ (Default state) Section Header "TRENDING THIS WEEK" → List → Search Result Card × N
 │   ├─ (Default state) Section Header "POPULAR PROJECTS" → List → Search Result Card × N
 │   └─ (Typed state) Section Header "PROJECTS" / "FUNDS" → List → Search Result Card × N
 └─ Bottom Navigation (hidden while keyboard focused)
```

### Project Detail
```
ProjectDetailPage
 ├─ Top App Bar (Back+Title+Action variant — collapsing)
 ├─ Hero (Token Logo, name, ticker, Chain Logo+category line, price + Trend Arrow)
 ├─ Score Breakdown Card trigger context:
 │   ├─ Score Circle (Full variant)
 │   └─ "See full breakdown" → Bottom Sheet Layout → Score Breakdown Card
 ├─ Section Header ("WHY THIS SCORE") → Risk Indicator + Bull Case Card + Bear Case Card rows
 ├─ Section Header ("FUNDING") → List → Funding Card × N (+ "View all rounds")
 ├─ Section Header ("TOKENOMICS") → Tokenomics Card
 ├─ Section Header ("MARKET METRICS") → Metrics Card (Grid)
 ├─ Section Header ("UNLOCK SCHEDULE") → Unlock Card (Standard) × N
 ├─ Section Header ("RELATED PROJECTS") → Horizontal Carousel → Related Project Card × N
 └─ Bottom Navigation
```

### Watchlist
```
WatchlistPage
 ├─ Top App Bar (Static title — "Watchlist" + sort action)
 ├─ Segment Tabs (Projects / Funds, sticky)
 ├─ List → Watchlist Card × N (per active segment)
 │   └─ (if zero items) Empty Layout, replacing the List entirely
 └─ Bottom Navigation
```

### Profile
```
ProfilePage
 ├─ Top App Bar (Static title — "Profile")
 ├─ Profile Card
 ├─ List → List Item (Simple variant) × 7 rows (Telegram Account, Academy Membership, Notification Settings, Theme, Feedback, About, Terms)
 ├─ Text (Caption, app version, centered)
 └─ Bottom Navigation
```

---

# 8. Motion Specification

*Every component's tap/press/loading/appear/disappear/refresh/success/failure/disabled behavior. Durations and curves reference `DESIGN_SYSTEM.md` Section 10's vocabulary (`instant/quick/standard/deliberate`). Descriptions only — no code.*

| Component | Tap | Press | Loading | Appearing | Disappearing | Refresh | Success | Failure | Disabled |
|---|---|---|---|---|---|---|---|---|---|
| **Button** | triggers action instantly on release | scale 0.97, opacity 0.9, quick | label replaced by inline spinner, same bounds | n/a (buttons don't "appear" independently of their host screen) | n/a | n/a | brief success-tint flash then reverts, quick | brief shake (form context only) or inline error text appears below, quick | opacity 40%, no press feedback |
| **Icon Button** | triggers action instantly | background tint at 10% accent opacity, quick | rare — spinner replaces icon if the action itself is async | fades in with host header, quick | fades out with host header, quick | n/a | filled-icon toggle (e.g. star) with scale-bounce, quick | icon briefly shakes (rare, e.g. failed watchlist toggle), quick | opacity 40% |
| **Card (generic)** | navigates/activates on release | scale 0.97, quick | full-card Skeleton Block | fade-in, quick, staggered if part of a list/carousel | fade-out, quick | content cross-fades to updated values, quick | n/a (cards don't have a distinct success state) | muted fallback content + retry affordance | not applicable — cards are rarely "disabled," they show Error state instead |
| **Weekly Pick Card / Project Card / Fund Card** | navigates to Detail | scale 0.97 | Skeleton Block matching exact card footprint | staggered fade-in within Carousel (30ms offset per card) | n/a (cards don't get removed from these contexts) | values color-flash on live update | n/a | muted fallback fields, card stays tappable (retries on tap) | n/a |
| **Watchlist Card** | navigates to Detail | scale 0.97 | Skeleton Block | standard list entrance | row fade-out + height-collapse, standard, if removed in place | 24h% color-flash, quick | star/Notification Dot scale-bounce on state change | stale-data Caption banner at list level | n/a |
| **Score Circle** | non-interactive (the ring itself never taps; its host Card does) | n/a | ring + numeral shimmer as one shape | ring fill-animates 0→value, standard, on first render | n/a | ring re-animates fill + numeral cross-fades, standard (Score Change Animation) | n/a | n/a | n/a |
| **Sparkline** | non-interactive | n/a | flat shimmering line | line draws in left-to-right, standard, on first render | n/a | redraws smoothly to new data, standard | n/a | renders flat neutral dash | n/a |
| **Trend Arrow + %** | non-interactive | n/a | Skeleton Line | fades in with host value | n/a | brief color-flash + arrow direction updates instantly, quick | n/a | renders "—" with neutral arrow | n/a |
| **Chip / Segment Tabs** | toggles selection / filters in place | quick opacity dip on press | n/a (instant local UI state) | row entrance per parent | n/a | content beneath cross-fades, quick | selected-state pill snaps into new position, quick | entire control at opacity 40% if its data source fails | opacity 40%, no interaction |
| **Bottom Navigation** | switches Page | icon scale-bounce, quick | n/a | persists across app, no entrance after first load | hidden (slide-down + fade, quick) during keyboard focus / on Splash-Login | n/a | n/a | n/a | individual tab never disabled — all 5 are always reachable |
| **Search Bar** | (Home variant) navigates to Search; (Search variant) focuses keyboard | n/a | n/a | keyboard rise + nav fade-out, quick | keyboard dismiss + nav fade-in, quick | results re-filter per keystroke, instant | n/a | inline "search unavailable" banner, results degrade gracefully | n/a |
| **Toast** | non-interactive (auto-dismiss; optional tap-to-dismiss early) | n/a | n/a | slide-up + fade-in, quick | fade-out after 2.5s hold, quick | n/a | success-tinted variant | error-tinted variant (rare — most errors use inline Error State instead) | n/a |
| **Modal** | confirm/cancel actions trigger immediately | buttons get standard Button press feedback | n/a | scale-up + fade-in, standard, scrim simultaneously | scale-down + fade-out, standard | n/a | n/a (resolves by dismissing) | n/a | n/a |
| **Bottom Sheet** | drag-handle/scrim/close dismiss; content rows tap their own actions | n/a | internal content shimmers per its own component rules | slide-up from bottom, standard, scrim fades in | slide-down, standard, scrim fades out | content within can refresh independently (e.g. re-fetching Score Breakdown) | n/a | inline retry within the Sheet, Sheet stays open | n/a |
| **Accordion** | expands/collapses | n/a | n/a | height auto-animates open, quick, chevron rotates 180° in sync | height auto-animates closed, quick, chevron reverses | n/a | n/a | n/a | n/a |
| **Skeleton Block** | non-interactive | n/a | continuous shimmer sweep until resolved | fades in as a placeholder the instant its host's layout is known | cross-fades into real content, quick, zero layout shift | re-appears if a manual refresh is triggered on that section | n/a | if data ultimately fails, transitions directly to that component's Error variant | n/a |
| **Empty/Error Layout** | CTA button (if present) triggers its action | per Button spec | n/a | fade-in, quick | fade-out when content arrives, quick | n/a | n/a | this *is* the failure-state presentation | n/a |
| **Pull To Refresh** | n/a (gesture-driven, not a tap) | elastic resistance increases past 80px drag | refresh indicator spins during fetch | n/a | snap-back release animation, standard | this is itself the refresh trigger | brief success haptic/indicator collapse | indicator collapses, content stays as-is, optional inline error banner | n/a |

---

# 9. State Matrix

*Every reusable component, checked against the 9 universal states. "—" means the state is structurally not applicable to that component (explained where non-obvious).*

| Component | Default | Loading | Skeleton | Empty | Error | Offline | Disabled | Refreshing | Live Updating |
|---|---|---|---|---|---|---|---|---|---|
| Text | renders content | — | Skeleton Line (host-controlled) | — | — | — | muted color | — | — |
| Icon | renders glyph | — | — | — | — | — | opacity 40% | — | — |
| Avatar | photo/initials | spinner-free; uses skeleton | circle shimmer | — | placeholder icon | cached photo shown | — | — | — |
| Token/Fund/Chain Logo | photo/initials | — | circle shimmer | — | initials fallback | cached logo shown | — | — | — |
| Score Circle | ring + numeral | — | shimmer (ring+numeral as one shape) | — | "—" numeral, neutral ring | last-known value shown, muted | — | — | re-animates fill, cross-fades numeral |
| Sparkline | line/area | — | flat shimmer | flat neutral dash (no-data) | flat neutral dash | last-known series shown | — | — | redraws smoothly |
| Trend Arrow | arrow + % | — | Skeleton Line | — | neutral arrow, "—" | last-known shown | — | — | color-flash + instant direction update |
| Risk Indicator | icon + label | — | Skeleton Line | — | neutral/unknown state | last-known shown | — | — | — |
| Badge / Notification Dot | visible | — | — | hidden (count=0 is "empty," not rendered) | — | — | — | — | scale-bounce on new appearance |
| Progress | filled bar | — | shimmer bar | — | neutral grey bar | last-known value | — | — | re-animates fill |
| Market Overview Card | full card | — | full-card shimmer | — | inline retry, macro row only | last-known coin prices shown, muted | — | — | per-field color-flash |
| Weekly Pick Card | full card | — | full-card shimmer | — | muted fallback + retry | last-known shown, muted | — | — | Score Change Animation if updated mid-session |
| Project Card / Compact Project Card | full card | — | shimmer per footprint | — | muted fallback, fields "—" | last-known shown | — | — | color-flash |
| Fund Card | full card | — | shimmer per footprint | — | muted fallback | last-known shown | — | — | — |
| Watchlist Card | full row | — | row shimmer | handled by List's Empty Layout, not per-card | stale-data list banner (List-level) | last-known shown, banner | — | — | color-flash, Notification Dot appears |
| Funding / Unlock / Recently Added Card | full row | — | row shimmer | Section-level muted Caption replaces rows | Section-level inline retry | last-known shown | — | — | — |
| Market Feed Card | header + 3 rows | — | header static, rows shimmer | rows replaced by muted Caption, header stays | inline retry, rows only | last-known shown | — | — | — |
| Metrics / Tokenomics Card | grid/stacked rows | — | per-cell/row shimmer | card omitted entirely (not "all dashes") | inline retry | last-known shown | — | — | per-cell color-flash |
| Score Breakdown Card | 7 rows | — | 7-row shimmer, staggered | — | inline retry, Sheet stays open | last-known shown | — | — | bars re-animate |
| Bull/Bear Case Card | bullet list | — | line shimmer | omitted if no content generated yet | inline retry | last-known shown | — | — | — |
| Search Result Card | row | — | row shimmer | parent shows "No results" Empty Layout | n/a (search degrades to cached Recent/Trending) | Recent (local) still works; Trending shows stale-data note | — | — | — |
| Notification Card | row | — | row shimmer | empty-notifications illustration | inline retry | last-known shown | — | — | unread dot appears |
| Profile Card | header block | — | avatar/name shimmer | — | generic placeholder identity | cached identity shown | — | — | — |
| Button | label | inline spinner replacing label | — | — | — | — | opacity 40%, no interaction | — | — |
| Search Bar | placeholder/typed | — | — | — | inline "search unavailable" banner | cached Recent works offline | rare (auth-gated) | — | live result filtering |
| Bottom Navigation | 5 tabs | — | — | — | — | all tabs remain tappable; affected Page shows its own offline state | never disabled | — | badge appears/updates |
| Bottom Sheet / Modal | open | — | internal content per its own rules | — | inline retry, overlay stays open | cached content shown if available | — | — | — |
| List / Grid / Carousel (Layout) | populated | — | N skeleton rows/cards | Empty Layout replaces the container | Error Layout or per-item inline retry depending on scope | last-known content shown | — | pull-to-refresh spinner at top | individual children update independently |

---

# 10. Component Tokens

*Every value below references the canonical token defined in `DESIGN_SYSTEM.md` Section 13 — this table maps each component to its specific token assignments, it does not introduce new values.*

| Component | Padding | Margin | Radius | Elevation | Typography | Icon Size | Badge Size | Animation Duration |
|---|---|---|---|---|---|---|---|---|
| Button | 16px horizontal, 0 vertical (height-driven) | screen margin 16px or inline per context | `radius-md` | `elevation-flat` (Text variant) / `elevation-raised` (Primary, light theme only) | `type-button` | `icon-sm` (if icon+label) | — | `duration-quick` |
| Icon Button | 0 (icon centered in 44×44 tap zone) | per host context | — (circular tap zone, no visible chrome by default) | — | — | `icon-md` | — | `duration-quick` |
| Pill / Tag | 12px horizontal, 6px vertical | inline, per host | `radius-pill` (Pill) / `radius-sm` (Tag) | `elevation-flat` | `type-badge` | — | — | `duration-instant` |
| Chip | 12px horizontal | 8px between siblings | `radius-pill` | `elevation-flat` | `type-button` | — | — | `duration-quick` |
| Badge / Notification Dot | — | overlaps host by ~25% | `radius-badge` (Counter) / circular (Dot) | `elevation-popover` | `type-badge` | — | 8px (Dot) / 16px+ (Counter) | `duration-quick` (appear) |
| Card (generic base) | 16px | 16px screen margin, 12–16px sibling gap | `radius-lg` | `elevation-flat` (dark) / `elevation-raised` (light) | varies by content | `icon-sm`/`icon-md` per field | — | `duration-quick` |
| Score Card / Score Circle | 16px (Full variant card) | per host | `radius-xl` (Full card) | `elevation-raised`/`surface-elevated` | `type-score` (numeral), `type-badge` (grade) | — (ring is Progress, not Icon) | — | `duration-standard` (fill animation) |
| Weekly Pick Card | 16px | 12px Carousel gap | `radius-lg` | `elevation-flat`/`raised` | `type-title` (name), `type-numeric` (score), `type-caption` (labels) | `icon-xs` (Risk Indicator) | — | `duration-quick` |
| Project / Fund Card (Mini) | 12px | 12px Carousel gap | `radius-lg` | `elevation-flat`/`raised` | `type-subtitle` (name), `type-numeric` (score/count) | `icon-xs` | — | `duration-quick` |
| Watchlist Card / List Item | 16px horizontal | 0 (Divider-separated) | — (no card radius — list row) | `elevation-flat` | `type-subtitle` (name), `type-numeric` (score/%) | `icon-xs` (trend) | 8px (Notification Dot) | `duration-quick` |
| Market Feed / Funding / Unlock Card | 14–16px | 8px sibling gap | `radius-md`/`radius-lg` | `elevation-flat` | `type-body` (content), `type-caption` (meta) | `icon-sm` (section icon) | — | `duration-quick` |
| Metrics / Tokenomics Card | 16px | 24px section gap | `radius-lg` | `elevation-flat` | `type-caption` (label), `type-numeric` (value) | `icon-xs` (trend) | — | `duration-quick` (color-flash) |
| Score Breakdown Card (Sheet content) | 16px | per Sheet Layout | `radius-sheet` (Sheet container) | `elevation-overlay` (Sheet) | `type-score` (overall), `type-body`/`type-numeric` (sub-scores) | — | — | `duration-standard` (Sheet), staggered 30ms (bars) |
| Search Result Card | 16px horizontal | 0 (list row) | — | `elevation-flat` | `type-subtitle` (name), `type-caption` (ticker/tag) | — | — | `duration-instant` (per-keystroke filter) |
| Bottom Navigation | 0 (icon+label centered per tab) | — | — | `elevation-floating` (glass) | `type-caption` (label) | `icon-md` | 8px (Dot) | `duration-quick` |
| Top App Bar | 16px horizontal | — | — | `elevation-floating` (post-scroll glass) | `type-heading`/`type-title` (title) | `icon-md` (actions) | — | `duration-quick` (collapse) |
| Search Bar | 16px horizontal internal | 16px screen margin | `radius-md` | `elevation-flat` | `type-body` | `icon-sm` | — | `duration-quick` |
| Toast | 16px | 16px from screen edges, floats above nav | `radius-md` | `elevation-overlay` | `type-body` | `icon-sm` (status icon) | — | `duration-quick` (in/out) |
| Modal | 24px | centered, 16px min screen inset | `radius-lg` | `elevation-overlay` | `type-heading`/`type-body` | — | — | `duration-standard` |
| Bottom Sheet | 16px | — | `radius-sheet` | `elevation-overlay` | varies by content | — | — | `duration-standard` |
| Tooltip | 8px | — | `radius-md` | `elevation-popover` | `type-caption` | — | — | `duration-quick` |
| Skeleton Block | — (matches host) | — (matches host) | matches host component's radius | `elevation-flat` | — | — | — | continuous shimmer loop |
| Empty/Error Layout | 40px vertical (`space-8`) | centered | — | — | `type-subtitle`/`type-caption` | `icon-xl` | — | `duration-quick` (entrance fade) |

---

# 11. Information Density Rules

*Strict, numeric limits — not guidelines. Each exists to protect the "calm, scannable" brief against the natural pressure to add "just one more field."*

| Context | Limit | Why |
|---|---|---|
| Market Overview Card | Maximum 5 KPIs (BTC, ETH, BNB, Total Mkt Cap, Fear & Greed) | Five is the most a human can subitize (recognize at a glance without counting) in a single grouped glance — this card is "today's weather," not a dashboard. |
| Weekly Pick Card | Maximum 4 metrics (Score, Funding, TVL, Unlock) | Matches the number of distinct *colors/icons* a card can carry before it stops reading as one coherent unit and starts reading as a form. |
| Project Card (Mini) | Maximum 2 values (Score, Trend) | This card's job is browsing density (many cards visible per scroll), not justification — depth is explicitly deferred to Project Detail. |
| Project Card badges | Maximum 3 badges (e.g. grade Pill + risk Dot + one Tag) | Beyond 3, badges stop being scannable signals and become visual noise competing with the entity's name/logo. |
| Feed Card (Market Feed) actions | Maximum 2 actions (tap row → detail, "See all" → Markets) | More than 2 interactive affordances on one compact card creates tap-target ambiguity at this size. |
| Metrics Card / Tokenomics Card | Maximum 4 values per card | Matches the 2×2 grid's natural capacity — a 5th value would force either a 3rd row (breaking the grid rhythm) or a cramped 5-cell layout. |
| One screen, total visible Cards (excluding List rows) | Maximum 6 before requiring scroll to see the next one | Beyond 6 simultaneously-competing Card-level visual units, a screen stops feeling like "a few curated things" and starts feeling like a dashboard — the exact failure mode this product is designed to avoid (ChainBroker's mistake). |
| Above the fold (first viewport, no scroll) | Maximum 2.5 sections | "2.5" specifically: Search bar + Market Overview Card fully visible, plus the *start* of Weekly Picks (its Section Header and first 1–2 cards) partially visible — this guarantees the hero content is always teased without requiring the entire first section to fit perfectly within one device height. |
| Market Feed, items per section | Exactly 3, never more inline | Matches the "glance, don't browse" purpose of Home's Market Feed — anything beyond 3 belongs in Markets, reached via "See all." |
| Score Breakdown (Sheet) | Exactly 7 sub-scores (explicit exception) | This is the one intentional full-depth view in the product, reached only by deliberate opt-in tap — the density cap doesn't apply here because the user has explicitly asked for depth. |
| Carousel cards visible without scrolling (390px reference) | 1.5–2 full cards + a partial 3rd | The partial next card is the *intentional* affordance signaling "swipe for more" (Rule 44, `DESIGN_SYSTEM.md`) — showing a perfectly-cropped exact number of cards would remove this cue. |
| Search results, default state (Recent/Trending/Popular) | Maximum 3 items per group before "Trending This Week" etc. truncate | Keeps the pre-typing Search screen scannable in a single glance, matching its role as a fast on-ramp, not a directory. |
| Notification Dot vs. Counter Badge | Never both on the same host | One binary signal (seen/unseen) or one count signal — never stacked, to avoid conflicting "how many" vs. "is there one" reads. |

---

# 12. UX Rules

1. **Never show more than one CTA inside a card.** Multiple competing buttons inside one bounded unit forces the user to evaluate priority themselves — the design should have already decided which action matters.
2. **Never use tables on mobile.** Tabular data is restructured as Cards/List Items (`DESIGN_SYSTEM.md` Rule 4) — tables assume column-scanning, which doesn't work on a 390px screen.
3. **Never require horizontal scrolling for anything except a designed Carousel.** Any other horizontal scroll (e.g. an overflowing row of text/buttons) signals a layout that didn't fit, not an intentional pattern.
4. **Every Project Card must be tappable.** A summary unit with no path to depth is a dead end — this product's entire thesis is "glance, then go deeper."
5. **Every Score must have an explanation accessible from the same context it's shown in.** A raw number with no "why" is exactly the ChainBroker mistake this product exists to avoid.
6. **Search must always be reachable within one tap.** Either the Search tab itself or the Home search-bar entry point — never buried in a menu.
7. **Weekly Picks must always remain above the fold.** It's the product's hero section and the direct answer to "what should I look at today" — burying it defeats the product's core purpose.
8. **Watchlist should never be more than one tap away.** It's a persistent bottom-nav tab specifically so re-engagement never requires more than one decision.
9. **Markets should never contain duplicate information already shown on Home.** Home's Market Feed is a 3-item teaser; Markets is the full version — they should feel like zoom levels of the same data, not two separate datasets.
10. **Every list/grid of unbounded length must offer "See all" rather than rendering its full length inline.** Keeps every screen's scroll length predictable and finite.
11. **Funds must never display a Score.** Scores are a Project-only concept; Funds are summarized by portfolio size/quality instead — conflating the two metrics misleads the user about what's being measured.
12. **Category/chain must never be communicated via a dedicated background color.** Reserves color exclusively for the Score/risk/directional semantic system (`DESIGN_SYSTEM.md` Section 5).
13. **Every Empty State (except section-level inline ones) must suggest a next action.** Absence of content is also an opportunity to redirect the user, not just inform them.
14. **Every section-level error must be contained to that section.** One failed data source must never blank an entire screen — see the Market Feed/Markets per-section error pattern throughout Section 5.
15. **Skeletons must exactly match the dimensions of the content they represent.** Any mismatch causes a layout jump the instant real content arrives.
16. **Spinners are reserved for full-page loads and button-submission states only.** Every other loading scenario uses Skeleton.
17. **Toasts must auto-dismiss without requiring a tap.** A confirmation that demands acknowledgment stops being lightweight.
18. **Modals are reserved exclusively for decisions requiring explicit confirm/cancel.** Anything informational belongs in a Toast or Bottom Sheet instead.
19. **Bottom Sheets must never duplicate a primary navigation action already available in Bottom Navigation.** Sheets are for supplementary detail, not parallel navigation paths.
20. **Drill-in navigation always slides from the right; back navigation always mirrors it exactly in reverse.** Predictability of motion is itself a usability feature — the user should never have to relearn what "back" looks like.
21. **Tab switches always cross-fade, never slide.** Slides imply spatial movement between places; tabs are mode-switches, not journeys.
22. **Every icon-only interactive element must carry an accessible text label.** Required for screen-reader support even with no visible label.
23. **Every color-coded meaning must have a non-color-dependent backup signal.** Protects color-blind users and anyone in poor lighting conditions.
24. **No more than one emoji per row or section header, and never inside chrome.** Emoji are content-flavor, not navigational language.
25. **Filled icons indicate active/selected state only.** Outline is always the resting default — this is the one consistent rule that makes "what's currently active" legible at a glance across the whole app.
26. **Logos and avatars are always circular.** A single consistent shape language for "this is an entity" across Projects, Funds, Chains, and the User.
27. **The Score numeral's type style is reserved exclusively for the Score.** No other number — not price, not TVL, not market cap — may use the 36px Score type style.
28. **A Hero-density Card variant (Weekly Pick, Featured Pick) only appears in its designated context** — Weekly Pick Card never appears in a vertical List, Featured Pick Card never appears in a horizontal Carousel.
29. **Funding/unlock investor or allocation detail is always summarized in list/card contexts**, with full detail one tap deeper via an explicit "View all" action.
30. **Search results must never display a Score.** Search is relevance-based retrieval; showing a quality signal here implies pre-ranking by quality, which search doesn't do.
31. **Search must always show Recent + Trending content before the user types anything.** A blank input box with no prompting wastes the user's first few seconds.
32. **Every primary text input auto-focuses only when its screen's sole purpose is that input** (Search) — secondary-screen inputs (e.g. Feedback) do not auto-focus, to avoid surprising the keyboard into view.
33. **Bottom Navigation hides only while a keyboard is focused, or on pre-auth screens.** It must never disappear on any of the 5 primary tabs otherwise.
34. **Pull-to-refresh is available on every primary list/feed screen** (Home, Watchlist, Markets) and must follow native platform gesture physics exactly — no custom easing.
35. **No screen may show two Primary Buttons simultaneously.** Forces a deliberate hierarchy between competing actions.
36. **Destructive actions require either a confirm Modal or an undo-able Toast.** An instant, irreversible single tap with zero feedback is never acceptable.
37. **Section Headers are never tappable as a whole** — only their explicit "See all" sub-element is interactive, preventing accidental navigation from a header tap.
38. **Every horizontally-scrolling Carousel must visually cut off its last visible card at the screen edge.** Signals "more exists" without needing pagination dots.
39. **Dividers are reserved for dense list contexts** — general layout separation always uses whitespace tokens, never a divider line standing in for spacing.
40. **A maximum of 3–4 stat values may appear inline within any single compact card**, per the Section 11 density caps — this rule exists at the UX-rule level too because it's load-bearing for the entire "calm" brief, not just a card-by-card style choice.
41. **Theme (light/dark) must be an equally premium experience in both modes.** Dark is the default, never the *only* fully-realized option.
42. **Haptic feedback fires only for user-initiated state changes**, never for passive/background data updates — a live price tick must never trigger a haptic.
43. **Every number that updates live must animate its change with a brief color-flash**, never an abrupt re-render with no transition.
44. **No new top-level navigation destination is added without first asking whether it replaces an existing tab or belongs one tap deeper.** The 5-tab limit is a hard constraint.
45. **Every new screen reuses an existing Screen Template (Section 7) for its category.** A new "X Detail" screen reuses Project Detail's structure rather than inventing a new header/body/footer arrangement.
46. **Long-form text content is the only context where paragraph text may exceed 3 lines without truncation.** Everywhere else, summarize and defer to a tap-through.
47. **A Project's absence of data (no funding, no metrics) is shown as an explicit, honest "no data" state** — never as zeroed-out or fabricated placeholder values.
48. **Every Card type's loading state is a full-card Skeleton, never a partially-loaded, partially-skeleton hybrid**, except where explicitly specified (Market Overview's macro-row-only error recovery is the one documented exception).
49. **Every Compact variant of a Card removes fields, never just shrinks them.** Compact Project Card isn't "Project Card at 80% size" — it's Project Card with 2 of its fields deliberately omitted.
50. **A Tag is never interactive; a Chip is never purely decorative.** These two primitives must never be used interchangeably even though they look similar.
51. **The Watchlist star/toggle is reachable from every context an entity appears in** (Home cards, Search results — if added later — Markets cards, Detail header) so "watching" something never requires navigating to a dedicated "add" flow.
52. **A Notification Dot's qualifying criteria must be explicitly defined per use** (e.g. "unlock within 7 days AND >1% supply") — never a vague "if something important happened."
53. **Every screen's primary scroll direction is vertical.** Horizontal scroll exists only inside designated Carousels and Filter Chip rows, never as a screen's main navigation axis.
54. **A user must never see a completely blank screen during normal use.** Splash and the brief pre-Skeleton instant are the only acceptable blank moments, and both are bounded to under ~800ms.
55. **Every async action (button submission, refresh) must give feedback within 100ms of the tap**, even if the actual result takes longer — the Loading state itself is the immediate feedback.
56. **A screen's Empty State and Error State must be visually distinguishable from each other** — "you have nothing yet" and "something went wrong" must never share identical copy/iconography.
57. **Every entity reference (project/fund/chain) anywhere in the app routes to the same canonical Detail screen** — there is no "watchlist-flavored" or "search-flavored" variant of Project Detail.
58. **A screen must never block its own render waiting on a non-critical section's data** — Home renders immediately with whatever sections are ready, Skeletons fill the gap for the rest.
59. **Every interactive row/card's tap target spans its full visual bounds**, not just the text/icon within it — a List Item's entire 16px-padded row is tappable, not just its label.
60. **Grade colors (Score A+/A/B/C/D bands) must be used consistently across every Card type that shows a grade** — a "B" grade renders in the identical teal-blue everywhere it appears.
61. **A screen's header title must always reflect exactly where the user is** — never a generic "Detail" label when the entity's actual name is available.
62. **Back navigation must restore the exact prior scroll position**, not reset to the top of the previous screen.
63. **A Carousel's snap behavior (Weekly Picks) vs. free-scroll behavior (Related Projects) must match each Carousel's specified variant exactly** — never apply snap to a low-emphasis row or vice versa.
64. **Every screen-level Pull-to-Refresh must refresh all of that screen's sections, not just the one nearest the top.**
65. **A user's Watchlist additions/removals must persist instantly in the UI** (optimistic update) rather than waiting for a server round-trip before reflecting the change.
66. **Every Bottom Sheet must be dismissible by at least two methods** (drag-down, scrim-tap, or an explicit close icon) — never exactly one fragile dismiss path.
67. **A Tooltip must never require scrolling within itself** — if content doesn't fit in one short sentence, it belongs in a Bottom Sheet instead.
68. **Every Filter Chip's selected state must be visually unambiguous at a glance** — relying on subtle color shifts alone is insufficient; filled background is required.
69. **A screen must never show more than 2 trailing header actions** — additional actions move into an overflow Bottom Sheet.
70. **Project Detail's Hero must always show the entity's category/chain context**, never just its name — context is part of the verdict, not decoration.
71. **Every "Why?" or "See full breakdown" affordance must open supplementary detail without navigating away from the current screen** — these are Bottom Sheet triggers, never full-page navigations.
72. **A live-updating value (price, Score, Fear & Greed) must never visually "jump" without its preceding color-flash/transition**, even on a screen the user has had open for a long session.
73. **Every screen must degrade gracefully when offline**, showing last-known cached data with a clear (but non-alarming) staleness indicator rather than a blank/error screen.
74. **A Segment Tabs control must maintain independent scroll position per segment** (Watchlist's Projects/Funds) so switching back doesn't lose the user's place.
75. **No component in this library may be used in a way contradicting its documented "Anti-patterns" entry in Section 3 or 5** — those entries are binding, not illustrative.
76. **Every new component proposal must be checked against the Component Hierarchy (Section 2) before being added** — if it doesn't clearly belong at Primitive/Widget/Card/Layout level, it isn't ready to be specified yet.

---

# 13. Anti-patterns

*At least 50 mistakes a future developer must avoid. Several are direct lessons from studying ChainBroker and generic crypto-dashboard UI.*

1. Building a sortable, multi-column table for any mobile screen.
2. Showing all 7 Score sub-components inline on a card instead of behind "See full breakdown."
3. Treating Search results like a curated, quality-ranked feed (showing Score there).
4. Adding a 6th Bottom Navigation tab "just this once."
5. Using red/green for anything other than their defined directional/semantic roles.
6. Introducing a second accent color "for variety" on a single promo banner.
7. Square or rounded-square avatars/logos anywhere.
8. Using a spinner for content that has a known shape — always Skeleton instead.
9. A blank Search input with zero Recent/Trending prompting.
10. Showing raw, unformatted large numbers instead of the product's number-formatting convention (e.g. "$1.2B" not "1234567890").
11. A funding history list naming every co-investor with no summarization.
12. Category-color-coding projects by sector or chain.
13. Aggressively animating every single live price tick instead of the subtle, defined color-flash.
14. An infinite, algorithmic "Discover"-style feed on Home, contradicting the finite, curated Weekly Picks thesis.
15. Using underline Tabs as an in-place filter mechanism (that's Segment Control/Chips' job).
16. Using a Modal for a non-critical confirmation like "Added to Watchlist" (that's a Toast).
17. Nesting an interactive Card inside another Card.
18. Putting a Primary Button inside a horizontally-scrolling Carousel card.
19. Hiding Bottom Navigation on a primary tab "to give more space to content."
20. Designing Light theme as a naive color inversion without re-checking elevation/shadow logic.
21. Using emoji inside buttons, nav labels, or any chrome element.
22. Using Progress/Score Gauge to represent an unbounded value.
23. Letting one slow backend call block an entire screen's render.
24. A generic "Error" message with no Retry or recovery action.
25. Adding a long-press or swipe gesture with zero visual affordance hinting it exists.
26. Resetting scroll position to top on every back-navigation instead of restoring it.
27. Using custom, non-native scroll easing "for brand consistency."
28. A Watchlist empty state that's just a bare "No items" label.
29. Giving a Fund Card a Score Circle, Unlock Risk indicator, or any Project-only field.
30. Adding decorative gradients, particle effects, or skeuomorphic textures "to feel premium."
31. Showing Market Metrics before Score/Why-This-Score on Project Detail.
32. Building a separate "TrendingProjectCard" component instead of reusing Project Card in Markets.
33. Creating a one-off layout for a new screen instead of selecting an existing Screen Template.
34. Stacking a Notification Dot and a Counter Badge on the same host element.
35. Using a heavy drop-shadow behind a Token/Fund/Chain Logo that clashes with the asset's own brand colors.
36. Showing a Score on a "Recently Added" entity with insufficient underlying data, implying false confidence.
37. Letting a Bottom Sheet stack on top of another open Bottom Sheet.
38. Using a Tooltip for multi-paragraph content instead of a Bottom Sheet.
39. Disabling an entire Bottom Navigation tab instead of letting its Page show its own offline/error state.
40. Designing a FAB (Floating Action Button) "because other apps have one," with no defined cross-screen action that justifies it.
41. Adding numbered pagination to any mobile list instead of Infinite Scroll.
42. Letting a Carousel's last card sit flush with the viewport edge with no partial-next-card cue.
43. Using a static grey block with no shimmer animation as a "loading" state — reads as broken, not loading.
44. Truncating a Score's grade-color meaning to "just green/red" instead of the full 4-band A+/A–D mapping.
45. Re-deriving spacing values outside the 8pt scale "because it looked better by a couple pixels."
46. Letting a Project Card and a Compact Project Card differ only in size rather than in which fields are shown.
47. Showing Bull Case content without an adjacent, equally-weighted Bear Case.
48. Tinting Bear Case content with alarming `danger` red instead of neutral `warning` framing.
49. Building Profile as a feature-rich dashboard instead of keeping it a quiet, flat settings list.
50. Letting Search auto-suggest Score-sorted "best" results instead of relevance-sorted matches.
51. Applying glass/blur effects to ordinary content Cards instead of reserving that treatment for persistent nav chrome only.
52. Designing a new Card type when an existing Card's "contextual label" pattern (e.g. Trending Card = reused Project/Fund Card) already covers the need.
53. Letting a List's Divider double as the only spacing mechanism between unrelated Sections.

---

# 14. Future-proof Components

Each component below is **reserved** — named and slotted into the existing hierarchy now, populated by real data/screens later, without requiring any existing screen to be redesigned.

### AI Insight Card
- **Fits as:** a Card-level component, structurally identical to Bull Case Card/Bear Case Card (label + bullet list), inserted into Project Detail's "Why This Score" Section as an additional sibling row, or surfaced via the existing "See full breakdown" Bottom Sheet.
- **No redesign required because:** the Why-This-Score section already accepts multiple card-like reasoning blocks; AI Insight Card simply becomes a 3rd peer alongside Bull/Bear Case.

### Portfolio Card
- **Fits as:** reuses Watchlist Card's exact row pattern (logo, name, value, 24h%, trend) with an added cost-basis/P&L field — a Watchlist Card variant, not a new component family.
- **No redesign required because:** Watchlist's Screen Template (Segment Tabs + List) directly accommodates a "Portfolio" segment alongside or instead of "Projects/Funds," reusing the identical Page structure.

### Trading Journal Card
- **Fits as:** a List Item (Feed variant) for entries, Card (Standard) for entry detail — both already-defined primitives — composed via the existing Section Header + List pattern used throughout Markets/Home.
- **No redesign required because:** Journal becomes a new Page using the same template shape as Watchlist (header, optional Segment Tabs by entry type, vertical List), not a new template.

### Academy Lesson Card
- **Fits as:** Card (Standard, `radius-lg`) with a Progress (Linear) bar for completion — reuses Progress exactly as specified for Score Gauge's bounded-0–100 pattern.
- **No redesign required because:** lesson browsing reuses the Section Header + Carousel/List pattern from Markets; lesson detail reuses Project Detail's Hero → content-sections template shape.

### Notification Center Card
- **Fits as:** Notification Card (already fully specified in Section 5) rendered inside a List, presented either as its own Page (reached from the bell icon) or a Bottom Sheet — both are existing Layout components.
- **No redesign required because:** the bell icon and Notification Dot/Badge already exist in the Top App Bar; this only adds a destination for what tapping the bell does.

### Portfolio Performance Card
- **Fits as:** Stat Card grid (reused from Metrics Card's 2×2 pattern) plus a Sparkline (Area variant) for the performance trend — both existing primitives, recomposed.
- **No redesign required because:** it slots into Portfolio's Page (above) as a header block, the same structural role Market Overview Card plays on Home.

### Calendar Event Card
- **Fits as:** Unlock Card's Standard variant, generalized — the same date-leading, entity-name, category-label layout already used for unlock events extends naturally to any dated future event (e.g. a future Academy webinar, a token vesting cliff for a different reason).
- **No redesign required because:** Markets' Unlock Calendar section already establishes "a List of dated Cards" as a pattern; a broader Calendar simply adds more event *types* to that same List, not a new visual treatment.

**General scalability principle (restated from `DESIGN_SYSTEM.md` Section 16, now made concrete at the component level):** every future feature above is satisfied by **new data flowing into existing components**, never a new component invented for new data. If a genuinely new visual pattern seems necessary, the correct process is to extend this document's Sections 3–6 deliberately — never to improvise in implementation.

---

# 15. Final Review

## 10 Strengths
1. Every Card type's "Maximum displayed values" cap is enforced consistently, giving the entire library one coherent density philosophy rather than per-screen ad hoc limits.
2. Score Circle's mandatory ring (even in Compact variant) makes "this is a Score" instantly recognizable everywhere in the app, reinforcing the product's central trust signal.
3. The strict Card-reuse pattern (Trending Card = Project/Fund Card, Related Project Card = Project Card) prevents the component count from inflating as new screens/sections are added.
4. The State Matrix (Section 9) gives engineering a single lookup table instead of having to infer loading/error/empty behavior per component from prose alone.
5. Funds and Projects are kept structurally distinct (no Score on Fund Card) at the component-spec level, preventing a data-modeling mismatch from leaking into the UI.
6. The Motion Specification's per-component table (Section 8) closes the most common implementation gap in design handoffs — "what does this actually *do* on tap" is answered for every component, not just the hero ones.
7. Search Result Card's hard "never show Score" rule is unambiguous and easy to verify in a review — exactly the kind of rule a frontend engineer can self-check against.
8. The Component Hierarchy (Section 2) gives a clear test for "where does this new thing belong" before any new component is proposed.
9. Future-proof Components (Section 14) are specified as *reuses*, not as new visual systems — this materially reduces the risk of the design system fragmenting as the product grows.
10. The 76 UX Rules and 53 Anti-patterns together cover both "what to do" and "what not to do" for nearly every interaction surface, reducing the number of judgment calls left to individual engineers.

## 10 Weaknesses
1. The Card Library (Section 5) is large — 20 card types is a lot for a new engineer to internalize before contributing confidently; no "quick reference" cheat-sheet (e.g. a single summary table of all cards' heights/widths) is provided alongside the full prose specs.
2. Several Future-proof Components (Portfolio, Trading Journal) are described at a conceptual "fits as" level but don't yet have their own field-by-field Required/Optional spec the way current Cards do — they'll need a follow-up pass before real implementation.
3. The Notification Dot's qualifying-criteria rule (Section 12, Rule 52) is stated as a requirement but the actual threshold values (e.g. "7 days," "1% supply," "5 points") live in this document's prose rather than as a single canonical, easily-referenced table.
4. Segment Tabs' "mutually exclusive vs. independently toggleable" ambiguity (Section 6) is explicitly flagged as needing per-usage specification but isn't resolved for the one concrete usage (Watchlist) in this document.
5. The State Matrix (Section 9) is comprehensive but very dense — a 25-row × 9-column table is hard to scan visually in raw Markdown without a rendered table view.
6. No explicit specification exists yet for how Pull-to-Refresh interacts with a screen that has both a sticky Segment Tabs/Filter Chips row *and* a scrollable list beneath it (Watchlist, Markets) — the drag-to-refresh gesture's exact trigger zone isn't pinned down.
7. The Bull Case/Bear Case Card pair currently has no defined data source in this product's existing backend capabilities — they're speculatively specified ahead of any confirmed feature, which carries some risk of needing rework once real requirements arrive.
8. Component Tokens (Section 10) references `DESIGN_SYSTEM.md` tokens by name but doesn't restate their literal values inline, requiring readers to cross-reference two documents constantly.
9. The "exactly 2×2 grid" rule for Metrics/Tokenomics Cards (Section 5/11) doesn't address what happens if a project genuinely has only 2–3 metrics available rather than 4 — a partial-grid behavior isn't specified.
10. Floating Action and Pagination are defined as "reserved-but-unused," which is honest but means two of the requested Section 6 components have no real specification depth — acceptable given current scope, but worth flagging as thin coverage.

## 10 Scalability Improvements
1. Add a single condensed "Card Quick Reference" table (name, height, width, max values, primary use) at the top of Section 5 as a scannable index into the full prose specs.
2. Give each Future-proof Component (Section 14) its own full Required/Optional field list once its backing feature is actually scoped, promoting it from "conceptual fit" to a real Section-5-grade Card spec.
3. Extract all numeric thresholds (Notification Dot criteria, density caps, durations) into one consolidated "Constants" appendix, single source of truth instead of scattered inline values.
4. Resolve the Segment Tabs mutual-exclusivity question for Watchlist explicitly, and establish the default answer ("mutually exclusive unless stated otherwise") as a standing rule for all future Segment Tabs usages.
5. Define a render-tested table format (or move dense matrices like Section 9 into a linked spreadsheet/structured data file alongside this Markdown) once tooling allows, so the State Matrix remains usable as the component count grows.
6. Add explicit Pull-to-Refresh gesture-zone rules for screens with sticky sub-headers (Segment Tabs, Filter Chips) before Watchlist/Markets implementation begins.
7. Treat Bull Case/Bear Case Cards as explicitly "speculative, pending product confirmation" in their own right (a visible status tag in this doc) so frontend engineering doesn't accidentally treat them as committed scope.
8. Inline the literal token values (not just names) into Section 10's Component Tokens table, reducing cross-document lookups during implementation.
9. Specify a defined partial-grid behavior for Metrics/Tokenomics Card when fewer than 4 values are available (e.g. "render available values left-aligned, collapse to a single row if ≤2").
10. As soon as a concrete need for Floating Action arises, immediately promote it from "reserved" to a fully-specified component (placement, motion, exact trigger) rather than letting it remain a placeholder indefinitely.

## Overall Rank: 8/10

The library is comprehensive, internally consistent, and directly traceable to every prior design decision (UX_DESIGN.md's IA, the high-fidelity wireframes, DESIGN_SYSTEM.md's tokens) — a frontend engineer has almost everything needed to build the entire current screen set without inventing components. The two points held back are exactly the weaknesses above: a few specification gaps around edge-case behavior (partial grids, refresh-gesture zones, segment-tab exclusivity) and the sheer density of the document, which will need a quick-reference layer before it's comfortable for day-to-day implementation use rather than just up-front study.

## Recommended final improvements before frontend implementation begins
1. Resolve the three concrete open questions flagged above (Segment Tabs exclusivity for Watchlist, Metrics Card partial-grid behavior, Pull-to-Refresh gesture zones on sticky-subheader screens) — each is small but would otherwise become an implementation-time guess.
2. Produce the "Card Quick Reference" summary table as a lightweight addendum — highest leverage-per-effort improvement for day-to-day engineering use.
3. Confirm with Product which Future-proof Components (Section 14) are realistically next (likely Notification Center, given Notifications is already listed as backend-planned) and give that one component a full Section-5-grade spec before the others, rather than treating all 7 as equally near-term.
4. Do one pass reconciling this document's component names against `UX_DESIGN.md`'s and the wireframe pass's screen descriptions to confirm no naming drift (e.g. ensure "Market Feed" terminology is identical everywhere it's referenced across all four documents).
5. Once implementation begins, treat any deviation discovered in code (a real device constraint, a platform API limitation) as a trigger to update this document first, then the code — never let implementation silently diverge from the spec it's supposed to follow.

