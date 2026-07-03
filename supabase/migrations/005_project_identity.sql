-- =====================================================================
-- Smart Money Discovery Platform — Project Identity Resolution
-- =====================================================================
-- Provider-independent identity layer: maps how each upstream provider
-- (ChainBroker, CoinGecko, DefiLlama, and future RootData/CryptoRank/
-- Kaito) refers to a project onto a single internal `projects.id`. See
-- src/identity/IDENTITY.md for the matching/confidence/conflict-resolution
-- design this table supports.
--
-- Relationship to project_external_ids (002_future_integrations.sql):
-- that table already maps project_id <-> data_source_id <-> external_id,
-- but only carries one opaque ID per (project, source) with no slug/
-- symbol/name/contract-address fields, no confidence, and no concept of
-- "primary vs. historical" mapping. It was never populated by any
-- ingestion code written so far. project_aliases supersedes it as the
-- identity-resolution mechanism going forward; project_external_ids is
-- left untouched (not dropped, not modified) since deciding its fate is
-- a separate, deliberate migration this task does not authorize.
-- =====================================================================

-- RootData was named as a future provider for this identity layer but
-- was never seeded in 002 — added here, additively, since project_aliases
-- FKs `provider` to data_sources.slug and must be able to register it.
insert into public.data_sources (slug, name) values
  ('rootdata', 'RootData')
on conflict (slug) do nothing;

create table public.project_aliases (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  provider            text not null references public.data_sources (slug),
  provider_identifier text,
  provider_slug       text,
  provider_symbol     text,
  provider_name       text,
  contract_address    text,
  confidence          smallint not null check (confidence between 0 and 100),
  is_primary          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- A row identifying nothing is meaningless — at least one field must
  -- actually be populated.
  constraint project_aliases_has_identifier check (
    provider_identifier is not null or
    provider_slug       is not null or
    provider_symbol     is not null or
    provider_name       is not null or
    contract_address    is not null
  )
);

comment on table public.project_aliases is
  'Provider-independent identity mapping: how each upstream provider refers to a project. See src/identity/.';
comment on column public.project_aliases.confidence is
  'Score assigned once at row-creation time by whichever match tier produced it (see src/identity/types.ts TIER_CONFIDENCE); not recomputed on lookup.';
comment on column public.project_aliases.is_primary is
  'The canonical mapping for (project_id, provider). Older rows are demoted (set false), never deleted, when a provider renames/relists — see IDENTITY.md "Renamed protocols."';

-- ---------------------------------------------------------------------
-- Uniqueness — "prevent duplicate identities"
-- ---------------------------------------------------------------------
-- Case-insensitive: providers are not consistent about casing (e.g. a
-- symbol reported as "AAVE" vs "aave"), and a contract address's casing
-- is never semantically meaningful for matching purposes (EIP-55 checksum
-- casing aside). Functional unique indexes on lower(...) reject
-- case-variant duplicates while the column itself still stores the
-- original casing for display.
--
-- provider_symbol and provider_name are deliberately NOT made unique —
-- symbol collisions and shared display names across distinct real
-- projects are expected (see IDENTITY.md "Conflict Resolution"), not
-- data errors to reject at the database layer.

create unique index project_aliases_provider_identifier_key
  on public.project_aliases (provider, lower(provider_identifier))
  where provider_identifier is not null;

create unique index project_aliases_provider_slug_key
  on public.project_aliases (provider, lower(provider_slug))
  where provider_slug is not null;

create unique index project_aliases_provider_contract_key
  on public.project_aliases (provider, lower(contract_address))
  where contract_address is not null;

-- Only one row per (project, provider) may be the primary/canonical
-- mapping. Additional historical rows for the same project+provider are
-- allowed (renamed slugs, merged listings) but must have is_primary = false.
create unique index project_aliases_one_primary_per_project_provider
  on public.project_aliases (project_id, provider)
  where is_primary;

create index project_aliases_project_id_idx on public.project_aliases (project_id);
create index project_aliases_provider_idx on public.project_aliases (provider);

create trigger project_aliases_set_updated_at
  before update on public.project_aliases
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security — same public-read / admin-write pattern as 001/002
-- =====================================================================

alter table public.project_aliases enable row level security;

create policy "project_aliases_public_read" on public.project_aliases
  for select using (true);
create policy "project_aliases_admin_insert" on public.project_aliases
  for insert with check (public.is_admin());
create policy "project_aliases_admin_update" on public.project_aliases
  for update using (public.is_admin()) with check (public.is_admin());
create policy "project_aliases_admin_delete" on public.project_aliases
  for delete using (public.is_admin());
