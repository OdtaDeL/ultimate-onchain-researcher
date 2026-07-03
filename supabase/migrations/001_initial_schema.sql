-- =====================================================================
-- Smart Money Discovery Platform — Initial Schema
-- =====================================================================
-- Core domain: projects, venture funds, funding rounds, investors,
-- market metrics, scoring, and weekly/monthly leaderboard rankings.
--
-- Conventions:
--   - UUID primary keys (gen_random_uuid())
--   - timestamptz for all timestamps, numeric for all financial values
--   - Every FK column is indexed (Postgres does not do this automatically)
--   - RLS enabled on every table: public read, admin-only write
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------

-- Keeps `updated_at` columns current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Authorization check used by every "admin write" RLS policy below.
-- Backend ingestion jobs should use the service_role key (which bypasses
-- RLS entirely); this function only gates writes made through the
-- anon/authenticated Supabase client (e.g. an admin dashboard).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------
-- 1. projects
-- ---------------------------------------------------------------------

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  name        text not null,
  ticker      text,
  category    text,
  description text,
  logo_url    text,
  website     text,
  twitter     text,
  -- Forward-compatible bag for external source identifiers, e.g.
  -- {"coingecko_id": "...", "defillama_slug": "...", "cryptorank_id": "..."}.
  -- See migration 002 for normalized, queryable external-ID storage.
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint projects_slug_key unique (slug)
);

comment on table public.projects is 'Canonical crypto project registry.';
comment on column public.projects.metadata is 'Free-form bag of external source identifiers/attributes.';

create index projects_category_idx on public.projects (category);
create index projects_ticker_idx on public.projects (ticker);
create index projects_metadata_gin_idx on public.projects using gin (metadata);

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. project_metrics  (latest snapshot per project — 1:1 with projects)
-- ---------------------------------------------------------------------

create table public.project_metrics (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  market_cap   numeric,
  fdv          numeric,
  price        numeric,
  volume_24h   numeric,
  tvl          numeric,
  revenue_30d  numeric,
  fees_30d     numeric,
  updated_at   timestamptz not null default now(),

  constraint project_metrics_project_id_key unique (project_id)
);

comment on table public.project_metrics is 'Latest market/financial snapshot per project (upserted on refresh).';

create index project_metrics_market_cap_idx on public.project_metrics (market_cap desc);
create index project_metrics_tvl_idx on public.project_metrics (tvl desc);

create trigger project_metrics_set_updated_at
  before update on public.project_metrics
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. funds  (venture funds / investors)
-- ---------------------------------------------------------------------

create table public.funds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  website     text,
  twitter     text,
  description text,
  created_at  timestamptz not null default now(),

  constraint funds_name_key unique (name)
);

comment on table public.funds is 'Venture funds / investing entities.';

-- ---------------------------------------------------------------------
-- 4. funding_rounds
-- ---------------------------------------------------------------------

create table public.funding_rounds (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  round_type     text,
  amount_raised  numeric,
  announced_date date,
  fdv            numeric,
  created_at     timestamptz not null default now()
);

comment on table public.funding_rounds is 'Funding events raised by a project (seed, series A, strategic, etc).';
comment on column public.funding_rounds.round_type is 'Free-text round label (Seed, Private, Series A, Strategic, IDO, ...).';

create index funding_rounds_project_id_idx on public.funding_rounds (project_id);
create index funding_rounds_announced_date_idx on public.funding_rounds (announced_date desc);

-- ---------------------------------------------------------------------
-- 5. funding_investors  (many-to-many: funding_rounds <-> funds)
-- ---------------------------------------------------------------------

create table public.funding_investors (
  id                uuid primary key default gen_random_uuid(),
  funding_round_id  uuid not null references public.funding_rounds (id) on delete cascade,
  fund_id           uuid not null references public.funds (id) on delete cascade,

  constraint funding_investors_round_fund_key unique (funding_round_id, fund_id)
);

comment on table public.funding_investors is 'Join table: which funds participated in which funding round.';

create index funding_investors_funding_round_id_idx on public.funding_investors (funding_round_id);
create index funding_investors_fund_id_idx on public.funding_investors (fund_id);

-- ---------------------------------------------------------------------
-- 6. project_scores  (daily scoring snapshot per project)
-- ---------------------------------------------------------------------

create table public.project_scores (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  funding_score numeric,
  tvl_score     numeric,
  market_score  numeric,
  unlock_score  numeric,
  total_score   numeric,
  score_date    date not null,
  created_at    timestamptz not null default now(),

  constraint project_scores_project_date_key unique (project_id, score_date)
);

comment on table public.project_scores is 'Daily composite scoring snapshot per project, used to derive rankings.';

create index project_scores_project_id_idx on public.project_scores (project_id);
create index project_scores_date_total_score_idx
  on public.project_scores (score_date, total_score desc);

-- ---------------------------------------------------------------------
-- 7. weekly_rankings
-- ---------------------------------------------------------------------

