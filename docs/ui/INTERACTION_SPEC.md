# Interaction Specification
**Product:** Ultimate Onchain Researcher — Telegram Mini App
**Document type:** High-fidelity UX Specification
**Status:** Design only. No implementation.
**References:** DESIGN_SYSTEM.md Section 10, COMPONENT_SPEC.md Section 8, HOME_SCREEN_SPEC.md, NAVIGATION_SPEC.md

---

## 1. Scrolling

### 1.1 Main Scroll (Home vertical scroll)

**Type:** Single vertical scroll container. The entire body of the Home screen (below the sticky header) is one scroll region. There are NO nested scroll containers sharing the same axis.

**Physics:** Always native platform momentum + bounce. Never override with custom easing. This is the one place where "platform default beats custom spec" — any custom scroll physics implementation will feel broken to both iOS and Android users (DESIGN_SYSTEM Anti-pattern 27).

**Scroll direction conflict prevention:** The Home screen has horizontal carousels embedded inside a vertical scroll container. This is the standard React Native / WebView scroll conflict pattern. The correct resolution:

- Horizontal carousels begin responding to horizontal gesture if the initial gesture angle is within ±30° of horizontal
- Vertical scroll captures the gesture if the initial angle is within ±60° of vertical
- Diagonal gestures favor vertical scroll (the primary axis)
- Once a carousel begins scrolling horizontally, the vertical scroll is locked for that gesture's duration — preventing diagonal drift
- This is native behavior on iOS and Android WebViews when implemented correctly — do not fight it

**Overscroll:** Standard platform overscroll behavior (rubber-band on iOS, glow on Android). Pull-to-refresh activates during overscroll — see Section 6.

**Scroll position restoration:** When navigating away from Home and returning via back or tab switch, the scroll position is restored exactly. The scroll position is saved on unmount and restored on mount.

### 1.2 Horizontal Carousels (Weekly Picks, Trending, etc.)

**Type:** Independent horizontal scroll within the vertical page

**Weekly Picks (snap scroll):**
- Cards snap to alignment on scroll release
- Snap point: left edge of each card, accounting for the 16px left margin
- Scroll physics: native momentum + snap with spring release
- Overscroll: no bounce past the last card — the carousel ends cleanly
- Partially-visible next card: always cut off at the right edge of the screen to signal "more exists." The cut-off amount is 20–24px of the next card visible

**Trending Carousels (free scroll):**
- No snap — continuous momentum scroll
- Same overscroll behavior as above
- Partially-visible next card: same 20–24px peek

**Scroll indicators:** No scrollbar indicators, no pagination dots. The partially-visible card is the only affordance needed. Adding dots creates visual clutter (DESIGN_SYSTEM Rule 44 — no pagination dots on carousels).

---

## 2. Sticky Elements

### 2.1 Header Collapse Transition

**Trigger:** Home body scroll reaches 60px of scroll offset

**Transition sequence (over 60px of scroll, 60–120px scroll offset):**
1. Header height: 56px → 44px (linear, tracks scroll position 1:1, not time-based)
2. Greeting text opacity: 1.0 → 0.0 (fades out as height decreases)
3. Search icon appears: opacity 0.0 → 1.0 (fades in simultaneously)
4. Glass blur activates: begins at 60px scroll offset, full blur by 120px

**Why tracking scroll position directly (not time-based):** Scroll-linked transitions feel physically real — the element responds to the user's finger position, not a timer. Time-based transitions on scroll feel disconnected from the gesture.

**Reverse (scrolling back to top):** The transition reverses exactly as the scroll offset decreases back through 60–0px. The header "springs open" as the user scrolls back to the top.

### 2.2 Bottom Navigation Visibility

**Conditions for hiding:**
- ONLY when a keyboard is focused (Search screen text input active)
- Hides via: slide-down 150ms ease-in + fade 150ms simultaneously

**Conditions for reappearing:**
- Keyboard is dismissed (any method: tap outside, done button, back)
- Reappears via: slide-up 150ms ease-out + fade 150ms simultaneously

**Performance note:** The bottom navigation must use `position: fixed` (or native equivalent) with its own repaint layer, isolated from the scroll container. This prevents scroll jank from triggering nav repaints.

---

## 3. Motion

### 3.1 Duration and Curve Reference

All durations and curves must use the vocabulary from DESIGN_SYSTEM Section 10. Summary for quick reference:

