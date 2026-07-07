-- =====================================================================
-- Smart Money Discovery Platform — research-pillar scoring cache
-- =====================================================================
-- Adaptive scoring rewrite (src/scoring/signal.ts, src/scoring/pillars/):
-- component scores no longer default missing/inapplicable inputs to 0 —
-- a signal whose only relevant inputs are absent now has
-- state: "missing"/"not_applicable"/"not_implemented" and a null
-- normalizedScore (excluded from the weighted average, never fabricated
-- as a low number). The engine's real output is now organized around 6
-- research pillars (VC & Market Makers, Business Model, Tokenomics,
-- Chart, Team, Community — src/scoring/types.ts PillarKey), each backed
-- by one or more Signals.
--
-- pillar_breakdown is a DETERMINISTIC CACHE / AUDIT SNAPSHOT / RENDERING
-- OPTIMIZATION ONLY -- NOT canonical. Signals (recomputed on every sync
-- from project_metrics/funding_rounds/token_unlock_events/project_aliases
-- via src/scoring-sync/signal-source.ts) are the sole source of truth.
-- This column stores ScoreEngineResult.pillars (src/scoring/types.ts)
-- purely so reads (API/UI) don't need to recompute on every request. It
-- is NEVER read back as an input to future scoring -- every sync run
-- recomputes pillars fresh from signals (see
-- src/scoring-sync/upsert-service.ts's file header). If this column is
-- dropped or goes stale, zero information is lost: it is fully
-- reconstructable by rerunning the sync.
--
-- The 7 flat *_score columns (007_scoring_engine_extension.sql) remain
-- independently populated -- kept for top_funds/top_projects
-- compatibility, extracted from the relevant pillar's signals, not
-- aliases of the cache.
--
-- `confidence` (High/Medium/Low) is deliberately NOT persisted here --
-- same convention as `grade` (see 007's header): it's a pure,
-- deterministic function of data_completeness_percent/
-- data_freshness_score (src/scoring/config.ts confidenceFrom),
-- computed on read.
-- =====================================================================

alter table public.project_scores
  add column pillar_breakdown jsonb,
  add column data_completeness_percent numeric,
  add column data_freshness_score numeric;

comment on column public.project_scores.pillar_breakdown is
  'A DETERMINISTIC CACHE / AUDIT SNAPSHOT / RENDERING OPTIMIZATION ONLY -- NOT canonical. Signals (recomputed on every sync via src/scoring-sync/signal-source.ts) are the sole source of truth. Stores ScoreEngineResult.pillars (src/scoring/types.ts) -- 6 pillars, each with its own signals (key/state/rawValue/normalizedScore/metadata), completeness, freshness, confidence. NEVER read back as an input to future scoring. Dropping or staling this column loses zero information -- fully reconstructable by rerunning the sync.';
comment on column public.project_scores.data_completeness_percent is
  'Overall (pillars-combined) completeness, 0-100. Cache only -- see pillar_breakdown comment.';
comment on column public.project_scores.data_freshness_score is
  'Overall (pillars-combined) freshness, 0-100. Cache only -- see pillar_breakdown comment.';

-- top_projects selects all 7 flat score columns by name plus a rank --
-- extend it with the 3 new columns. Postgres has no
-- ALTER MATERIALIZED VIEW ADD COLUMN, so this must drop and recreate
-- (008_scoring_materialized_views.sql's original definition, extended).
drop materialized view public.top_projects;

create materialized view public.top_projects as
with latest_scores as (
  select distinct on (project_id)
    project_id, total_score, funding_score, investor_score, market_score,
    tvl_score, revenue_score, unlock_score, momentum_score,
    data_completeness_percent, data_freshness_score, score_date
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
  ls.data_completeness_percent,
  ls.data_freshness_score,
  ls.score_date,
  rank() over (order by ls.total_score desc) as rank
from public.projects p
join latest_scores ls on ls.project_id = p.id;

comment on materialized view public.top_projects is
  'Live project leaderboard (most recent project_scores row per project, any date), with the full score breakdown plus overall completeness/freshness.';

create unique index top_projects_project_id_idx on public.top_projects (project_id);
create index top_projects_rank_idx on public.top_projects (rank);
grant select on public.top_projects to anon, authenticated;
