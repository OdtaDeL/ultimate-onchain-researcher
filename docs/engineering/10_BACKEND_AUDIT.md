# 10 — Backend Audit

## Schema Gaps (No Fix Available Without DB Migration)

| Gap | Impact | Resolution |
|---|---|---|
| `funding_investors.is_lead` missing | Cannot show lead investor on funding rounds | Add column + ingest; until then, all investors shown equally |
| `projects.chain` missing | Cannot show blockchain on project hero | Must not fabricate; field removed from `ProjectData` |
| `funds.tier` missing | Cannot show fund tier | Must not fabricate; no tier field anywhere |
| No active/exited status on portfolio items | Cannot derive `activeInvestments` count | Must not fabricate; field removed from `FundData` |
| `project_scores.risk_level` missing | Cannot show risk label on unlock card | Must not fabricate; `riskLevel` removed from `UnlockAlertCard` on detail page |

## DTO Mapping Issues (Fixed)

These were fabricating values before Session 3 — all resolved:

| Source | Was | Now |
|---|---|---|
| `project.ts` — `score` | `?? 0` | `?? null` |
| `project.ts` — `grade` | `?? "D"` | `?? null` |
| `project.ts` — `marketCap` | `?? 0` | `?? null` |
| `project.ts` — `chain` | `"Unknown"` invented | Field removed |
| `project.ts` — `leadInvestor` | First investor assigned as lead | `leadInvestor` prop removed |
| `fund.ts` — `activityStatus` | `"Active"` invented | Field removed |
| `fund.ts` — `activeInvestments` | `portfolio.length` (wrong concept) | Field removed |
| `fund.ts` — `leadInvestments` | `0` invented | Field removed |
| `home.ts` — `amountRaisedUsd` | `?? 0` | `null` propagates |

## API Handler Issues

| Issue | Severity |
|---|---|
| No rate limiting on any endpoint | Medium |
| No authentication on any endpoint | Low (data is public) |
| No request validation (zod, etc.) on query params | Low |
| `topChains` always returns `[]` (no chain data in schema) | Low — renders empty section |

## Performance

- Materialized views used for rankings — good
- No caching at the API layer (all caching is client-side via React Query)
- No pagination cursor (offset-based, which degrades at high page numbers)
- `fund_leaderboard` view not indexed — may be slow at scale

## Dead Code / Unreachable

- `recentInvestmentCount` concept appears in fund insights but the DB has no such column — computed from portfolio rows instead (acceptable approximation)