create table public.weekly_rankings (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  rank        integer not null,
  total_score numeric,
  week_start  date not null,
  created_at  timestamptz not null default now(),

  constraint weekly_rankings_project_week_key unique (project_id, week_start),
  constraint weekly_rankings_week_rank_key unique (week_start, rank)
);

comment on table public.weekly_rankings is 'Leaderboard rank per project for a given ISO week.';

create index weekly_rankings_project_id_idx on public.weekly_rankings (project_id);
-- weekly_rankings_week_rank_key (above) already serves as the primary
-- leaderboard-read index: WHERE week_start = $1 ORDER BY rank.

-- ---------------------------------------------------------------------
-- 8. monthly_rankings
-- ---------------------------------------------------------------------

create table public.monthly_rankings (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  rank        integer not null,
  total_score numeric,
  month_start date not null,
  created_at  timestamptz not null default now(),

  constraint monthly_rankings_project_month_key unique (project_id, month_start),
  constraint monthly_rankings_month_rank_key unique (month_start, rank)
);

comment on table public.monthly_rankings is 'Leaderboard rank per project for a given calendar month.';

create index monthly_rankings_project_id_idx on public.monthly_rankings (project_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
-- Every table: anyone (anon + authenticated) can read; only callers
-- whose JWT carries app_metadata.role = 'admin' can write. Ingestion
-- pipelines should use the service_role key, which bypasses RLS.
-- =====================================================================

alter table public.projects          enable row level security;
alter table public.project_metrics   enable row level security;
alter table public.funds             enable row level security;
alter table public.funding_rounds    enable row level security;
alter table public.funding_investors enable row level security;
alter table public.project_scores    enable row level security;
alter table public.weekly_rankings   enable row level security;
alter table public.monthly_rankings  enable row level security;

-- projects
create policy "projects_public_read" on public.projects
  for select using (true);
create policy "projects_admin_insert" on public.projects
  for insert with check (public.is_admin());
create policy "projects_admin_update" on public.projects
  for update using (public.is_admin()) with check (public.is_admin());
create policy "projects_admin_delete" on public.projects
  for delete using (public.is_admin());

-- project_metrics
create policy "project_metrics_public_read" on public.project_metrics
  for select using (true);
create policy "project_metrics_admin_insert" on public.project_metrics
  for insert with check (public.is_admin());
create policy "project_metrics_admin_update" on public.project_metrics
  for update using (public.is_admin()) with check (public.is_admin());
create policy "project_metrics_admin_delete" on public.project_metrics
  for delete using (public.is_admin());

-- funds
create policy "funds_public_read" on public.funds
  for select using (true);
create policy "funds_admin_insert" on public.funds
  for insert with check (public.is_admin());
create policy "funds_admin_update" on public.funds
  for update using (public.is_admin()) with check (public.is_admin());
create policy "funds_admin_delete" on public.funds
  for delete using (public.is_admin());

-- funding_rounds
create policy "funding_rounds_public_read" on public.funding_rounds
  for select using (true);
create policy "funding_rounds_admin_insert" on public.funding_rounds
  for insert with check (public.is_admin());
create policy "funding_rounds_admin_update" on public.funding_rounds
  for update using (public.is_admin()) with check (public.is_admin());
create policy "funding_rounds_admin_delete" on public.funding_rounds
  for delete using (public.is_admin());

-- funding_investors
create policy "funding_investors_public_read" on public.funding_investors
  for select using (true);
create policy "funding_investors_admin_insert" on public.funding_investors
  for insert with check (public.is_admin());
create policy "funding_investors_admin_update" on public.funding_investors
  for update using (public.is_admin()) with check (public.is_admin());
create policy "funding_investors_admin_delete" on public.funding_investors
  for delete using (public.is_admin());

-- project_scores
create policy "project_scores_public_read" on public.project_scores
  for select using (true);
create policy "project_scores_admin_insert" on public.project_scores
  for insert with check (public.is_admin());
create policy "project_scores_admin_update" on public.project_scores
  for update using (public.is_admin()) with check (public.is_admin());
create policy "project_scores_admin_delete" on public.project_scores
  for delete using (public.is_admin());

-- weekly_rankings
create policy "weekly_rankings_public_read" on public.weekly_rankings
  for select using (true);
create policy "weekly_rankings_admin_insert" on public.weekly_rankings
  for insert with check (public.is_admin());
create policy "weekly_rankings_admin_update" on public.weekly_rankings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "weekly_rankings_admin_delete" on public.weekly_rankings
  for delete using (public.is_admin());

-- monthly_rankings
create policy "monthly_rankings_public_read" on public.monthly_rankings
  for select using (true);
create policy "monthly_rankings_admin_insert" on public.monthly_rankings
  for insert with check (public.is_admin());
create policy "monthly_rankings_admin_update" on public.monthly_rankings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "monthly_rankings_admin_delete" on public.monthly_rankings
  for delete using (public.is_admin());
