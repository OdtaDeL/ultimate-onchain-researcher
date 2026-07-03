# 04 — Database

## Tables

| Table | Key Columns | Notes |
|---|---|---|
| `projects` | `id`, `name`, `logo_url`, `category`, `website` | Core entity |
| `project_metrics` | `project_id`, `market_cap_usd`, `fdv_usd`, `tvl_usd`, `price_usd`, `volume_24h_usd`, `circulating_supply`, `total_supply`, `ath_price`, `atl_price`, `change_24h_pct` | One row per project; nullable |
| `project_scores` | `project_id`, `total_score`, `grade`, `funding_score`, `investor_score`, `market_score`, `tvl_score`, `revenue_score`, `unlock_score`, `momentum_score` | Written by scoring CLI |
| `funds` | `id`, `name`, `logo_url`, `website`, `twitter` | Core entity |
| `investors` | `id`, `name`, `fund_id` | Individual investors |
| `funding_rounds` | `id`, `project_id`, `round_type`, `amount_raised_usd`, `announced_date` | nullable `amount_raised_usd` |
| `funding_investors` | `funding_round_id`, `investor_id` | Join table — no `is_lead` column |
| `token_unlocks` | `project_id`, `unlock_date`, `percent_of_supply`, `description` | nullable `percent_of_supply` |

## Materialized Views

| View | Contents | Refreshed By |
|---|---|---|
| `top_projects` | Projects ranked by score | `sync:scores` |
| `top_funds` | Funds ranked by portfolio size | `sync:scores` |
| `weekly_rankings_mv` | Weekly rank + score change | `sync:scores` |
| `monthly_rankings_mv` | Monthly rank + score change | `sync:scores` |
| `fund_leaderboard` | Funds with investment count | `sync:scores` |

## Schema Gaps

These fields are **not in the schema** and must not be fabricated by the frontend:

| Missing Field | Why It Matters |
|---|---|
| `funding_investors.is_lead` | Cannot determine lead investor; `leadInvestor` prop must be absent |
| `projects.chain` | No blockchain tagging on projects; chain field removed from ProjectData |
| `funds.tier` | No official tier/status for funds |
| `project_scores.risk_level` | No risk threshold in schema; riskLevel not derivable on frontend |
| Fund investment status | No active/exited status on `funding_investors` |

## Supabase Configuration

- Generated types in `src/types/database.types.ts` (run `supabase gen types typescript`)
- RLS policies: anon role has SELECT on all tables
- Service role used only in ingestion CLI (never in web server or frontend)
