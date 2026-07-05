"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { mapQueryResult, type AsyncDataResult } from "../map-query-result";
import type { ApiClientError } from "../errors";
import { fetchSearchData, fetchMoreSearchFunds, fetchMoreSearchProjects, type SearchData } from "../sources/search";

export type { SearchData, SearchProjectRow, SearchFundRow } from "../sources/search";
export { fetchMoreSearchProjects, fetchMoreSearchFunds };

const EMPTY_SEARCH_DATA: SearchData = {
  query: "",
  projects: [],
  funds: [],
  platforms: [],
  trendingSearches: [],
  projectsNextPage: null,
  fundsNextPage: null,
};

/**
 * UI boundary for the Search screen. Takes the live query string so the
 * query key (`queryKeys.search(query)`) changes as the user types, which
 * is what drives TanStack Query to re-fetch per distinct query against
 * `GET /api/search?q=...`.
 * Recent Searches stay out of this hook's data; they're local-only state
 * owned by src/store/search-store.ts (never server-backed, per
 * DESIGN_SYSTEM).
 */
export function useSearch(query: string): AsyncDataResult<SearchData> {
  const search = useQuery<SearchData, ApiClientError>({
    queryKey: queryKeys.search(query),
    queryFn: ({ signal }) => fetchSearchData(query, signal),
  });
  return mapQueryResult(search, EMPTY_SEARCH_DATA);
}
