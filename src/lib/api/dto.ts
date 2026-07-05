// Type-only re-export of the Dashboard Query Layer's frontend-ready DTOs
// (src/dashboard/types.ts) — the shapes the real API handlers already
// return today. Hooks/sources that have a real backend counterpart should
// shape their mock data against these types so swapping to a live fetch
// later is a type-checked, no-surprises change.
//
// Not every UI section has a DTO here: Fear & Greed, Trending Platforms,
// and Watchlist Summary have no backend support yet. Those sections keep
// using their existing component Prop types as the "data" shape until a
// real DTO exists — see src/lib/api/sources/home.ts.
export type {
  Grade,
  MarketOverviewAssetDto,
  MarketOverviewDto,
  ScoreSummaryDto,
  WeeklyPickDto,
  MonthlyPickDto,
  TopFundDto,
  TopGainerDto,
  RecentlyAddedDto,
  NewFundingDto,
  UnlockAlertDto,
  ProjectOverviewDto,
  ProjectFundingDto,
  ProjectFundingInvestorDto,
  ProjectFundingRoundDto,
  ProjectMetricsDto,
  ProjectUnlocksDto,
  ProjectUnlockEventDto,
  FundOverviewDto,
  FundInsightsDto,
  FundPortfolioDto,
  FundPortfolioProjectDto,
  ProjectSearchResultDto,
  FundSearchResultDto,
} from "@/dashboard/types";
