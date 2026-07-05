"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Section, SectionHeader, SafeArea } from "@/components/layout";
import { EmptyState, ErrorState, HorizontalScroller, PullToRefresh, SegmentedControl } from "@/components/ui";
import { duration, easing } from "@/lib/theme";
import {
  FearGreedCard,
  MarketOverviewCard,
  RecentFundraiseCard,
  RecentlyAddedCard,
  TopGainerCard,
  TrendingSection,
  UnlockAlertCard,
  WatchlistSummaryCard,
  WeeklyPickCard,
} from "@/components/features/home";
import type { TrendingItem } from "@/components/features/home";
import { useHome } from "@/lib/api/hooks";
import { useSetTrendingTab, useTrendingTab, useUiActions, useWatchlistEntities, type TrendingTab } from "@/store";
import { toSlug } from "@/lib/utils";

const trendingTabs: { value: TrendingTab; label: string }[] = [
  { value: "projects", label: "Projects" },
  { value: "funds", label: "Funds" },
];

// Skeleton placeholder counts — these cards fully replace their content
// with a skeleton when `isLoading` is true (ignoring all other props), so
// while data hasn't arrived yet we just need an array of the right length.
const WEEKLY_PICKS_SKELETON_COUNT = 2;
const MONTHLY_PICKS_SKELETON_COUNT = 2;
const TOP_GAINERS_SKELETON_COUNT = 5;
const RECENTLY_ADDED_SKELETON_COUNT = 3;
const RECENT_FUNDRAISES_SKELETON_COUNT = 3;
const UNLOCK_ALERTS_SKELETON_COUNT = 3;

