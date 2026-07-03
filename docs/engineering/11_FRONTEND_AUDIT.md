# 11 — Frontend Audit

Last updated: 2026-07-01

## Formatter Safety (Confirmed Clean)

All formatters in `src/lib/format.ts` are safe. No NaN/Infinity/null/undefined path reaches the formatter from backend JSON:

- `formatCompactNumber(value: number)` — called only when value `!== null`
- `formatPrice(value: number)` — called only when value `!== null`
- `formatPercentage(value: number)` — called only when value `!== null`
- `formatRelativeDate(date: string | Date)` — input is always a string from ISO date fields

## Component Null Safety (Confirmed Clean)

All components updated in Session 3 to handle nullable fields:

| Component | Fixed Field | Render When Null |
|---|---|---|
| `FundingRoundRow` | `amountUsd: number \| null` | "Undisclosed" |
| `UnlockAlertCard` | `percentOfSupply: number \| null` | "—" |
| `UnlockAlertCard` | `riskLevel?: RiskLevel` | Pill hidden |
| `RecentFundraiseCard` | `amountUsd: number \| null` | "Undisclosed" |

## Page-Level Null Guards (Confirmed Clean)

All nullable fields in `project/[slug]/page.tsx` and `fund/[slug]/page.tsx` are conditionally rendered:

- `project.score !== null && project.grade !== null` → Score Card visible; else `EmptyState`
- `project.category !== null` → Category Pill visible; else omitted
- `project.marketCap !== null` → value visible; else "—"
- All metrics: `fdv`, `tvl`, `changePercent24h`, `circulatingSupply`, `totalSupply`, `athPrice`, `atlPrice`, `volume24h` → "—" when null
- `fund.website`, `fund.twitterHandle` → buttons shown conditionally
- `fund.portfolioSize !== null` → value shown; else "—"

## Known UI Issues

| Issue | File | Severity |
|---|---|---|
| Watchlist page always showed empty | `app/(tabs)/watchlist/page.tsx` | **Critical — Fixed** |
| `console.log` via `logAction()` in production | `app/fund/[slug]/page.tsx` | Medium |
| Fund website/twitter buttons do nothing visible | `app/fund/[slug]/page.tsx` | Medium |
| "Top Chains" section always empty on fund detail | `app/fund/[slug]/page.tsx` | Low |

## TypeScript Status

✅ **0 errors** — confirmed via `npx tsc --noEmit` after all Session 3 changes.

## Non-Null Assertions

| Location | Assertion | Safe? |
|---|---|---|
| `src/lib/api/client.ts:40` | `options.signal!.reason` | Yes — inside `if (options.signal)` block |

No other non-null assertions found in source files.

## TODO / FIXME / HACK Patterns

Found via audit:
- No `TODO` comments with blocking implications
- No `FIXME` comments
- No `HACK` comments
- `console.log` via `logAction()` helper in fund detail page (5 usages)

## Accessibility Gaps

- Star buttons have `aria-label` and `aria-pressed` ✅
- Back buttons have `aria-label` ✅
- Remove buttons on watchlist have `aria-label` ✅
- No skip links for keyboard users (not critical for Telegram Mini App)
- No `role="list"` on watchlist item lists (minor; screen readers rarely used in Telegram)
