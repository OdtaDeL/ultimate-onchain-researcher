-- =====================================================================
-- Smart Money Discovery Platform — Sync Run Metadata (generic)
-- =====================================================================
-- Records every sync job run across every data provider — ChainBroker
-- today, CoinGecko/DefiLlama/future providers later — so a job can
-- answer "did the prerequisite bootstrap already succeed?" without
-- re-deriving it from row counts. Keyed by (provider, job_name), not
-- ChainBroker-specific in any way.
--
-- This is internal operational metadata, not platform content (unlike
-- every table in 001/002/003): no public-read policy. RLS is enabled
-- with zero policies, so only service_role (which bypasses RLS, per the
-- comments in 001_initial_schema.sql) can read or write it.
--
-- Persistence into this table is best-effort by design (see
-- src/sync/sync-metadata.ts) — a failed write here must never abort or
-- block the data-sync job it's describing. items_inserted/items_updated
-- exist for forward compatibility but are not yet populated by any
-- current job (today's ingestion layer only reports an aggregate
-- "upserted" count, not an insert/update split); see
-- src/sync/chainbroker/runBootstrap.ts for what's actually populated.
-- =====================================================================

create table public.sync_runs (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  job_name        text not null,
  status          text not null check (status in ('succeeded', 'failed')),
  started_at      timestamptz not null,
  completed_at    timestamptz not null,
  duration_ms     integer not null,
  pages_processed integer,
  items_processed integer,
  items_inserted  integer,
  items_updated   integer,
  items_skipped   integer,
  failed_pages    integer[] not null default '{}',
  last_error      text,
  created_at      timestamptz not null default now()
);

comment on table public.sync_runs is
  'Generic audit log of sync job runs across all data providers. Internal use only — no public-read policy. Writes are best-effort: see src/sync/sync-metadata.ts.';
comment on column public.sync_runs.provider is 'Data source identifier, e.g. chainbroker, coingecko, defillama.';
comment on column public.sync_runs.job_name is 'Job identifier, e.g. syncBootstrapProjects, syncFundingRounds.';

-- Supports "most recent run of job X for provider Y" lookups, e.g.
-- checking whether syncBootstrapProjects has ever succeeded before
-- running a dependent job.
create index sync_runs_provider_job_completed_at_idx
  on public.sync_runs (provider, job_name, completed_at desc);

alter table public.sync_runs enable row level security;
-- No policies: service_role (the only writer/reader, per the ingestion
-- layer's design — see src/ingestion/chainbroker/supabase-client.ts)
-- bypasses RLS entirely. anon/authenticated get no access at all.
