-- =====================================================================
-- Smart Money Discovery Platform — register coinpaprika/dexscreener
-- =====================================================================
-- project_aliases.provider FKs to data_sources.slug (005_project_identity.sql)
-- — both new gap-fill metrics providers (see src/providers/coinpaprika/,
-- src/providers/dexscreener/, and src/ingestion/metrics/mapper.ts) must be
-- registered here before identity resolution can write an alias for
-- either one. Same additive pattern as 005's RootData insert.
-- =====================================================================

insert into public.data_sources (slug, name) values
  ('coinpaprika', 'CoinPaprika'),
  ('dexscreener', 'DexScreener')
on conflict (slug) do nothing;
