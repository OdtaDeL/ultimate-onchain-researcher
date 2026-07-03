"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeArea, Section, StickyHeader } from "@/components/layout";
import { EmptyState, ErrorState, SearchBar, SegmentedControl, Skeleton } from "@/components/ui";
import { FundRowCard, PlatformRowCard, ProjectRowCard } from "@/components/features/markets";
import { RecentSearchList, TrendingSearchList } from "@/components/features/search";
import { useSearch } from "@/lib/api/hooks";
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

  const filteredProjects = data.projects;
  const filteredFunds = data.funds;
  const filteredPlatforms = data.platforms;

  const showProjects = activeTab === "all" || activeTab === "projects";
  const showFunds = activeTab === "all" || activeTab === "funds";
  const showPlatforms = activeTab === "all" || activeTab === "platforms";

  const totalResults = (showProjects ? filteredProjects.length : 0) + (showFunds ? filteredFunds.length : 0) + (showPlatforms ? filteredPlatforms.length : 0);

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
                {showProjects && filteredProjects.length > 0 ? (
                  <Section>
                    {activeTab === "all" ? <p className="px-4 pb-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Projects</p> : null}
                    <div className="flex flex-col gap-2 px-4">
                      {filteredProjects.map((project) => (
                        <ProjectRowCard key={project.slug ?? project.name} {...project} onPress={() => router.push(`/project/${project.slug ?? toSlug(project.name)}`)} />
                      ))}
                    </div>
                  </Section>
                ) : null}

                {showFunds && filteredFunds.length > 0 ? (
                  <Section>
                    {activeTab === "all" ? <p className="px-4 pb-2 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Funds</p> : null}
                    <div className="flex flex-col gap-2 px-4">
                      {filteredFunds.map((fund) => (
                        <FundRowCard key={fund.slug ?? fund.name} {...fund} onPress={() => router.push(`/fund/${fund.slug ?? toSlug(fund.name)}`)} />
                      ))}
                    </div>
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
