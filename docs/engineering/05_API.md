# 05 — API

## Endpoints

### `GET /api/home`

Returns data for the home feed.

```typescript
{
  trending: TrendingItem[];       // top ranked projects
  weeklyRankings: RankingItem[];  // weekly change leaders
  upcomingUnlocks: UnlockItem[];  // next 7 days
  recentFundraises: FundraiseItem[]; // last 30 days
}
```

### `GET /api/projects`

Returns ranked project list for Markets tab.

```typescript
{
  projects: ProjectListItem[];  // sorted by score desc
  pagination: { page, perPage, total }
}
```

### `GET /api/projects/[slug]`

Returns full project data for detail page.

```typescript
{
  overview: { name, logo_url, category, score: { totalScore, grade, ... } | null }
  metrics: ProjectMetricsRow | null     // null if not yet ingested
  fundingRounds: ProjectFundingRoundDto[]
  unlocks: TokenUnlockRow[]
  relatedProjects: RelatedProjectDto[]
}
```

### `GET /api/funds`

Returns ranked fund list for Markets tab.

```typescript
{
  funds: FundListItem[];
  pagination: { page, perPage, total }
}
```

### `GET /api/funds/[slug]`

Returns full fund data for detail page.

```typescript
{
  overview: { name, logo_url, website, twitter, portfolioProjectCount }
  portfolio: PortfolioItemDto[]
  recentInvestments: PortfolioItemDto[]  // top 5 by announced_date
  insights: FundInsightDto[]
  topSectors: string[]
  topChains: string[]                    // always [] — no chain data in schema
}
```

### `GET /api/search?q=<query>`

Full-text search across projects and funds.

```typescript
{
  projects: SearchResultDto[];
  funds: SearchResultDto[];
}
```

### `GET /api/rankings?period=weekly|monthly`

Returns leaderboard rankings.

```typescript
{
  rankings: RankingItem[];  // rank, name, score, change
}
```

## Response Envelope

All endpoints wrap their payload in:

```typescript
{
  success: boolean;
  data: T;
  pagination?: { page: number; perPage: number; total: number };
}
```

`apiFetch<T>` in `src/lib/api/client.ts` unwraps this envelope and returns `data` directly.

## Error Responses

```typescript
{
  success: false;
  error: string;
  code?: string;
}
```

HTTP status codes: 200 success, 400 bad request, 404 not found, 500 server error.

## Missing / Not-Yet-Built Endpoints

| Missing | Required By |
|---|---|
| `GET /api/watchlist` | Watchlist page (sync across devices) |
| `GET /api/favorites` | Favorites feature |
| `POST /api/watchlist` | Save watchlist to server |
| WebSocket / SSE for price updates | Real-time price display |
