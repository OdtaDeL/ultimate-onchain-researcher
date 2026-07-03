-- =====================================================================
-- Smart Money Discovery Platform — project_metrics column extension
-- =====================================================================
-- Additive widening of project_metrics (001_initial_schema.sql) for the
-- unified Market Metrics ingestion pipeline (src/ingestion/metrics/).
-- project_metrics remains a current-state-only snapshot table per the
-- original MVP scope decision — these are still single-value-per-project
-- columns, not history. History is project_metrics_history, still future
-- work, not introduced here.
--
-- Column ownership (see src/ingestion/metrics/IDENTITY.md-equivalent
-- doc comments in mapper.ts): CoinGecko owns market_cap_rank,
-- circulating_supply, total_supply, max_supply, price_change_24h/7d/30d,
-- ath, atl (plus the pre-existing market_cap/fdv/price/volume_24h).
-- DefiLlama owns tvl_change_1d, tvl_change_7d, revenue_24h, fees_24h
-- (plus the pre-existing tvl/revenue_30d/fees_30d). The ingestion layer
-- enforces that each provider's upsert payload only ever contains its
-- own columns — see upsert-service.ts.
-- =====================================================================

alter table public.project_metrics
  add column market_cap_rank   integer,
  add column circulating_supply numeric,
  add column total_supply       numeric,
  add column max_supply         numeric,
  add column price_change_24h   numeric,
  add column price_change_7d    numeric,
  add column price_change_30d   numeric,
  add column ath                numeric,
  add column atl                numeric,
  add column tvl_change_1d       numeric,
  add column tvl_change_7d       numeric,
  add column revenue_24h         numeric,
  add column fees_24h            numeric;

comment on column public.project_metrics.market_cap_rank is 'CoinGecko-owned. Never written by DefiLlama ingestion.';
comment on column public.project_metrics.tvl_change_1d is 'DefiLlama-owned. Never written by CoinGecko ingestion.';