| Token | Duration | Curve | Use case |
|---|---|---|---|
| `duration-instant` | 0–50ms | n/a | Text swaps, badge count updates |
| `duration-quick` | 150–200ms | ease-out | Button press, tab switch, card press, chip select, skeleton fade |
| `duration-standard` | 250–300ms | ease-in-out | Screen transitions (drill-in/back), bottom sheet, modal |
| `duration-deliberate` | 350–450ms | ease-out | Splash exit, score reveal (reserved for ceremony) |

### 3.2 Page Transitions

**Tab switch (Home ↔ Search ↔ Watchlist ↔ Markets ↔ Profile):**
- Animation: cross-fade at `duration-quick` (200ms), ease-in-out
- No slide — tabs feel like switching channels, not traveling through space
- The active nav icon switches INSTANTLY on tap (does not wait for the transition)

**Drill-in (any card → Project/Fund Detail):**
- Animation: new screen slides in from the right, `duration-standard` (280ms), ease-out
- The source screen stays in place (does not move left — only the incoming screen moves)
- Hero content on the Detail screen: fades in 100ms after the slide begins (staggered entry — container arrives first, content fills in)

**Back navigation (Detail → previous screen):**
- Animation: current screen slides out to the right, `duration-standard` (280ms), ease-in
- Exact mirror of the drill-in — same speed, same distance, reversed direction
- Previous screen is revealed underneath (does not "slide in from left" — it was already there, stationary)

**"See all" sub-screen:**
- Same drill-in/back as Project Detail

### 3.3 Card Press Feedback

All tappable cards (Weekly Pick, Project, Fund, Watchlist, etc.):
- Press: scale 0.97, opacity 0.95, 100ms ease-out
- Release (leading to navigation): springs back to 1.0 as navigation begins — the card "bounces" the user into the next screen
- Release (cancelled — finger dragged off card): springs back to 1.0 immediately, 150ms ease-out

Non-navigating tappable elements (buttons, chips):
- Press: scale 0.97, opacity 0.90, 100ms ease-out
- Release: springs back to 1.0, 150ms ease-out (no navigation)

### 3.4 Icon Button Feedback

Bell icon, back button, search icon, watchlist star:
- Press: background tint (10% accent opacity on a 44×44 circular region), 100ms ease-out
- Release: tint fades, 150ms ease-out

**Watchlist star (special):**
- On toggle to "added": icon switches from outline to filled, scale-bounce 1.0 → 1.3 → 1.0, 150ms total, ease-out (the bounce reaches 1.3 at 75ms, returns to 1.0 at 150ms)
- On toggle to "removed": icon switches filled → outline, scale-dip 1.0 → 0.9 → 1.0, 100ms total (a smaller, "releasing" feel)
- Accompanies a Toast (see Section 9) in both cases

### 3.5 Live Value Updates (prices, scores)

When a displayed value changes due to a data refresh (not user action):
- The value text briefly flashes with `color-bullish` (if value increased) or `color-bearish` (if decreased)
- Flash: value color transitions from `neutral-text-primary` → semantic color → back to `neutral-text-primary`, 200ms total, ease-out for the to-color leg, ease-in for the back leg
- Haptic feedback is NEVER triggered for passive value updates (DESIGN_SYSTEM Rule 48)
- Trend Arrow direction updates INSTANTLY (no animation on direction change — the arrow already has color to communicate direction)

### 3.6 Score Gauge Reveal

On first render of a Score Circle (Project Detail load, Weekly Pick Card reveal):
- Ring fill animates from 0 → score value, `duration-standard` (300ms), ease-out
- Numeral cross-fades in simultaneously: opacity 0 → 1, 200ms
- Grade Pill appears at the same time as the numeral (not before, not after)

On score change (weekly update, while viewing):
- Ring re-animates from old value → new value, 300ms ease-in-out
- Numeral cross-fades old → new, 200ms ease-in-out

### 3.7 Bottom Sheet Motion

**Opening:**
1. Scrim fades in: opacity 0 → `opacity-scrim` (60%), 250ms ease-out
2. Sheet slides up from bottom edge: translateY(100%) → translateY(0), 300ms ease-out (slightly longer than scrim — sheet "arrives" as scrim is already present)

**Closing (tap scrim or drag down):**
1. Sheet slides down: translateY(0) → translateY(100%), 250ms ease-in
2. Scrim fades out: opacity `opacity-scrim` → 0, 250ms ease-in (simultaneous with sheet)

**Drag-to-dismiss:**
- Sheet follows finger 1:1 during downward drag
- Release above 30% drag threshold: sheet snaps back to full-open position, 150ms ease-out (spring)
- Release below 30% (or flick downward with velocity): sheet dismisses, 200ms ease-in

