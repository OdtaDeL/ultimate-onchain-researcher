"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SafeArea, Section, StickyHeader } from "@/components/layout";
import { EmptyState, ErrorState, SearchBar, SegmentedControl, Skeleton } from "@/components/ui";
import { LoadMoreButton } from "@/components/shared";
import { FundRowCard, PlatformRowCard, ProjectRowCard } from "@/components/features/markets";
import { RecentSearchList, TrendingSearchList } from "@/components/features/search";
import { useSearch, fetchMoreSearchProjects, fetchMoreSearchFunds, type SearchProjectRow, type SearchFundRow } from "@/lib/api/hooks";
import { useRecentSearches, useSearchActions, useSearchActiveTab, useSearchQuery, type SearchResultTab } from "@/store";
import { toSlug } from "@/lib/utils";

const SKELETON_ROW_COUNT = 4;

const resultTabs: { value: SearchResultTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "projects", label: "Projects" },
  { value: "funds", label: "Funds" },
  { value: "platforms", label: "Platforms" },
];

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2 px-4">
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton variant="circle" className="size-9" />
          <Skeleton variant="line" className="flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const rawQuery = useSearchQuery();
  const activeTab = useSearchActiveTab();
  const recentSearches = useRecentSearches();
  const { setQuery, clearQuery, setActiveTab, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchActions();

  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);
  useEffect(() => {
    if (!rawQuery.trim()) {
      setDebouncedQuery("");
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(rawQuery), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const trimmedQuery = rawQuery.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isDebouncing = hasQuery && rawQuery !== debouncedQuery;
  const { data, loading, error, refresh } = useSearch(debouncedQuery);

  // Accumulated extra pages for project and fund results.
  const [extraProjects, setExtraProjects] = useState<SearchProjectRow[]>([]);
  const [nextProjectsPage, setNextProjectsPage] = useState<number | null>(null);
  const [isLoadingMoreProjects, setIsLoadingMoreProjects] = useState(false);

  const [extraFunds, setExtraFunds] = useState<SearchFundRow[]>([]);
  const [nextFundsPage, setNextFundsPage] = useState<number | null>(null);
  const [isLoadingMoreFunds, setIsLoadingMoreFunds] = useState(false);

  // Reset accumulated items whenever TanStack Query delivers fresh base data
  // (new query or manual refresh). `data` reference changes only when a new
  // fetch completes — including when the debouncedQuery key changes.
  useEffect(() => {
    setExtraProjects([]);
    setNextProjectsPage(data.projectsNextPage);
    setExtraFunds([]);
    setNextFundsPage(data.fundsNextPage);
  }, [data]);

  const loadMoreProjects = useCallback(async () => {
    if (!nextProjectsPage || isLoadingMoreProjects) return;
    setIsLoadingMoreProjects(true);
    try {
      const { rows, hasNextPage } = await fetchMoreSearchProjects(data.query, nextProjectsPage);
      setExtraProjects((prev) => [...prev, ...rows]);
      setNextProjectsPage(hasNextPage ? nextProjectsPage + 1 : null);
    } catch {
      // Swallow — button stays visible so user can retry.
    } finally {
      setIsLoadingMoreProjects(false);
    }
  }, [nextProjectsPage, isLoadingMoreProjects, data.query]);

  const loadMoreFunds = useCallback(async () => {
    if (!nextFundsPage || isLoadingMoreFunds) return;
    setIsLoadingMoreFunds(true);
    try {
      const { rows, hasNextPage } = await fetchMoreSearchFunds(data.query, nextFundsPage);
      setExtraFunds((prev) => [...prev, ...rows]);
      setNextFundsPage(hasNextPage ? nextFundsPage + 1 : null);
    } catch {
      // Swallow — button stays visible so user can retry.
    } finally {
      setIsLoadingMoreFunds(false);
    }
  }, [nextFundsPage, isLoadingMoreFunds, data.query]);

  const allProjects = [...data.projects, ...extraProjects];
  const allFunds = [...data.funds, ...extraFunds];
  const filteredPlatforms = data.platforms;

  const showProjects = activeTab === "all" || activeTab === "projects";
  const showFunds = activeTab === "all" || activeTab === "funds";
  const showPlatforms = activeTab === "all" || activeTab === "platforms";

  const totalResults = (showProjects ? allProjects.length : 0) + (showFunds ? allFunds.length : 0) + (showPlatforms ? filteredPlatforms.length : 0);

  return (
    <>
      <StickyHeader>
        <SafeArea edges={["top"]}>
          <div className="px-4 py-3">
            <SearchBar value={rawQuery} onChange={setQuery} onClear={clearQuery} onSubmit={() => { if (trimmedQuery) addRecentSearch(trimmedQuery); }} autoFocus />
          </div>
        </SafeArea>
      </StickyHeader>

      <SafeArea edges={["bottom"]} className="flex flex-col pb-8">
        {!hasQuery ? (
          <>
            <Section>
              <RecentSearchList items={recentSearches} onSelect={setQuery} onRemove={removeRecentSearch} onClearAll={clearRecentSearches} />
            </Section>
            <Section>
              <TrendingSearchList items={data.trendingSearches} onSelect={setQuery} />
            </Section>
          </>
        ) : (loading || isDebouncing) ? (
          <Section>
            <SkeletonRows />
          </Section>
        ) : error ? (
          <Section>
            <ErrorState variant="full" onRetry={refresh} />
          </Section>
        ) : (
          <>
            <Section className="px-4">
              <SegmentedControl options={resultTabs} value={activeTab} onChange={setActiveTab} />
            </Section>

            {totalResults === 0 ? (
              <Section>
                <EmptyState
                  variant="full"
                  title="No matches found"
                  description={`We couldn't find anything for "${trimmedQuery}". Try a different spelling or a broader term.`}
                  action={{ label: "Clear search", onClick: clearQuery }}
                />
              </Section>
            ) : (
              <>
                {showProjects && allProjects.length > 0 ? (
                  <Section>
                    {activeTab === "all" ? <p className="px-4 pb-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Projects</p> : null}
                    <div className="flex flex-col gap-2 px-4">
                      {allProjects.map((project) => (
                        <ProjectRowCard key={project.slug ?? project.name} {...project} onPress={() => router.push(`/project/${project.slug ?? toSlug(project.name)}`)} />
                      ))}
                    </div>
                    {activeTab === "projects" && (
                      <LoadMoreButton hasMore={nextProjectsPage !== null} isLoading={isLoadingMoreProjects} onLoadMore={loadMoreProjects} />
                    )}
                  </Section>
                ) : null}

                {showFunds && allFunds.length > 0 ? (
                  <Section>
                    {activeTab === "all" ? <p className="px-4 pb-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Funds</p> : null}
                    <div className="flex flex-col gap-2 px-4">
                      {allFunds.map((fund) => (
                        <FundRowCard key={fund.slug ?? fund.name} {...fund} onPress={() => router.push(`/fund/${fund.slug ?? toSlug(fund.name)}`)} />
                      ))}
                    </div>
                    {activeTab === "funds" && (
                      <LoadMoreButton hasMore={nextFundsPage !== null} isLoading={isLoadingMoreFunds} onLoadMore={loadMoreFunds} />
                    )}
                  </Section>
                ) : null}

                {showPlatforms && filteredPlatforms.length > 0 ? (
                  <Section>
                    {activeTab === "all" ? <p className="px-4 pb-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Platforms</p> : null}
                    <div className="flex flex-col gap-2 px-4">
                      {filteredPlatforms.map((platform) => (
                        <PlatformRowCard key={platform.protocol} {...platform} />
                      ))}
                    </div>
                  </Section>
                ) : null}
              </>
            )}
          </>
        )}
      </SafeArea>
    </>
  );
}
