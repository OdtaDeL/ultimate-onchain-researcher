"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SafeArea, Section, StickyHeader } from "@/components/layout";
import { EmptyState, ErrorState, FilterBar, PullToRefresh, SegmentedControl } from "@/components/ui";
import { typography, duration, easing } from "@/lib/theme";
import { FundRowCard, PlatformRowCard, ProjectRowCard } from "@/components/features/markets";
import { mockMarketsFilters } from "@/components/features/markets/mock-data";
import { useMarkets } from "@/lib/api/hooks";
import { useMarketsTab, useUiActions, type MarketsTab } from "@/store";
import { toSlug } from "@/lib/utils";

const SKELETON_ROW_COUNT = 6;

const marketsTabs: { value: MarketsTab; label: string }[] = [
  { value: "projects", label: "Projects" },
  { value: "funds", label: "Funds" },
  { value: "platforms", label: "Platforms" },
];

interface MarketsHeaderProps {
  activeTab: MarketsTab;
  onTabChange: (tab: MarketsTab) => void;
}

/**
 * Sticky Top App Bar for Markets: title + search entry, the tab switcher,
 * and the filter row. Rendered as the first element of the page's own
 * content (no `PageLayout` of its own anymore — that now lives once in
 * the `(tabs)` route group's shared layout) so it sticks within that
 * shared scroll container, replicating PageLayout's own header recipe
 * (`sticky top-0` + glass + header z-index) exactly.
 */
function MarketsHeader({ activeTab, onTabChange }: MarketsHeaderProps) {
  const router = useRouter();
  const { setActiveFilterKey } = useUiActions();

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

        <FilterBar filters={mockMarketsFilters} onFilterPress={setActiveFilterKey} className="pb-3" />
      </SafeArea>
    </StickyHeader>
  );
}

export default function MarketsPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useMarkets();
  const activeTab = useMarketsTab();
  const { setMarketsTab } = useUiActions();

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
                  ) : activeTab === "funds" ? (
                    <FundRowCard key={i} name="" portfolioProjectCount={0} recentInvestmentCount={0} isLoading />
                  ) : (
                    <PlatformRowCard key={i} protocol="" tvl={0} revenue={0} fees={0} isLoading />
                  ),
                )
              ) : activeTab === "projects" ? (
                data.projects.length === 0 ? (
                  <EmptyState variant="section" description="No ranked projects this week." />
                ) : (
                  data.projects.map((project) => <ProjectRowCard key={project.slug ?? project.name} {...project} onPress={() => router.push(`/project/${project.slug ?? toSlug(project.name)}`)} />)
                )
              ) : activeTab === "funds" ? (
                data.funds.length === 0 ? (
                  <EmptyState variant="section" description="No funds match these filters." />
                ) : (
                  data.funds.map((fund) => <FundRowCard key={fund.slug ?? fund.name} {...fund} onPress={() => router.push(`/fund/${fund.slug ?? toSlug(fund.name)}`)} />)
                )
              ) : data.platforms.length === 0 ? (
                <EmptyState variant="section" description="No platforms match these filters." />
              ) : (
                data.platforms.map((platform) => (
                  <PlatformRowCard key={platform.protocol} {...platform} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </Section>
        )}
      </SafeArea>
    </>
  );
}