### 3.8 Skeleton Shimmer

**The shimmer animation:**
- A gradient sweep (left-to-right) animating on a loop
- Gradient: `neutral-surface` base → `neutral-surface-elevated` highlight → `neutral-surface` base
- Duration: 1,200ms per loop, linear
- Skeleton and real content occupy the IDENTICAL bounding box throughout — zero layout shift on resolve

**Skeleton → real content transition:**
- Cross-fade: skeleton opacity 1 → 0, real content opacity 0 → 1, 200ms ease-in-out
- They overlap for the full 200ms — neither "disappears before the other appears"

---

## 4. Transitions

### 4.1 Screen-to-Screen Transition Matrix

| From | To | Transition |
|---|---|---|
| Home | Project Detail | Drill-in (slide right, 280ms) |
| Home | Fund Detail | Drill-in (slide right, 280ms) |
| Home | "All Picks" sub-screen | Drill-in (slide right, 280ms) |
| Home | Search tab | Cross-fade (200ms) |
| Home | Watchlist tab | Cross-fade (200ms) |
| Home | Any "See all" sub-screen | Drill-in (slide right, 280ms) |
| Any tab | Any other tab | Cross-fade (200ms) |
| Any Level 2 screen | Its parent | Back slide (280ms) |
| Project Detail | Fund Detail (via investor tap) | Drill-in (slide right, 280ms) |

### 4.2 Overlay Transitions

| Overlay | In | Out |
|---|---|---|
| Bottom Sheet | Slide up 300ms + scrim fade 250ms | Slide down 250ms + scrim fade 250ms |
| Modal | Scale 0.95→1.0 + fade in, 250ms | Scale 1.0→0.95 + fade out, 200ms |
| Toast | Slide up + fade in, 200ms ease-out | Fade out, 150ms ease-in (at 2.5s hold) |
| Tooltip | Fade in + subtle scale 0.9→1.0, 150ms | Fade out, 100ms (on tap outside or 4s auto-dismiss) |

---

## 5. Loading and Skeletons

### 5.1 Priority Loading

When Home first loads, sections appear in this order (independent, parallel fetches — first to resolve shows first):
1. Header and Search Bar render immediately (static, no data)
2. Bottom Navigation renders immediately
3. Market Overview Card: skeleton → data (typically fastest)
4. Weekly Picks skeleton structure (220×180px cards) appears immediately; data resolves when ready
5. Trending sections: skeleton structures appear; data resolves independently
6. Watchlist Summary: skeleton structure if user is known to have items; otherwise hidden
7. Top Gainers, Market Feed Cards: skeleton → data (lower priority)

**Never block a fast section on a slow section.** A user should see Weekly Picks data even if Top Gainers is still loading.

### 5.2 Skeleton Specifications

Every skeleton must match the EXACT dimensions of the real content it replaces:

| Component | Skeleton type | Dimensions |
|---|---|---|
| Market Overview Card | Single Block shimmer | 168px height, full width |
| Weekly Pick Card | Block shimmer | 220×180px |
| Project Card (Trending) | Block shimmer | 140×120px |
| Fund Card (Trending) | Block shimmer | 140×120px |
| Platform mini-card | Block shimmer | 120×80px |
| Watchlist Summary row | Line shimmers (3 lines per row) | 64px height per row |
| Top Gainers row | Line shimmer (1 line per row) | 56px height |
| Market Feed Card | Header static + 3 Line shimmers | Header 34px + 3×44px rows |
| Score Circle (Full) | Circle shimmer | 88px diameter ring |
| Score Circle (Compact) | Circle shimmer | 40px diameter ring |
| Token/Fund Logo | Circle shimmer | 28/32/56px diameter |

**Never use a generic grey rectangle as a skeleton.** Every skeleton must have the exact width, height, and border radius of its real content.

### 5.3 Spinner Usage

Spinners are used ONLY in two contexts:
1. **Splash screen:** Full-page spinner while auth resolves
2. **Button loading state:** Label replaced by 20–24px spinner (same button dimensions) during async action

Every other loading scenario uses Skeletons. A spinner where a Skeleton is possible reads as "this app doesn't know what it's loading" (DESIGN_SYSTEM Anti-pattern 8).

---

## 6. Pull to Refresh

### 6.1 Behavior

**Activated on:** Home (primary), Watchlist, Markets

