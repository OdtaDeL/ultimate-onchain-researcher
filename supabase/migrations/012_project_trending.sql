-- =====================================================================
-- Smart Money Discovery Platform — projects.is_trending / trending_rank
-- =====================================================================
-- New ingestion source: ChainBroker's GET /projects/trending/ (documented
-- in src/providers/chainbroker/SOURCE.md, previously unused — no code
-- called it before this feature). Surfaces a "Hot Projects" section on
-- Home (see src/app/(tabs)/page.tsx), independent of this platform's own
-- scoring engine — this is ChainBroker's own trending signal, not derived
-- from project_scores.
--
-- trending_rank is nullable and reset to null for every project not
-- present in the latest sync (see src/sync/chainbroker/syncTrending.ts),
-- so a project that falls out of the trending list stops surfacing
-- immediately rather than showing a stale rank forever.
-- =====================================================================

alter table public.projects
  add column is_trending boolean not null default false,
  add column trending_rank integer,
  add column trending_synced_at timestamptz;

create index projects_trending_rank_idx on public.projects (trending_rank) where is_trending;

comment on column public.projects.is_trending is
  'True when this project appeared in ChainBroker''s most recent GET /projects/trending/ response. Reset to false for every project not present in the latest sync.';
comment on column public.projects.trending_rank is
  'Rank within ChainBroker''s trending list (1 = hottest) as of trending_synced_at. Null when is_trending is false.';
comment on column public.projects.trending_synced_at is
  'Timestamp of the sync run that last set is_trending/trending_rank for this project.';
