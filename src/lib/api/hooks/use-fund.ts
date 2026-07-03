"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { mapQueryResult, type AsyncDataResult } from "../map-query-result";
import type { ApiClientError } from "../errors";
import { fetchFundData, type FundData } from "../sources/fund";

const EMPTY_FUND_DATA: FundData = {
  fund: {
    slug: "",
    name: "",
    logoUrl: null,
    website: null,
    twitterHandle: null,
    portfolioSize: null,
    lastInvestmentLabel: "",
  },
  topSectors: [],
  topChains: [],
  insights: [],
  portfolio: [],
  recentInvestments: [],
};

/** UI boundary for the Fund Detail screen. `slug` is the URL segment from the dynamic [slug] route. */
export function useFund(slug: string): AsyncDataResult<FundData> {
  const query = useQuery<FundData, ApiClientError>({
    queryKey: queryKeys.fund(slug),
    queryFn: ({ signal }) => fetchFundData(slug, signal),
  });
  return mapQueryResult(query, EMPTY_FUND_DATA);
}
