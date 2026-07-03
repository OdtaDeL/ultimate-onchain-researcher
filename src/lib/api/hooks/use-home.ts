"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { mapQueryResult, type AsyncDataResult } from "../map-query-result";
import type { ApiClientError } from "../errors";
import { fetchHomeData, type HomeData } from "../sources/home";

const EMPTY_HOME_DATA: HomeData = {
  marketOverview: { assets: [], totalMarketCap: 0, totalMarketCapChangePercent24h: 0 },
  fearGreed: { value: 0, asOfLabel: "" },
  trendingProjects: [],
  trendingFunds: [],
  trendingPlatforms: [],
  weeklyPicks: [],
  monthlyPicks: [],
  topGainers: [],
  recentlyAdded: [],
  recentFundraises: [],
  unlockAlerts: [],
  topFunds: [],
};

/**
 * UI boundary: `HomePage` never imports mock-data directly — it calls this
 * hook and only ever sees `{data, loading, error, refresh}`. Backed by
 * TanStack Query's `useQuery()` (caching, retries, staleTime/gcTime — see
 * src/lib/query/defaults.ts) instead of a hand-rolled state machine.
 * `fetchHomeData` (src/lib/api/sources/home.ts) calls the real
 * `GET /api/home` for weeklyPicks, monthlyPicks, recentFundraises,
 * unlockAlerts, and topFunds. marketOverview,
 * fearGreed, trendingProjects/Funds/Platforms, topGainers, and
 * recentlyAdded have no backing DTO and remain mock — see that file's
 * header comment for the full per-field breakdown. This hook's shape never changes regardless.
 */
export function useHome(): AsyncDataResult<HomeData> {
  const query = useQuery<HomeData, ApiClientError>({
    queryKey: queryKeys.home(),
    queryFn: ({ signal }) => fetchHomeData(signal),
  });
  return mapQueryResult(query, EMPTY_HOME_DATA);
}
