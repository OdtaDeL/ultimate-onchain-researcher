-- =====================================================================
-- Smart Money Discovery Platform — materialized view refresh RPC
-- =====================================================================
-- PostgREST (what @supabase/supabase-js talks to) has no way to issue a
-- raw `REFRESH MATERIALIZED VIEW` statement through the normal table-query
-- interface — it only exposes table/view SELECT/INSERT/UPDATE/DELETE and
-- RPC calls to functions. This function is the RPC the Scoring Sync
-- Pipeline's refresh-materialized-views.ts calls via
-- `supabase.rpc("refresh_materialized_view", { view_name })`.
--
-- Allowlisted to the 4 views the scoring sync pipeline owns — even
-- though `format('%I', ...)` already safely quotes the identifier
-- (preventing SQL injection), the allowlist is defense-in-depth so this
-- RPC can never be used to refresh (or, by typo, attempt to refresh) an
-- arbitrary/unintended relation.
-- =====================================================================

create or replace function public.refresh_materialized_view(view_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if view_name not in ('weekly_rankings_mv', 'monthly_rankings_mv', 'top_projects', 'top_funds') then
    raise exception 'refresh_materialized_view: "%" is not an allowed materialized view', view_name;
  end if;
  execute format('refresh materialized view concurrently %I', view_name);
end;
$$;

comment on function public.refresh_materialized_view(text) is
  'RPC wrapper for REFRESH MATERIALIZED VIEW CONCURRENTLY, allowlisted to the scoring sync pipeline''s 4 views. Called from src/scoring-sync/refresh-materialized-views.ts.';

-- service_role already bypasses grants entirely; no anon/authenticated
-- grant here since this is an internal sync-pipeline operation, not a
-- public-facing capability (consistent with sync_runs' service-role-only
-- posture — see 004_sync_metadata.sql).
revoke all on function public.refresh_materialized_view(text) from public;
grant execute on function public.refresh_materialized_view(text) to service_role;
