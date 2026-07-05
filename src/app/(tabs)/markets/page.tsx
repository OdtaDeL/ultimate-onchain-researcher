"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SafeArea, Section, StickyHeader } from "@/components/layout";
import { EmptyState, ErrorState, PullToRefresh, SegmentedControl } from "@/components/ui";
import { LoadMoreButton } from "@/components/shared";
import { typography, duration, easing } from "@/lib/theme";
import { FundRowCard, ProjectRowCard } from "@/components/features/markets";
import { useMarkets, fetchMoreMarketProjects, type MarketProjectRow } from "@/lib/api/hooks";
import { useMarketsTab, useUiActions, type MarketsTab } from "@/store";
import { toSlug } from "@/lib/utils";

const SKELETON_ROW_COUNT = 6;

const marketsTabs: { value: MarketsTab; label: string }[] = [
  { value: "projects", label: "Projects" },
  { value: "funds", label: "Funds" },
];

interface MarketsHeaderProps {
  activeTab: MarketsTab;
  onTabChange: (tab: MarketsTab) => void;
}

/**
 * Sticky Top App Bar for Markets: title + search entry and the tab switcher.
 * Rendered as the first element of the page's own content (no `PageLayout`
 * of its own anymore — that now lives once in the `(tabs)` route group's
 * shared layout) so it sticks within that shared scroll container,
 * replicating PageLayout's own header recipe (`sticky top-0` + glass +
 * header z-index) exactly.
 */
function MarketsHeader({ activeTab, onTabChange }: MarketsHeaderProps) {
  const router = useRouter();

  return (
    <StickyHeader>
      <SafeArea edges={["top"]}>
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className={typography.heading.className}>Markets</h1>
          <button type="button" onClick={() => router.push("/search")} aria-label="Search" className="flex size-11 items-center justify-center text-foreground">
            <Search size={20} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <SegmentedControl options={marketsTabs} value={activeTab} onChange={onTabChange} />
        </div>
      </SafeArea>
    </StickyHeader>
  );
}

export default function MarketsPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useMarkets();
  const activeTab = useMarketsTab();
  const { setMarketsTab } = useUiActions();

  // Accumulated extra pages for the Projects tab.
  const [extraProjects, setExtraProjects] = useState<MarketProjectRow[]>([]);
  const [nextProjectsPage, setNextProjectsPage] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset accumulated items whenever TanStack Query delivers fresh base data
  // (initial load or pull-to-refresh). `data` reference changes only when a
  // new fetch completes, so this effect runs at the right moments.
  useEffect(() => {
    setExtraProjects([]);
    setNextProjectsPage(data.projectsNextPage);
  }, [data]);

  const loadMoreProjects = useCallback(async () => {
    if (!nextProjectsPage || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { rows, hasNextPage } = await fetchMoreMarketProjects(nextProjectsPage);
      setExtraProjects((prev) => [...prev, ...rows]);
      setNextProjectsPage(hasNextPage ? nextProjectsPage + 1 : null);
    } catch {
      // Swallow — the button remains visible so the user can retry.
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextProjectsPage, isLoadingMore]);

  const allProjects = [...data.projects, ...extraProjects];

  return (
    <>
      <MarketsHeader activeTab={activeTab} onTabChange={setMarketsTab} />
      <SafeArea edges={["bottom"]} className="flex flex-col pb-8">
        <PullToRefresh onRefresh={refresh} isRefreshing={loading} />

        {error ? (
          <Section>
            <ErrorState variant="full" onRetry={refresh} />
          </Section>
        ) : (
        <Section>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: duration.quick.s, ease: easing.easeOut }}
              className="flex flex-col gap-2 px-4"
            >
              {loading ? (
                Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) =>
                  activeTab === "projects" ? (
                    <ProjectRowCard key={i} name="" score={0} grade="C" tvl={0} marketCap={0} changePercent24h={0} isLoading />
                  ) : (
                    <FundRowCard key={i} name="" portfolioProjectCount={0} recentInvestmentCount={0} isLoading />
                  ),
                )
              ) : activeTab === "projects" ? (
                allProjects.length === 0 ? (
                  <EmptyState variant="section" description="No ranked projects this week." />
                ) : (
                  <>
                    {allProjects.map((project) => <ProjectRowCard key={project.slug ?? project.name} {...project} onPress={() => router.push(`/project/${project.slug ?? toSlug(project.name)}`)} />)}
                    <LoadMoreButton hasMore={nextProjectsPage !== null} isLoading={isLoadingMore} onLoadMore={loadMoreProjects} />
                  </>
                )
              ) : data.funds.length === 0 ? (
                <EmptyState variant="section" description="No funds match these filters." />
              ) : (
                data.funds.map((fund) => <FundRowCard key={fund.slug ?? fund.name} {...fund} onPress={() => router.push(`/fund/${fund.slug ?? toSlug(fund.name)}`)} />)
              )}
            </motion.div>
          </AnimatePresence>
        </Section>
        )}
      </SafeArea>
    </>
  );
}
