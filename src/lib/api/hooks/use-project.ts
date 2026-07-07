"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { mapQueryResult, type AsyncDataResult } from "../map-query-result";
import type { ApiClientError } from "../errors";
import { fetchProjectData, type ProjectData } from "../sources/project";

const EMPTY_PROJECT_DATA: ProjectData = {
  project: {
    slug: "",
    name: "",
    logoUrl: null,
    category: null,
    score: null,
    grade: null,
    completenessPercent: null,
    confidence: null,
    marketCap: null,
    fdv: null,
    tvl: null,
    changePercent24h: null,
    circulatingSupply: null,
    totalSupply: null,
    athPrice: null,
    atlPrice: null,
    volume24h: null,
    website: null,
    twitter: null,
  },
  scoreCategories: [],
  fundingRounds: [],
  nextUnlock: { dateLabel: "", percentOfSupply: null },
  relatedProjects: [],
};

/** UI boundary for the Project Detail screen. `slug` is the URL segment from the dynamic [slug] route and is passed to the query key and data source. */
export function useProject(slug: string): AsyncDataResult<ProjectData> {
  const query = useQuery<ProjectData, ApiClientError>({
    queryKey: queryKeys.project(slug),
    queryFn: ({ signal }) => fetchProjectData(slug, signal),
  });
  return mapQueryResult(query, EMPTY_PROJECT_DATA);
}