export default function HomePage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useHome();
  const trendingTab = useTrendingTab();
  const setTrendingTab = useSetTrendingTab();
  const { setMarketsTab } = useUiActions();

  // Trending items don't carry navigation in the data layer — wire it here per tab.
  const trendingItemsByTab: Record<TrendingTab, TrendingItem[]> = useMemo(
    () => ({
      projects: data.trendingProjects.map((item) => ({ ...item, onPress: () => router.push(`/project/${toSlug(item.name)}`) })),
      funds: data.trendingFunds.map((item) => ({ ...item, onPress: () => router.push(`/fund/${toSlug(item.name)}`) })),
    }),
    [router, data.trendingProjects, data.trendingFunds],
  );

  const watchlistEntities = useWatchlistEntities();
  const watchlistEntries = Object.values(watchlistEntities).slice(0, 3);

  const weeklyPicks = loading ? Array.from({ length: WEEKLY_PICKS_SKELETON_COUNT }) : data.weeklyPicks;
  const monthlyPicks = loading ? Array.from({ length: MONTHLY_PICKS_SKELETON_COUNT }) : data.monthlyPicks;
  const topGainers = loading ? Array.from({ length: TOP_GAINERS_SKELETON_COUNT }) : data.topGainers;
  const recentlyAdded = loading ? Array.from({ length: RECENTLY_ADDED_SKELETON_COUNT }) : data.recentlyAdded;
  const recentFundraises = loading ? Array.from({ length: RECENT_FUNDRAISES_SKELETON_COUNT }) : data.recentFundraises;
  const unlockAlerts = loading ? Array.from({ length: UNLOCK_ALERTS_SKELETON_COUNT }) : data.unlockAlerts;

  if (error) {
    return (
      <SafeArea edges={["top", "bottom"]} className="flex flex-col pb-8">
        <h1 className="sr-only">Home</h1>
        <ErrorState variant="full" onRetry={refresh} />
      </SafeArea>
    );
  }

  return (
    <SafeArea edges={["top", "bottom"]} className="flex flex-col pb-8">
      {/* Visually hidden — Home's header is the Greeting/search-only variant with no visible title (DESIGN_SYSTEM Section 10), but the page still needs exactly one h1 for screen-reader/heading-hierarchy correctness. */}
      <h1 className="sr-only">Home</h1>
      <PullToRefresh onRefresh={refresh} isRefreshing={loading} />

      {/* 1. Market Overview */}
      <Section className="px-4">
        <MarketOverviewCard {...data.marketOverview} isLoading={loading} />
      </Section>

      {/* 2. Fear & Greed */}
      <Section className="px-4">
        <FearGreedCard {...data.fearGreed} isLoading={loading} />
      </Section>

      {/* 3. Trending — one unified section, tab-switched rather than three stacked carousels. */}
      <Section>
        <SectionHeader
          title="Trending"
          action={{
            label: "See all",
            onClick: () => { setMarketsTab(trendingTab); router.push("/markets"); },
          }}
        />
        <div className="mb-3 px-4">
          <SegmentedControl options={trendingTabs} value={trendingTab} onChange={setTrendingTab} />
        </div>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={trendingTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: duration.quick.s, ease: easing.easeOut }}
            >
              <TrendingSection title="" hideHeader items={trendingItemsByTab[trendingTab]} isLoading={loading} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Section>

      {/* 4. Weekly Picks */}
      <Section>
        <SectionHeader title="Weekly Picks" />
        <HorizontalScroller snap>
          {weeklyPicks.map((pick, index) => (
            <WeeklyPickCard
              key={loading ? index : (pick as (typeof data.weeklyPicks)[number]).name}
              {...(loading ? { name: "", score: 0, grade: "C", fundingQuality: "moderate", tvlChangePercent: 0, unlockRiskLevel: "low", unlockRiskLabel: "" } : (pick as (typeof data.weeklyPicks)[number]))}
              isLoading={loading}
              onPress={() => { if (!loading) { const p = pick as (typeof data.weeklyPicks)[number]; router.push(`/project/${p.slug ?? toSlug(p.name)}`); } }}
            />
          ))}
        </HorizontalScroller>
      </Section>

      {/* 5. Monthly Picks */}
      <Section>
        <SectionHeader title="Monthly Picks" />
        <HorizontalScroller snap>
          {monthlyPicks.map((pick, index) => (
            <WeeklyPickCard
              key={loading ? index : (pick as (typeof data.monthlyPicks)[number]).name}
              {...(loading ? { name: "", score: 0, grade: "C", fundingQuality: "moderate", tvlChangePercent: 0, unlockRiskLevel: "low", unlockRiskLabel: "" } : (pick as (typeof data.monthlyPicks)[number]))}
              isLoading={loading}
              onPress={() => { if (!loading) { const p = pick as (typeof data.monthlyPicks)[number]; router.push(`/project/${p.slug ?? toSlug(p.name)}`); } }}
            />
          ))}
        </HorizontalScroller>
      </Section>

      {/* 6. Watchlist Summary — reads from the Zustand store (device-local, synchronous). Hidden entirely when empty: a new user's Home should not surface what they haven't done yet (DESIGN_SYSTEM decision). No loading skeleton: store data is available immediately from localStorage. */}
      {watchlistEntries.length > 0 ? (
        <Section>
          <SectionHeader title="Watchlist" action={{ label: "Manage", onClick: () => router.push("/watchlist") }} />
          <div className="flex flex-col gap-2 px-4">
            {watchlistEntries.map((entity) => (
              <WatchlistSummaryCard
                key={`${entity.kind}:${entity.id}`}
                kind={entity.kind}
                name={entity.name}
                onPress={() => router.push(entity.kind === "fund" ? `/fund/${entity.slug ?? toSlug(entity.name)}` : `/project/${entity.slug ?? toSlug(entity.name)}`)}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* 7. Top Gainers */}
      <Section>
        <SectionHeader title="Top Gainers" />
        {!loading && data.topGainers.length === 0 ? (
          <EmptyState variant="section" description="No significant gainers today." className="px-4" />
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {topGainers.map((gainer, index) => (
              <TopGainerCard
                key={loading ? index : (gainer as (typeof data.topGainers)[number]).rank}
                rank={index + 1}
                name={loading ? "" : (gainer as (typeof data.topGainers)[number]).name}
                changePercent={loading ? 0 : (gainer as (typeof data.topGainers)[number]).changePercent}
                isLoading={loading}
                onPress={loading ? undefined : () => router.push(`/project/${toSlug((gainer as (typeof data.topGainers)[number]).name)}`)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* 8. Recently Added */}
      <Section>
        <SectionHeader title="Recently Added" />
        {!loading && data.recentlyAdded.length === 0 ? (
          <EmptyState variant="section" description="No new additions this week." className="px-4" />
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {recentlyAdded.map((item, index) => (
              <RecentlyAddedCard
                key={loading ? index : (item as (typeof data.recentlyAdded)[number]).name}
                {...(loading ? { name: "", addedLabel: "" } : (item as (typeof data.recentlyAdded)[number]))}
                isLoading={loading}
                onPress={() => { if (!loading) router.push(`/project/${toSlug((item as (typeof data.recentlyAdded)[number]).name)}`); }}
              />
            ))}
          </div>
        )}
      </Section>

      {/* 9. Recent Fundraises */}
      <Section>
        <SectionHeader title="Recent Fundraises" />
        {!loading && data.recentFundraises.length === 0 ? (
          <EmptyState variant="section" description="No new fundraises this week." className="px-4" />
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {recentFundraises.map((item, index) => (
              <RecentFundraiseCard
                key={loading ? index : (item as (typeof data.recentFundraises)[number]).name}
                {...(loading ? { name: "", amountUsd: 0, announcedLabel: "", investorNames: [] } : (item as (typeof data.recentFundraises)[number]))}
                isLoading={loading}
                onPress={() => { if (!loading) { const f = item as (typeof data.recentFundraises)[number]; router.push(`/project/${f.slug ?? toSlug(f.name)}`); } }}
              />
            ))}
          </div>
        )}
      </Section>

      {/* 10. Unlock Alerts */}
      <Section>
        <SectionHeader title="Unlock Alerts" />
        {!loading && data.unlockAlerts.length === 0 ? (
          <EmptyState variant="section" description="No unlocks in the next 14 days." className="px-4" />
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {unlockAlerts.map((item, index) => (
              <UnlockAlertCard
                key={loading ? index : (item as (typeof data.unlockAlerts)[number]).name}
                {...(loading ? { name: "", dateLabel: "", percentOfSupply: null } : (item as (typeof data.unlockAlerts)[number]))}
                isLoading={loading}
                onPress={() => { if (!loading) { const a = item as (typeof data.unlockAlerts)[number]; router.push(`/project/${a.slug ?? toSlug(a.name)}`); } }}
              />
            ))}
          </div>
        )}
      </Section>
    </SafeArea>
  );
}
