-- =====================================================================
-- Smart Money Discovery Platform — project_scores column extension
-- =====================================================================
-- project_scores (001_initial_schema.sql) only has 4 of the 7 score
-- components the scoring engine (src/scoring/) now computes. Additive —
-- existing funding_score/tvl_score/market_score/unlock_score/total_score
-- columns and the (project_id, score_date) unique constraint are
-- untouched.
--
-- `grade` and the structured explanation are deliberately NOT persisted
-- here: both are pure, deterministic functions of total_score/the score
-- breakdown (src/scoring/config.ts gradeFromScore, src/scoring/
-- score-engine.ts buildExplanation) — computing them on read keeps a
-- single source of truth in TypeScript rather than duplicating grade
-- thresholds into SQL.
-- =====================================================================

alter table public.project_scores
  add column investor_score numeric,
  add column revenue_score  numeric,
  add column momentum_score numeric;

comment on column public.project_scores.investor_score is 'See src/scoring/investor-score.ts. 0-100.';
comment on column public.project_scores.revenue_score is 'See src/scoring/revenue-score.ts. 0-100.';
comment on column public.project_scores.momentum_score is 'See src/scoring/momentum-score.ts. 0-100.';