**Trigger:**
1. User pulls down past the top of the scroll position (overscroll)
2. Elastic resistance increases as pull distance increases
3. At 80px of pull: visual indicator appears (native-style spinner or the product's refresh indicator)
4. At 80px: light haptic feedback fires (single light impact, confirms the threshold was reached)
5. User releases: Medium haptic fires on release. All sections simultaneously enter Skeleton state and re-fetch

**Physics:** Must use native platform pull-to-refresh gesture physics exactly — elastic drag on iOS (rubber band), standard Android overscroll. Never implement custom pull physics (DESIGN_SYSTEM Rule in Section 10).

**Progress indicator:** During active refresh, a subtle activity indicator appears below the header (standard platform style). It dismisses when all sections have resolved.

### 6.2 Partial vs Full Refresh

**Home pull-to-refresh is a full refresh** — all sections simultaneously update. This is intentional. Partial refresh (individual section) creates "stale data next to fresh data" confusion. The visual cost of re-showing all skeletons for 500ms is lower than the cognitive cost of wondering which sections are current and which aren't.

**Individual section error states** can be retried independently (the inline retry button within the failed section's Error State). This is not "partial refresh" — it's targeted recovery, not time-based polling.

---

## 7. Haptic Feedback

Haptic feedback is ONLY fired for user-initiated state changes. Never for passive events.

| Action | Haptic type | Notes |
|---|---|---|
| Bottom nav tab tap | Light impact | On tap, before transition completes |
| Watchlist add (star toggle to filled) | Medium impact | Confirms "added" |
| Watchlist remove (star toggle to outline) | Medium impact | Confirms "removed" |
| Pull-to-refresh threshold reached (80px) | Light impact | Threshold confirmation |
| Pull-to-refresh release | Medium impact | Confirms refresh initiated |
| Segment Control / Chip selection change | Selection haptic | Confirms filter change |
| Destructive confirm (Modal "confirm" button) | Medium impact | Confirms irreversible action |
| **Live price update** | NONE | Passive event — no haptic |
| **Score update** | NONE | Passive event — no haptic |
| **Notification badge appearing** | NONE | Passive event — no haptic |
| **Error state appearing** | NONE | Passive event — no haptic |

**Frequency limit:** Haptics should never feel like a machine gun. If multiple state changes fire within 200ms of each other, only the first haptic fires. Subsequent ones within the 200ms window are dropped.

**Platform note:** Telegram Mini Apps run in WebViews. Haptic feedback requires the Telegram WebApp API (`Telegram.WebApp.HapticFeedback`) — not the native Vibration API (too coarse) and not the Web Vibration API (inconsistent). Implementation must use the Telegram API.

---

## 8. Empty States

### 8.1 Full Empty States (section-level)

| Section | Empty condition | Empty state treatment |
|---|---|---|
| Weekly Picks | No picks published this week | Section Header stays. Content area: muted Caption "Picks refresh every Monday. Check back soon." No CTA — there's nothing actionable. |
| Watchlist Summary (Home) | User has no watchlist items | Section is entirely hidden — not shown with an empty state message. The absence is intentional and clean. |
| Top Gainers | No significant gainers (rare) | Section Header stays. One muted Caption line: "No significant gainers today." |
| Recent Fundraises | No fundraises this week | Section Header stays. One muted Caption line in the feed card: "No new fundraises this week." |
| Recently Added | No new additions | One muted Caption line: "No new additions this week." |
| Unlock Alerts | No upcoming unlocks in 14 days | One muted Caption line: "No unlocks in the next 14 days." |
| Trending Projects | No trending data available | One muted Caption line: "Trending data unavailable." Feed card stays visible. |

**Section-level empty states are a single muted Caption line only.** No illustration, no large headline, no CTA. They are informational minimums — the section header tells the user what they're looking at; the Caption tells them why it's empty. No more is needed.

### 8.2 Full-Page Empty State (Watchlist tab)

When the user has no watchlist items on the Watchlist tab (not the Home summary — this is the full tab):

```
                    ☆
             Your watchlist is empty

     Add projects you're tracking to see
     live updates and alerts here.

        ┌─────────────────────────┐
        │    Browse Weekly Picks  │
        └─────────────────────────┘
```

- Icon: `icon-xl` star outline (64px), centered
- Headline: "Your watchlist is empty" — `type-subtitle`, centered, `neutral-text-primary`
- Body: 2-line helper text — `type-body`, centered, `neutral-text-secondary`
- CTA: Primary button "Browse Weekly Picks" — navigates to Home and scrolls to Weekly Picks section

**Why this CTA?** The user's most likely next action from an empty Watchlist is to discover what to watch. Weekly Picks is the curated starting point. The CTA bridges the empty state to the product's core value.

---

## 9. Error States

### 9.1 Section-Level Error States

When one section's data fetch fails but the rest of the screen loads:

```
┌──────────────────────────────────────────────┐
│  Couldn't load • [↻ Retry]                  │  44px row
└──────────────────────────────────────────────┘
```

- "Couldn't load" in `type-caption`, `neutral-text-secondary`
- Retry icon-button (24px, 44×44 tap zone) immediately adjacent
- Row occupies the space where the section's content would appear (prevents layout jump)
- Tapping retry: button enters Loading state (spinner, 100ms), then either resolves or shows error again
- NEVER let one section's error blank the entire screen or displace other sections

### 9.2 Full-Page Error State

Only triggers when the ENTIRE page fails to load (no data at all, full connectivity failure):

```
                  ⚠

           Couldn't load data

     Check your connection and try again.

           ┌────────────────┐
           │     Retry      │
           └────────────────┘
```

- Icon: `icon-xl` warning/cloud-offline (64px)
- Headline: `type-subtitle`
- Body: `type-body`, `neutral-text-secondary`
- CTA: Primary button "Retry"
- Header and Bottom Navigation remain visible — the user can still navigate

### 9.3 Error Animation

- Text and icon: fade in at `duration-quick` (200ms)
- Optional single horizontal shake (±4px, 150ms) on the failed component — ONLY for form validation errors, NOT for data load failures. A page-level "couldn't load" error never shakes.

---

## 10. Offline Behavior

### 10.1 Detection

Offline state is detected via the browser's `navigator.onLine` API (or WebView equivalent) and network request failures. The app does not pre-flight connectivity — it discovers offline state when a fetch fails.

### 10.2 Offline Behavior Per Section

| Section | Online → Offline transition | Offline state |
|---|---|---|
| Market Overview Card | Values muted (neutral-text-secondary), thin warning tint below header | Shows last known values, muted |
| Weekly Picks | Last known picks remain fully visible | No change in visual (fresh or cached data is indistinguishable) |
| Trending sections | Last known data visible | No change in visual |
| Watchlist Summary | Last known data visible | No warning on Home summary |
| Top Gainers | Last known data visible | No warning |
| Market Feed Cards | Last known data visible | No warning |

**Warning indicator:** A 1px `color-warning` hairline tint appears below the sticky header when the app detects offline state. This is the only full-page offline indicator — subtle, non-disruptive. No banner, no modal, no toast interrupting the user.

**On reconnection:** All sections silently re-fetch in the background. Successful updates fire the color-flash animation on changed values (per Section 3.5). The warning hairline disappears.

### 10.3 Search Offline Behavior

- Recent Searches: fully functional (stored locally)
- Trending/Popular sections: show last-cached data with a single muted Caption note: "Showing saved data"
- Typed results: Show cached results if available. If no cache: show Empty State with a note: "Search unavailable offline — recent searches still work."

### 10.4 Pull-to-Refresh While Offline

User can still initiate pull-to-refresh gesture. On release: all sections attempt to re-fetch. Failures show their inline Error States with retry buttons. A Toast appears: "No connection — couldn't refresh" (Info variant, auto-dismisses in 2.5s).

---

## 11. Accessibility Motion

Per DESIGN_SYSTEM Section 12, every animation must have a reduced-motion equivalent when the platform's "reduce motion" setting is active.

| Normal animation | Reduced-motion equivalent |
|---|---|
| Drill-in slide (280ms) | Instant cross-fade |
| Back navigation slide (280ms) | Instant cross-fade |
| Bottom Sheet slide-up (300ms) | Quick cross-fade (200ms) |
| Score Gauge fill animation | Instant jump to final value |
| Skeleton shimmer (continuous) | Static neutral fill (no animation) |
| Card press scale-bounce | None (tap still registers, no visual animation) |
| Watchlist star bounce | Instant icon swap (outline → filled, no bounce) |
| Live value color-flash | None (value updates silently) |
| Staggered list entrance | All items appear simultaneously (no stagger) |
| Toast slide-up entrance | Fade-in only (no slide) |
| Header collapse (scroll-linked) | Instant state change at 60px threshold (no gradual transition) |

**Implementation:** Query `prefers-reduced-motion: reduce` media query at the app level. Store as a context value. Every animated component reads this context and conditionally applies its reduced-motion equivalent.

**Pull-to-refresh elastic drag:** This remains interactive in reduced-motion mode — it is a direct-manipulation gesture that tracks the user's finger, not decorative animation. Only the release animation shortens to Quick (150ms) instead of Standard (300ms).
