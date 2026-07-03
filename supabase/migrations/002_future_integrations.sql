-- =====================================================================
-- Smart Money Discovery Platform — Forward-Compatible Extensions
-- =====================================================================
-- Additive schema for upcoming data sources: Kaito (social/mindshare),
-- TokenUnlocks (vesting schedules), Arkham & Nansen (entity/wallet
-- labels and smart-money flows). Nothing here modifies or removes
-- objects created in 001_initial_schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- data_sources — lookup table for every upstream provider
-- ---------------------------------------------------------------------

create table public.data_sources (
  id   uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,

  constraint data_sources_slug_key unique (slug)
);

comment on table public.data_sources is 'Registry of upstream data providers (coingecko, defillama, kaito, ...).';

insert into public.data_sources (slug, name) values
  ('coingecko',   'CoinGecko'),
  ('defillama',   'DefiLlama'),
  ('cryptorank',  'CryptoRank'),
  ('chainbroker', 'ChainBroker'),
  ('kaito',       'Kaito'),
  ('tokenunlocks','TokenUnlocks'),
  ('arkham',      'Arkham'),
  ('nansen',      'Nansen');

-- ---------------------------------------------------------------------
-- project_external_ids — normalized replacement for ad-hoc metadata
-- lookups; keeps projects.metadata as a convenience cache but makes
-- "find project by external id" queryable/indexable.
-- ---------------------------------------------------------------------

create table public.project_external_ids (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  external_id   text not null,

  constraint project_external_ids_project_source_key unique (project_id, data_source_id),
  constraint project_external_ids_source_external_key unique (data_source_id, external_id)
);

comment on table public.project_external_ids is 'Maps a project to its identifier in each upstream data source.';

create index project_external_ids_project_id_idx on public.project_external_ids (project_id);
create index project_external_ids_data_source_id_idx on public.project_external_ids (data_source_id);

-- ---------------------------------------------------------------------
-- social_metrics — Kaito mindshare / smart-follower / sentiment data
-- ---------------------------------------------------------------------

create table public.social_metrics (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  mindshare_score  numeric,
  smart_followers  integer,
  sentiment_score  numeric,
  captured_at      date not null,
  created_at       timestamptz not null default now(),

  constraint social_metrics_project_date_key unique (project_id, captured_at)
);

comment on table public.social_metrics is 'Daily social/mindshare snapshot per project (Kaito and similar sources).';

create index social_metrics_project_id_idx on public.social_metrics (project_id);
create index social_metrics_captured_at_idx on public.social_metrics (captured_at desc);

-- ---------------------------------------------------------------------
-- token_unlock_events — TokenUnlocks vesting schedule
-- ---------------------------------------------------------------------

create table public.token_unlock_events (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  unlock_date      date not null,
  unlock_type      text,
  amount_tokens    numeric,
  amount_usd       numeric,
  percent_of_supply numeric,
  created_at       timestamptz not null default now()
);

comment on table public.token_unlock_events is 'Scheduled/occurred token unlock events feeding project_scores.unlock_score.';

create index token_unlock_events_project_id_idx on public.token_unlock_events (project_id);
-- Covers the "Unlock Alerts" feed: WHERE unlock_date BETWEEN $1 AND $2
-- ORDER BY unlock_date, joined back to project_id with no extra lookup.
create index token_unlock_events_alerts_idx on public.token_unlock_events (unlock_date, project_id);

-- ---------------------------------------------------------------------
-- smart_money_wallets / smart_money_flows — Arkham & Nansen entity
-- labels and observed wallet flows into/out of a project's token
-- ---------------------------------------------------------------------

create table public.smart_money_wallets (
  id          uuid primary key default gen_random_uuid(),
  address     text not null,
  chain       text not null default 'ethereum',
  label       text,
  entity_type text,
  data_source_id uuid references public.data_sources (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint smart_money_wallets_chain_address_key unique (chain, address)
);

comment on table public.smart_money_wallets is 'Labeled wallets/entities sourced from Arkham, Nansen, etc.';

create index smart_money_wallets_data_source_id_idx on public.smart_money_wallets (data_source_id);

create table public.smart_money_flows (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references public.smart_money_wallets (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  direction   text not null check (direction in ('in', 'out')),
  amount_usd  numeric,
  flow_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

comment on table public.smart_money_flows is 'Observed smart-money wallet flow into/out of a project token.';

create index smart_money_flows_project_id_idx on public.smart_money_flows (project_id);
create index smart_money_flows_wallet_id_idx on public.smart_money_flows (wallet_id);
create index smart_money_flows_project_flow_at_idx on public.smart_money_flows (project_id, flow_at desc);

-- =====================================================================
-- Row Level Security — same public-read / admin-write pattern as 001
-- =====================================================================

alter table public.data_sources          enable row level security;
alter table public.project_external_ids  enable row level security;
alter table public.social_metrics        enable row level security;
alter table public.token_unlock_events   enable row level security;
alter table public.smart_money_wallets   enable row level security;
alter table public.smart_money_flows     enable row level security;

create policy "data_sources_public_read" on public.data_sources
  for select using (true);
create policy "data_sources_admin_write" on public.data_sources
  for all using (public.is_admin()) with check (public.is_admin());

create policy "project_external_ids_public_read" on public.project_external_ids
  for select using (true);
create policy "project_external_ids_admin_write" on public.project_external_ids
  for all using (public.is_admin()) with check (public.is_admin());

create policy "social_metrics_public_read" on public.social_metrics
  for select using (true);
create policy "social_metrics_admin_write" on public.social_metrics
  for all using (public.is_admin()) with check (public.is_admin());

create policy "token_unlock_events_public_read" on public.token_unlock_events
  for select using (true);
create policy "token_unlock_events_admin_write" on public.token_unlock_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "smart_money_wallets_public_read" on public.smart_money_wallets
  for select using (true);
create policy "smart_money_wallets_admin_write" on public.smart_money_wallets
  for all using (public.is_admin()) with check (public.is_admin());

create policy "smart_money_flows_public_read" on public.smart_money_flows
  for select using (true);
create policy "smart_money_flows_admin_write" on public.smart_money_flows
  for all using (public.is_admin()) with check (public.is_admin());
