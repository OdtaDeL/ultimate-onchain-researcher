"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, ArrowLeft, AtSign, Bookmark, DollarSign, ExternalLink, Layers, Milestone, Star } from "lucide-react";
import { PageLayout, SafeArea, Section, SectionHeader } from "@/components/layout";
import { EmptyState, ErrorState, InsightCard, Pill, Skeleton, StatGrid } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { typography } from "@/lib/theme";
import { cn, toSlug } from "@/lib/utils";
import { InvestmentRow } from "@/components/features/fund-detail";
import { useFund } from "@/lib/api/hooks";
import { useIsWatchlisted, useWatchlistActions, useIsFavorited, useFavoritesActions } from "@/store";

const PORTFOLIO_PREVIEW_COUNT = 4;

const insightIcon: Record<string, typeof Activity> = {
  "most-active": Activity,
  largest: DollarSign,
  "favorite-sector": Layers,
  "average-stage": Milestone,
};

function openExternalUrl(url: string): void {
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function FundDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { data, loading: isLoading, error, refresh } = useFund(slug);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);

  const { fund, topSectors, topChains, insights: fundInsights, portfolio, recentInvestments } = data;

  const isWatchlisted = useIsWatchlisted("fund", fund.name);
  const { toggle } = useWatchlistActions();
  const isFavorited = useIsFavorited("fund", fund.name);
  const { toggle: toggleFavorite } = useFavoritesActions();

  const visiblePortfolio = portfolioExpanded ? portfolio : portfolio.slice(0, PORTFOLIO_PREVIEW_COUNT);
  const hasMorePortfolio = portfolio.length > PORTFOLIO_PREVIEW_COUNT;

  return (
    <PageLayout
      header={
        <SafeArea edges={["top"]}>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <button type="button" onClick={() => router.back()} aria-label="Back" className="flex size-11 shrink-0 items-center justify-center text-foreground">
              <ArrowLeft size={20} />
              </button>
              <span className="line-clamp-1 flex-1 text-center text-[17px] font-semibold leading-[22px] text-foreground">{fund.name}</span>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => toggleFavorite({ id: fund.name, kind: "fund", name: fund.name, slug: fund.slug })}
                  aria-label={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  aria-pressed={isFavorited}
                  className="flex size-11 items-center justify-center text-foreground"
                >
                  <Bookmark size={20} className={cn(isFavorited ? "fill-accent text-accent" : "text-foreground")} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle({ id: fund.name, kind: "fund", name: fund.name, slug: fund.slug })}
                  aria-label={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                  aria-pressed={isWatchlisted}
                  className="flex size-11 items-center justify-center text-foreground"
                >
                  <Star size={20} className={cn(isWatchlisted ? "fill-accent text-accent" : "text-foreground")} />
                </button>
              </div>
            </div>
          </SafeArea>
        }
      >
        <SafeArea edges={["bottom"]} className="flex flex-col pb-8">
          {error ? (
            <ErrorState variant="full" onRetry={refresh} />
          ) : (<>
          {/* Hero — fund logo, name, website/twitter. No Score, no token-market framing anywhere on this screen (DESIGN_SYSTEM Rule 16: Funds never show a Score). */}
          <Section className="flex flex-col items-center gap-2 px-4 text-center">
            {isLoading ? (
              <>
                <Skeleton variant="circle" className="size-14" />
                <Skeleton variant="line" className="mt-2 w-32" />
              </>
            ) : (
              <>
                <CoinIcon src={fund.logoUrl} symbol={fund.name} size="lg" />
                <h1 className={cn(typography.heading.className, "line-clamp-1 max-w-full")}>{fund.name}</h1>
                {(fund.website || fund.twitterHandle) ? (
                  <div className="flex items-center gap-2">
                    {fund.website ? (
                      <button
                        type="button"
                        onClick={() => { if (fund.website) openExternalUrl(fund.website); }}
                        className="flex min-h-11 items-center gap-1.5 rounded-[12px] bg-surface-elevated px-3 text-[13px] font-medium leading-[18px] tracking-[0.1px] text-foreground"
                      >
                        <ExternalLink size={14} />
                        {fund.website}
                      </button>
                    ) : null}
                    {fund.twitterHandle ? (
                      <button
                        type="button"
                        onClick={() => { if (fund.twitterHandle) openExternalUrl(`https://x.com/${fund.twitterHandle}`); }}
                        className="flex min-h-11 items-center gap-1.5 rounded-[12px] bg-surface-elevated px-3 text-[13px] font-medium leading-[18px] tracking-[0.1px] text-foreground"
                      >
                        <AtSign size={14} />
                        {fund.twitterHandle}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </Section>

          {/* Summary */}
          <Section className="px-4">
            <SectionHeader title="Summary" />
            {isLoading ? (
              <StatGrid isLoading stats={[{ label: "", value: "" }, { label: "", value: "" }]} />
            ) : (
              <StatGrid
                stats={[
                  { label: "Portfolio Size", value: fund.portfolioSize !== null ? fund.portfolioSize : "—" },
                  { label: "Last Investment", value: fund.lastInvestmentLabel },
                ]}
              />
            )}
          </Section>

          {/* Portfolio — emphasizes the investment (round/date/amount), not token-market metrics. Truncated preview with expand/collapse rather than always rendering the full unbounded list. */}
          <Section>
            <SectionHeader title="Portfolio" />
            {!isLoading && portfolio.length === 0 ? (
              <EmptyState variant="section" description="No portfolio projects recorded yet." className="px-4" />
            ) : (
              <>
                <div className="flex flex-col gap-2 px-4">
                  {isLoading
                    ? Array.from({ length: PORTFOLIO_PREVIEW_COUNT }).map((_, i) => (
                        <InvestmentRow key={i} projectName="" round="" dateLabel="" isLoading />
                      ))
                    : visiblePortfolio.map(({ projectSlug, ...item }) => <InvestmentRow key={item.projectName} {...item} onPress={() => router.push(`/project/${projectSlug ?? toSlug(item.projectName)}`)} />)}
                </div>
                {!isLoading && hasMorePortfolio ? (
                  <button
                    type="button"
                    onClick={() => setPortfolioExpanded((v) => !v)}
                    className="mt-2 flex min-h-11 w-full items-center justify-center text-[15px] font-semibold leading-5 text-accent"
                  >
                    {portfolioExpanded ? "Show less" : `Show all (${portfolio.length})`}
                  </button>
                ) : null}
              </>
            )}
          </Section>

          {/* Recent Investments — vertical timeline, newest first. */}
          <Section>
            <SectionHeader title="Recent Investments" />
            {!isLoading && recentInvestments.length === 0 ? (
              <EmptyState variant="section" description="No recent investments yet." className="px-4" />
            ) : (
              <div className="flex flex-col px-4">
                {isLoading
                  ? [0, 1, 2].map((i) => <InvestmentRow key={i} projectName="" round="" dateLabel="" variant="timeline" isLoading isLast={i === 2} />)
                  : recentInvestments.map(({ projectSlug, ...item }, index) => (
                      <InvestmentRow
                        key={item.projectName + item.dateLabel}
                        {...item}
                        variant="timeline"
                        isLast={index === recentInvestments.length - 1}
                        onPress={() => router.push(`/project/${projectSlug ?? toSlug(item.projectName)}`)}
                      />
                    ))}
              </div>
            )}
          </Section>

          {/* Top Sectors — Tag-style neutral labels, never color-coded by category (DESIGN_SYSTEM Rule 17). */}
          <Section className="px-4">
            <SectionHeader title="Top Sectors" />
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="line" className="h-7 w-16" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topSectors.map((sector) => (
                  <Pill key={sector} variant="neutral">
                    {sector}
                  </Pill>
                ))}
              </div>
            )}
          </Section>

          {/* Top Chains — only rendered when data is available; always [] until chain schema is added */}
          {!isLoading && topChains.length > 0 ? (
            <Section className="px-4">
              <SectionHeader title="Top Chains" />
              <div className="flex flex-wrap gap-2">
                {topChains.map((chain) => (
                  <Pill key={chain} variant="neutral">
                    {chain}
                  </Pill>
                ))}
              </div>
            </Section>
          ) : null}

          {/* Insights */}
          <Section className="px-4">
            <SectionHeader title="Insights" />
            <div className="grid grid-cols-2 gap-3">
              {fundInsights.map((insight) => {
                const Icon = insightIcon[insight.key] ?? Activity;
                return <InsightCard key={insight.key} icon={<Icon size={14} />} label={insight.label} value={insight.value} isLoading={isLoading} />;
              })}
            </div>
          </Section>
          </>)}
        </SafeArea>
      </PageLayout>
  );
}
