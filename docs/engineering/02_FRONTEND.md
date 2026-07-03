# 02 — Frontend

## Pages

| Route | File | Status | Notes |
|---|---|---|---|
| `/` (home) | `app/(tabs)/home/page.tsx` | Working | Rankings, trending, unlocks, recent fundraises |
| `/markets` | `app/(tabs)/markets/page.tsx` | Working | Sortable list of projects/funds |
| `/search` | `app/(tabs)/search/page.tsx` | Working | Text search via Supabase |
| `/watchlist` | `app/(tabs)/watchlist/page.tsx` | **Broken** | Always shows empty; never reads Zustand store |
| `/project/[slug]` | `app/project/[slug]/page.tsx` | Working | Score, funding, unlock, metrics, related |
| `/fund/[slug]` | `app/fund/[slug]/page.tsx` | Working | Portfolio, investments, sectors, insights |

## Tab Layout

- Route group `(tabs)` has a shared layout in `app/(tabs)/layout.tsx`
- Bottom tab bar with 4 items: Home, Markets, Search, Watchlist
- Uses `StickyHeader` + `SafeArea` pattern (not `PageLayout`)

## Shared Layout Components

```
PageLayout        — wraps detail pages; sticky header + scrollable body
StickyHeader      — fixed/sticky top bar
SafeArea          — Telegram-safe insets (top/bottom)
Section           — content section with consistent spacing
SectionHeader     — section label row (title + optional trailing)
```

## UI Primitive Components

```
Card              — surface container; variants: default, compact; pressable
Pill              — inline tag; variants: neutral, accent, green, red, yellow
StatGrid          — 2-column stat display; isLoading shows skeletons
Accordion         — expand/collapse section
Divider           — horizontal separator; full/inset variant
EmptyState        — empty/zero-state; variants: full, section
ErrorState        — error boundary UI; variants: full, inline; onRetry prop
InsightCard       — icon + label + value card (used in fund insights)
ProgressBar       — 0–100 fill bar; fillClassName for color
Skeleton          — animated shimmer; variants: line, circle
```

## Shared Components

```
CoinIcon          — circular logo with fallback initials
NumberFormatter   — compact number (1.2M, 3.4B)
PriceFormatter    — price with smart decimals
Percentage        — colored +/- percentage
ScoreCircle       — circular score gauge with grade letter
```

## Feature Components

```
home/
  WatchlistSummaryCard   — project/fund row for watchlist + home preview
  RecentFundraiseCard    — fundraise event row
  UnlockAlertCard        — upcoming unlock event row
  TrendingSection        — horizontal scroll carousel of mini-cards
  RankingRow             — row in the ranked list table
project-detail/
  FundingRoundRow        — single funding round row
fund-detail/
  InvestmentRow          — portfolio/investment row; list or timeline variant
```

## Component Interface Rules (enforced in Session 3)

- `amountUsd: number | null` — null renders "Undisclosed"
- `percentOfSupply: number | null` — null renders "—"
- `riskLevel?: RiskLevel` — absent when no backend threshold; no default
- `score?: number` and `grade?: Grade` — optional; component does not invent values
- All metric fields nullable: `marketCap | fdv | tvl | changePercent24h | ...` → renders "—"

## Routing

- Detail pages use `useParams<{ slug: string }>()` to extract the slug
- Slug → entity name via `fromSlug()` or direct lookup (currently slug === lowercase name)
- Navigation: `useRouter().push(`/project/${toSlug(name)}`)` from any card/row

## Watchlist Star

- Every detail page header has a `Star` button
- `useIsWatchlisted(kind, id)` checks current state
- `useWatchlistActions().toggle(entity)` adds/removes
- `id` currently equals `name` — see `entityKey(kind, id)` in store
