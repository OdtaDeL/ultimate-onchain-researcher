# How the Scoring Engine Works

`src/scoring/` is a pure, side-effect-free module: no Supabase import, no provider import, no I/O, anywhere in the folder. Every function takes plain data in and returns a plain number or object out. Assembling real database rows into the input shapes below is a *future scoring sync job's* responsibility — not this module's. This independence is deliberate and enforced by convention across the whole folder.

## Pipeline overview

```
ScoreEngineInput (7 fact blocks)
        │
        ▼
 7 independent component scores (0-100 each)
   funding · investor · market · tvl · revenue · unlock · momentum
        │
        ▼
 calculateWeightedScore()  →  overallScore (0-100)
        │
        ▼
 gradeFromScore()  →  Grade ("A+" | "A" | "B" | "C" | "D")
        │
        ▼
 buildExplanation()  →  ScoreExplanation (plain-English phrases + highlights)
```

Entry point: `runScoreEngine(input, config = DEFAULT_SCORING_CONFIG)` in `score-engine.ts`, which returns `{ overallScore, grade, scoreBreakdown, explanation }`.

## Design principle: no module depends on another score

Each of the 7 component-score functions (`calculateFundingScore`, `calculateInvestorScore`, `calculateMarketScore`, `calculateTvlScore`, `calculateRevenueScore`, `calculateUnlockScore`, `calculateMomentumScore`) computes its result from raw input facts only. None of them call each other or read each other's output. The **only** file allowed to combine scores is `weighted-score.ts`.

Momentum Score is the one module whose raw inputs overlap with other modules (e.g. it also looks at `daysSinceLastRound` and `priceChange24hPercent`). That's intentional, not a violation — it independently re-derives its own 0-100 from the same raw facts, with a different emphasis (short-term acceleration, not magnitude).

## The shared building block: piecewise-linear curves

Almost every sub-factor is computed by mapping a raw value (USD amount, percent change, day count, etc.) through a `ScoreCurvePoint[]` — a small set of `{ at, score }` anchor points — via `interpolateCurve()`:

```ts
interface ScoreCurvePoint { at: number; score: number; }
```

`interpolateCurve(curve, value)`:
- Below the first point's `at` → returns the first point's score.
- Above the last point's `at` → returns the last point's score.
- In between → linearly interpolates between the two bracketing points.

Every curve in `DEFAULT_SCORING_CONFIG` (`config.ts`) is therefore just a short list of "at this value, the sub-score should be this" judgment calls, with smooth interpolation filling the gaps — not a formula derived from data, but an explicit, inspectable, fully-configurable curve.

All final scores (each component score, and the overall weighted score) pass through `clampScore()`, which clamps to `[0, 100]` and rounds to 2 decimal places.

## The 7 component scores

### 1. Funding Score (`funding-score.ts`)
Measures how well-funded the project is. Five sub-factors, each 0-100, combined by `config.funding.subWeights` (defaults: amount 0.30, stage 0.20, recency 0.20, rounds 0.15, investors 0.15):

| Sub-factor | Input | How |
|---|---|---|
| Amount | `totalFundingUsd` | Log-scale curve: $0 → 0, $100K → 20, $1M → 40, $10M → 60, $50M → 80, $200M+ → 100. Most of the signal is in order-of-magnitude, not exact dollars. |
| Stage | `latestStage` | Direct lookup table (`stageScores`): `pre_seed` 30 → `series_c_plus` 90. `unknown` (the safe default when a provider's free-text round type can't be classified) scores 40. |
| Recency | `daysSinceLastRound` | Curve: 0-90 days → 100 (still "fresh"), declining to 20 at 10 years. `null` (no dated round) is treated as the *most stale* point on the curve, not a neutral midpoint. |
| Rounds | `numberOfRounds` | Diminishing-returns curve: 0 → 0, 1 → 40, up to 6+ → 100. |
| Investors | `numberOfUniqueInvestors` | Diminishing-returns curve: 0 → 0, 1 → 30, up to 20+ → 100. |

### 2. Investor Score (`investor-score.ts`)
Measures the quality of the investor syndicate. Returns 0 immediately if there are no investors at all. Otherwise, four sub-factors averaged across all `InvestorParticipation` entries, combined by `subWeights` (tierQuality 0.40, repeatParticipation 0.20, leadPresence 0.20, fundDiversity 0.20):

