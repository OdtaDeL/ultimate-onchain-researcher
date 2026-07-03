-- =====================================================================
-- Smart Money Discovery Platform — add fund_leaderboard to the
-- refresh_materialized_view RPC allowlist
-- =====================================================================
-- fund_leaderboard (003_leaderboard_optimizations.sql) was never included
-- in the refresh RPC created in 009_scoring_refresh_function.sql, so the
-- scoring sync pipeline could not refresh it after funding data changed.
-- This migration extends the allowlist and is the database-side half of
-- the fix; the TypeScript side is src/scoring-sync/types.ts
-- MATERIALIZED_VIEW_NAMES.
--
-- fund_leaderboard already has a unique index (fund_leaderboard_fund_id_idx
-- from 003) so REFRESH CONCURRENTLY works without additional DDL.
-- =====================================================================

create or replace function public.refresh_materialized_view(view_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if view_name not in (
    'weekly_rankings_mv',
    'monthly_rankings_mv',
    'top_projects',
    'top_funds',
    'fund_leaderboard'
  ) then
    raise exception 'refresh_materialized_view: "%" is not an allowed materialized view', view_name;
  end if;
  execute format('refresh materialized view concurrently %I', view_name);
end;
$$;

comment on function public.refresh_materialized_view(text) is
  'RPC wrapper for REFRESH MATERIALIZED VIEW CONCURRENTLY, allowlisted to the scoring sync pipeline''s 5 views (weekly_rankings_mv, monthly_rankings_mv, top_projects, top_funds, fund_leaderboard). Called from src/scoring-sync/refresh-materialized-views.ts.';
