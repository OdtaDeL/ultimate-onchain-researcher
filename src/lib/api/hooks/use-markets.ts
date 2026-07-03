"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { mapQueryResult, type AsyncDataResult } from "../map-query-result";
import type { ApiClientError } from "../errors";
import { fetchMarketsData, type MarketsData } from "../sources/markets";

const EMPTY_MARKETS_DATA: MarketsData = { projects: [], funds: [], platforms: [] };

/**
 * UI boundary for the Markets screen. Returns all three tabs' data
 * bundled (`{projects, funds, platforms}`); the page keeps its own
 * tab-selection UI state and picks which array to render, same pattern
 * as `useHome()`'s Trending section. Backed by TanStack Query — see
 * src/lib/api/hooks/use-home.ts's doc comment for the migration note.
 */
export function useMarkets(): AsyncDataResult<MarketsData> {
  const query = useQuery<MarketsData, ApiClientError>({
    queryKey: queryKeys.markets(),
    queryFn: ({ signal }) => fetchMarketsData(signal),
  });
  return mapQueryResult(query, EMPTY_MARKETS_DATA);
}
