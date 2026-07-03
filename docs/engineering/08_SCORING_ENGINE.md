# 08 — Scoring Engine

## Location

`src/scoring/`

## Architecture

Pure TypeScript. No Supabase imports. No fetch. No side effects. Deterministic: same input → same output always.

```
ScoreEngineInput → runScoreEngine() → ScoreEngineOutput
```

## 7 Component Scores

| Component | Key | Source Data |
|---|---|---|
| Funding Score | `funding` | Total raised USD, round count |
| Investor Score | `investor` | Investor reputation, tier |
| Market Score | `market` | Market cap, price trend |
| TVL Score | `tvl` | Total value locked |
| Revenue Score | `revenue` | Protocol revenue |
| Unlock Score | `unlock` | Supply unlock schedule, percent |
| Momentum Score | `momentum` | Recent activity, search volume |

## Piecewise-Linear Curve Interpolation

Each component score is computed via a curve: a set of `(input, score)` breakpoints. Values between breakpoints are linearly interpolated. Values below the first breakpoint return the minimum score; values above the last return the maximum.

## Grade Thresholds

| Grade | Minimum Score |
|---|---|
| A+ | 90 |
| A | 80 |
| B | 65 |
| C | 50 |
| D | < 50 |

These thresholds live in `src/scoring/types.ts` and are the **only authoritative source**. No frontend code derives grades from scores — grades come from `project_scores.grade` in the DB.

## Score Type

```typescript
type Grade = "A+" | "A" | "B" | "C" | "D";
// Also exported as ScoreGrade in src/lib/theme/colors.ts for component use
```

## Ingestion Flow

```
npm run sync:scores
  → reads all projects from DB
  → assembles ScoreEngineInput per project
  → calls runScoreEngine(input)
  → upserts project_scores row
  → calls REFRESH MATERIALIZED VIEW for all MVs
```

## ScoreEngineInput

```typescript
interface ScoreEngineInput {
  projectId: string;
  totalFundingUsd: number | null;
  roundCount: number;
  investorTiers: string[];
  marketCapUsd: number | null;
  tvlUsd: number | null;
  revenueUsd: number | null;
  nextUnlockPercent: number | null;
  priceChangePercent: number | null;
}
```

## ScoreEngineOutput

```typescript
interface ScoreEngineOutput {
  totalScore: number;       // 0–100
  grade: Grade;
  components: {
    funding: number;
    investor: number;
    market: number;
    tvl: number;
    revenue: number;
    unlock: number;
    momentum: number;
  };
}
```

## Theme Integration

`src/lib/theme/colors.ts` exports `scoreGradeColor` which maps `Grade → { text, bg, border }` CSS classes. Used by `ScoreCircle`, `Pill` (grade badge), and `ProgressBar` (overall fill).
