-- =====================================================================
-- Smart Money Discovery Platform — Leaderboard Optimizations
-- =====================================================================
-- Targets the four MVP surfaces:
--   - Weekly Picks       -> already served by weekly_rankings
--                           (week_start, rank) unique index (001)
--   - New Funded Projects-> already served by funding_rounds
--                           announced_date desc index (001)
--   - Unlock Alerts       -> already served by token_unlock_events
--                           (unlock_date, project_id) index (002)
--   - Top Funds           -> requires aggregating across funds ->
--                           funding_investors -> funding_rounds, which
--                           is too expensive to do per-request. This
--                           migration adds a materialized view for it.
-- =====================================================================

create materialized view public.fund_leaderboard as
select
  f.id                                as fund_id,
  f.name,
  f.logo_url,
  count(distinct fi.funding_round_id) as total_investments,
  count(distinct fr.project_id)       as total_projects,
  coalesce(sum(fr.amount_raised), 0)  as total_amount_raised,
  max(fr.announced_date)              as last_investment_date
from public.funds f
left join public.funding_investors fi on fi.fund_id = f.id
left join public.funding_rounds fr on fr.id = fi.funding_round_id
group by f.id, f.name, f.logo_url;

comment on materialized view public.fund_leaderboard is
  'Precomputed per-fund totals for the Top Funds leaderboard. '
  'Refresh after funding data changes: '
  'refresh materialized view concurrently public.fund_leaderboard;';

-- Required for REFRESH ... CONCURRENTLY (avoids locking readers out
-- during a refresh).
create unique index fund_leaderboard_fund_id_idx on public.fund_leaderboard (fund_id);
create index fund_leaderboard_total_amount_idx on public.fund_leaderboard (total_amount_raised desc);
create index fund_leaderboard_total_projects_idx on public.fund_leaderboard (total_projects desc);
create index fund_leaderboard_last_investment_idx on public.fund_leaderboard (last_investment_date desc);

-- Materialized views don't support RLS policies; grant read access
-- directly to match the public-read posture of every other table.
-- Refreshing requires elevated privileges, so only the table owner /
-- service_role can run REFRESH (no grant needed for that).
grant select on public.fund_leaderboard to anon, authenticated;