| Sub-factor | How |
|---|---|
| Tier quality | Average of each investor's tier score (`tier_1` 100, `tier_2` 70, `tier_3` 40, untiered 20 — untiered is the safe default since `funds` has no tier column in the schema today). |
| Repeat participation | Average rounds-participated-per-fund, fed through a curve (1 round → 30, 3+ rounds → 100) — rewards repeat backers over one-off syndicates. |
| Lead presence | Flat bonus: 100 if *any* investor has `isLead: true`, else 30. (`funding_investors` has no `is_lead` column today, so every caller currently passes `false` for everyone — see [SCORING_ENGINE.md "Known input gaps"](#known-input-gaps-fields-the-engine-accepts-but-nothing-populates-yet) below.) |
| Fund diversity | Unique fund count through a diminishing-returns curve (0 → 0, 1 → 30, 10+ → 100). |

### 3. Market Score (`market-score.ts`)
Measures market health. Five sub-factors, combined by `subWeights` (marketCap 0.30, fdvRatio 0.15, volume 0.20, liquidity 0.15, priceTrend 0.20):

| Sub-factor | How |
|---|---|
| Market cap | Log-scale curve, $0 → 0 up to $10B+ → 100. |
| FDV ratio | `fullyDilutedValuationUsd / marketCapUsd`. A ratio near 1 (little future dilution) scores 100; a high ratio (most supply still locked) scores down to 0 at 15x+. Falls back to a neutral 50 when FDV is missing or market cap is ≤ 0 (undefined ratio, not an observable dilution risk). |
| Volume | 24h volume, log-scale curve. |
| Liquidity | Turnover proxy = `volume24h / marketCap`. Non-monotonic curve: very low turnover scores low (10), peaks around 15% turnover (100), then *declines* again at extreme turnover (30 at 100%+) — extremely high turnover often signals thin float/volatility rather than real depth. |
| Price trend | Weighted blend of 24h/7d/30d % change (`priceTrendWeights`: 0.5/0.3/0.2), each run through a curve centered at 0% = 50. Any missing window is dropped from the weighted average rather than defaulted, with the remaining weights renormalized; if all three are missing, falls back to 50. |

### 4. TVL Score (`tvl-score.ts`)
Measures protocol TVL health. Three sub-factors, combined by `subWeights` (tvl 0.50, growth 0.35, chainDiversity 0.15):

| Sub-factor | How |
|---|---|
| TVL | Log-scale curve, $0 → 0 up to $10B+ → 100. |
| Growth | Blend of 1d/7d TVL % change (`growthWeights`: 0.4/0.6) through a curve centered at 0% = 50; missing windows dropped and remaining weight renormalized, falls back to 50 if both missing. |
| Chain diversity | `chainCount` through a diminishing-returns curve (1 chain → 40, 8+ → 100). Defaults to 1 when unknown — `project_metrics` has no per-chain breakdown column today, so this never inflates the score for unverified diversity. |

### 5. Revenue Score (`revenue-score.ts`)
Measures protocol revenue. Three sub-factors, combined by `subWeights` (revenue 0.40, fees 0.30, trend 0.30):

| Sub-factor | How |
|---|---|
| Revenue | 24h revenue, log-scale curve, $0 → 0 up to $5M+ → 100. |
| Fees | Same curve shape, applied to 24h fees. |
| Trend | Today's revenue vs. its trailing 30-day daily average (`(revenue24h - revenue30d/30) / (revenue30d/30) * 100`), fed through a percent-change curve centered at 0% = 50. Defaults to 50 (neutral) when either figure is missing *or* the 30-day total is 0 — a genuinely revenue-less protocol, not a divide-by-zero to mask. |

### 6. Unlock Score (`unlock-score.ts`)
Despite being called "Unlock Risk" in the product spec, this function returns a **safety** score — like every other module, higher is always better. A near-term, large, high-value unlock produces a *low* return value; no scheduled unlock, or a small/distant one, produces a *high* one. Three sub-factors, combined by `subWeights` (timing 0.40, magnitude 0.35, value 0.25):

| Sub-factor | How |
|---|---|
| Timing | Days until the next unlock, curve: 0 days → 0 (imminent = unsafe), 7 → 20, 30 → 50, 90 → 80, 180+ → 100 (distant = safe). |
| Magnitude | Percent of supply unlocking, curve: 0% → 100 (safe), 1% → 85, 5% → 55, 10% → 25, 20%+ → 0. |
| Value | USD value unlocking, curve: $0 → 100, $1M → 80, $10M → 50, $50M → 20, $200M+ → 0. |

If `nextUnlockDate` is `null` (no scheduled unlock at all), the function short-circuits and returns `config.noUpcomingUnlockScore` (100) — no risk to price in.

### 7. Momentum Score (`momentum-score.ts`)
Measures short-term acceleration (distinct from the *magnitude* metrics other modules already capture — see the design-principle note above). Four sub-factors, combined by `subWeights` (fundingRecency 0.25, priceMomentum 0.30, tvlMomentum 0.25, revenueMomentum 0.20):

| Sub-factor | How |
|---|---|
| Funding recency | `daysSinceLastRound` through a curve that decays faster than Funding Score's own recency curve (0 days → 100, 90 → 70, 365 → 30, 730+ → 10) — momentum cares about *very* recent activity. `null` is treated as the most-stale point, same convention as Funding Score. |
| Price momentum | 24h % change through a curve centered at 0% = 50. `null` → neutral 50. |
| TVL momentum | 1d % change through a curve centered at 0% = 50. `null` → neutral 50. |
| Revenue momentum | Caller-precomputed `revenueMomentumPercent` (today vs. trailing-30-day-daily-average, same formula as Revenue Score's trend factor) through a curve centered at 0% = 50. `null` → neutral 50. |

## Combining the 7 scores: Weighted Score (`weighted-score.ts`)

`calculateWeightedScore(breakdown, weights = config.weights)` is the **only** place in the entire folder allowed to combine scores. It:
1. Normalizes the 7 weights to sum to 1 (so passing whole percentages like `20, 20, 20, 15, 10, 5, 10` just works without the caller pre-dividing by 100).
2. Computes the weighted sum of the 7 component scores.
3. Clamps the result via `clampScore()`.

Default weights (`DEFAULT_SCORING_CONFIG.weights`, sums to 100): funding 20, investor 20, market 20, tvl 15, revenue 10, unlock 5, momentum 10.

## Grade thresholds (`gradeFromScore`, `config.ts`)

```
score >= 90  → "A+"
score >= 80  → "A"
score >= 65  → "B"
score >= 50  → "C"
otherwise    → "D"
```

These four cutoffs (90/80/65/50) are the only threshold values in the entire codebase explicitly chosen to mean "what counts as good/bad on a 0-100 scale," and are the precedent later analysis reused when designing new score-bucketing rules (e.g. unlock-risk-level, funding-quality buckets) elsewhere in the product.

## Explanation generation (`score-engine.ts`)

`buildExplanation(breakdown)` turns the 7 numeric component scores into plain-English phrases — generated strictly from already-computed scores, with no scoring logic of its own. Each component uses the same 3-tier rule via `tierPhrase(score, high, mid, low)`:

```
score >= 70 → "high" phrase
score >= 40 → "mid" phrase
otherwise   → "low" phrase
```

For example, Funding Score ≥ 70 → *"Strong institutional backing."*; 40-69 → *"Moderate funding history."*; below 40 → *"Limited or early-stage funding."* (Unlock Score's phrasing is inverted in wording only, since a *high* unlock score means *low* risk: ≥70 → *"Low unlock risk."*)

`highlights` is the 3 most notable component phrases, ranked by absolute distance from the neutral midpoint (50) — i.e. whichever 3 scores are most extreme (best or worst) get surfaced first, not a fixed category order. This is built for a future "AI Summary" feature to consume.

## Configurability

Every numeric constant — every curve, every sub-weight, every top-level weight, every grade threshold — lives in `DEFAULT_SCORING_CONFIG` (`config.ts`) and is passed as an optional parameter to every function in the folder, defaulting to that config. Nothing is hardcoded inline in any score module. This is what makes the engine fully testable at exact boundary values without editing source, and swappable (e.g. an A/B test of different weighting) without touching any of the 7 score modules themselves.

## Known input gaps (fields the engine accepts but nothing populates yet)

The engine's input types accept several fields the current schema/ingestion can't actually supply yet — each is flagged at its declaration in `types.ts` with a safe, non-inflating default:

- `FundingStage` classification — ChainBroker's `round_type` is free text (usually just "Funding Round"); nothing maps it to the enum yet, so `"unknown"` (score 40, a below-neutral default) is used.
- `InvestorParticipation.tier` — `funds` has no tier column; `null` → `"untiered"` (the lowest tier score, 20).
- `InvestorParticipation.isLead` — `funding_investors` has no `is_lead` column; defaults to `false` for everyone, meaning every project currently scores via `leadAbsentScore` (30) on that sub-factor regardless of reality.
- `TvlScoreInput.chainCount` — `project_metrics` has no per-chain breakdown column (DefiLlama's provider *does* expose this via `getProtocolTvlByChain`, but nothing persists a count from it); defaults to 1 (single-chain assumption).

None of these are scoring-engine bugs — they're the scoring engine correctly degrading to a conservative default while the upstream schema/ingestion gap (documented separately in this project's backend-gap analysis) remains open.
