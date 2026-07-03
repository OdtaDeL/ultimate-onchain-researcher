-- =====================================================================
-- Smart Money Discovery Platform — funds.slug
-- =====================================================================
-- `funds` (001_initial_schema.sql) only ever had `name` as a natural key.
-- ChainBroker's ingestion layer (src/ingestion/chainbroker/types.ts
-- FundDraft) has carried a real provider-supplied slug since the very
-- first ChainBroker integration, but discarded it before persisting —
-- it existed only as an in-process dedup key. The Dashboard Query Layer
-- (src/dashboard/) then had to paper over the gap by deriving a slug
-- from `name` at query time (slugifyFundName), which is both fragile
-- (collisions on name changes/punctuation) and inefficient (forces a
-- full-table scan to resolve a fund by slug — see src/dashboard/fund.ts
-- prior to this migration).
--
-- This migration adds the column for real, backfills existing rows from
-- `name` (collision-safe via a `-2`/`-3`/... suffix), then locks it down
-- with NOT NULL + a unique index. A unique index on a NOT NULL column
-- satisfies both "ensure slug is unique" and "add an index" in one
-- object — no separate plain index is needed alongside it.
-- =====================================================================

alter table public.funds add column slug text;

-- Backfill: derive a URL-safe slug from `name` (lowercase, non-alphanumeric
-- runs collapsed to single hyphens, leading/trailing hyphens trimmed), then
-- disambiguate any collisions by appending `-2`, `-3`, ... in a stable
-- (by id) order. Mirrors src/dashboard/types.ts's now-retired
-- slugifyFundName, but only needs to run once, here, for pre-existing rows.
with base as (
  select
    id,
    regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g') as base_slug
  from public.funds
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as rn
  from base
)
update public.funds f
set slug = case when n.rn = 1 then n.base_slug else n.base_slug || '-' || n.rn end
from numbered n
where f.id = n.id;

alter table public.funds alter column slug set not null;

create unique index funds_slug_key on public.funds (slug);

comment on column public.funds.slug is
  'Provider-supplied stable identifier (e.g. ChainBroker''s fund slug). Populated directly by ingestion going forward — see src/ingestion/chainbroker/upsert-service.ts upsertFunds. Never derive this from `name` at query time.';
