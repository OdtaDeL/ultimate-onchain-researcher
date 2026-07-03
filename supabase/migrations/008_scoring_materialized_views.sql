-- =====================================================================
-- Smart Money Discovery Platform — Scoring materialized views
-- =====================================================================
-- Four read-optimized materialized views derived from project_scores
-- (extended in 007_scoring_engine_extension.sql) and funds/funding_rounds.
--
-- Naming decision (confirmed with the platform owner before writing this
-- migration): weekly_rankings/monthly_rankings (001_initial_schema.sql)
-- already exist as plain INSERT-target tables for a future scoring sync
-- job, and fund_leaderboard (003_leaderboard_optimizations.sql) already
-- ranks funds by raw investment activity. Neither is touched here.
-- weekly_rankings_mv/monthly_rankings_mv are a SEPARATE, SQL-derived
-- cache layer computed directly from project_scores; top_funds is a
-- distinct, scoring-aware fund ranking (by portfolio investor_score, not
-- investment count/amount); top_projects is a new live (non-time-windowed)
-- project leaderboard.
--
-- Refresh: none of these have an automatic refresh trigger — Postgres
-- materialized views never do. A future scoring sync job should run
-- `REFRESH MATERIALIZED VIEW CONCURRENTLY <view>` after writing new
-- project_scores rows. CONCURRENTLY requires a unique index, which each
-- view below has. No RLS on materialized views (Postgres doesn't support
-- it) — SELECT is granted directly, same pattern as fund_leaderboard.
--
-- grade is intentionally absent from every view below — it's a pure,
-- deterministic function of total_score (src/scoring/config.ts
-- gradeFromScore) computed in TypeScript, not duplicated into SQL. See
-- 007_scoring_engine_extension.sql's header for why.
-- =====================================================================

-- ---------------------------------------------------------------------
-- weekly_rankings_mv — latest score per project per ISO week, ranked
-- ---------------------------------------------------------------------

create materialized view public.weekly_rankings_mv as
with latest_per_project_week as (
  select
    project_id,
    date_trunc('week', score_date)::date as week_start,
    total_score,
    row_number() over (
      partition by project_id, date_trunc('week', score_date)
      order by score_date desc
    ) as rn
  from public.project_scores
  where total_score is not null
)
select
  project_id,
  week_start,
  total_score,
  rank() over (partition by week_start order by total_score desc) as rank
from latest_per_project_week
where rn = 1;

comment on materialized view public.weekly_rankings_mv is
  'Per-ISO-week project leaderboard, derived from project_scores. See weekly_rankings (001) for the distinct INSERT-target table this does not replace.';

create unique index weekly_rankings_mv_project_week_idx on public.weekly_rankings_mv (project_id, week_start);
create index weekly_rankings_mv_week_rank_idx on public.weekly_rankings_mv (week_start, rank);
grant select on public.weekly_rankings_mv to anon, authenticated;

-- ---------------------------------------------------------------------
-- monthly_rankings_mv — same shape, calendar-month grain
-- ---------------------------------------------------------------------

create materialized view public.monthly_rankings_mv as
with latest_per_project_month as (
  select
    project_id,
    date_trunc('month', score_date)::date as month_start,
    total_score,
    row_number() over (
      partition by project_id, date_trunc('month', score_date)
      order by score_date desc
    ) as rn
  from public.project_scores
  where total_score is not null
)
select
  project_id,
  month_start,
  total_score,
  rank() over (partition by month_start order by total_score desc) as rank
from latest_per_project_month
where rn = 1;

comment on materialized view public.monthly_rankings_mv is
  'Per-calendar-month project leaderboard, derived from project_scores. See monthly_rankings (001) for the distinct INSERT-target table this does not replace.';

create unique index monthly_rankings_mv_project_month_idx on public.monthly_rankings_mv (project_id, month_start);
create index monthly_rankings_mv_month_rank_idx on public.monthly_rankings_mv (month_start, rank);
grant select on public.monthly_rankings_mv to anon, authenticated;

-- ---------------------------------------------------------------------
-- top_funds — funds ranked by the average investor_score of their
-- portfolio's projects (distinct from fund_leaderboard's investment-
-- activity ranking — see 003_leaderboard_optimizations.sql)
-- ---------------------------------------------------------------------

create materialized view public.top_funds as
with latest_scores as (
  select distinct on (project_id) project_id, investor_score
  from public.project_scores
  where investor_score is not null
  order by project_id, score_date desc
),
fund_projects as (
  select distinct fi.fund_id, fr.project_id
  from public.funding_investors fi
  join public.funding_rounds fr on fr.id = fi.funding_round_id
)
select
  f.id as fund_id,
  f.name,
  f.logo_url,
  count(distinct fp.project_id) as portfolio_project_count,
  avg(ls.investor_score) as avg_investor_score,
  rank() over (order by avg(ls.investor_score) desc) as rank
from public.funds f
join fund_projects fp on fp.fund_id = f.id
join latest_scores ls on ls.project_id = fp.project_id
group by f.id, f.name, f.logo_url;

comment on materialized view public.top_funds is
  'Funds ranked by the average investor_score (src/scoring/investor-score.ts) of their portfolio projects. See fund_leaderboard (003) for raw investment-activity ranking instead.';

create unique index top_funds_fund_id_idx on public.top_funds (fund_id);
create index top_funds_rank_idx on public.top_funds (rank);
grant select on public.top_funds to anon, authenticated;

-- ---------------------------------------------------------------------
-- top_projects — live (non-time-windowed) project leaderboard with the
-- full score breakdown, for a current-state "best projects right now" view
-- ---------------------------------------------------------------------

create materialized view public.top_projects as
with latest_scores as (
  select distinct on (project_id)
    project_id, total_score, funding_score, investor_score, market_score,
    tvl_score, revenue_score, unlock_score, momentum_score, score_date
  from public.project_scores
  where total_score is not null
  order by project_id, score_date desc
)
select
  p.id as project_id,
  p.slug,
  p.name,
  ls.total_score,
  ls.funding_score,
  ls.investor_score,
  ls.market_score,
  ls.tvl_score,
  ls.revenue_score,
  ls.unlock_score,
  ls.momentum_score,
  ls.score_date,
  rank() over (order by ls.total_score desc) as rank
from public.projects p
join latest_scores ls on ls.project_id = p.id;

comment on materialized view public.top_projects is
  'Live project leaderboard (most recent project_scores row per project, any date), with the full score breakdown.';

create unique index top_projects_project_id_idx on public.top_projects (project_id);
create index top_projects_rank_idx on public.top_projects (rank);
grant select on public.top_projects to anon, authenticated;
