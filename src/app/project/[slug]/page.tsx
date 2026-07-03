"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AtSign, Bookmark, ExternalLink, Star } from "lucide-react";
import { PageLayout, SafeArea, Section, SectionHeader } from "@/components/layout";
import { Accordion, Card, Divider, EmptyState, ErrorState, Pill, ProgressBar, Skeleton, StatGrid } from "@/components/ui";
import { CoinIcon, NumberFormatter, Percentage, PriceFormatter, ScoreCircle } from "@/components/shared";
import { TrendingSection, UnlockAlertCard } from "@/components/features/home";
import { FundingRoundRow } from "@/components/features/project-detail";
import { useProject } from "@/lib/api/hooks";
import { useIsWatchlisted, useWatchlistActions, useIsFavorited, useFavoritesActions } from "@/store";
import { cn, toSlug } from "@/lib/utils";
import { radius, scoreGradeColor, typography } from "@/lib/theme";

function openExternalUrl(url: string): void {
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { data, loading: isLoading, error, refresh } = useProject(slug);

  const { project, fundingRounds, nextUnlock, relatedProjects, scoreCategories } = data;

  const isWatchlisted = useIsWatchlisted("project", project.name);
  const { toggle } = useWatchlistActions();
  const isFavorited = useIsFavorited("project", project.name);
  const { toggle: toggleFavorite } = useFavoritesActions();

  const overallCategory = scoreCategories.find((c) => c.key === "overall");
  const subCategories = scoreCategories.filter((c) => c.key !== "overall");

  return (
    <PageLayout
      header={
        <SafeArea edges={["top"]}>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <button type="button" onClick={() => router.back()} aria-label="Back" className="flex size-11 shrink-0 items-center justify-center text-foreground">
              <ArrowLeft size={20} />
              </button>
              <span className="line-clamp-1 flex-1 text-center text-[17px] font-semibold leading-[22px] text-foreground">{project.name}</span>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => toggleFavorite({ id: project.name, kind: "project", name: project.name, slug: project.slug })}
                  aria-label={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  aria-pressed={isFavorited}
                  className="flex size-11 items-center justify-center text-foreground"
                >
                  <Bookmark size={20} className={cn(isFavorited ? "fill-accent text-accent" : "text-foreground")} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle({ id: project.name, kind: "project", name: project.name, slug: project.slug })}
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
          {/* Hero */}
          <Section className="flex flex-col items-center gap-2 px-4 text-center">
            {isLoading ? (
              <>
                <Skeleton variant="circle" className="size-14" />
                <Skeleton variant="line" className="mt-2 w-32" />
                <Skeleton variant="line" className="w-20" />
              </>
            ) : (
              <>
                <CoinIcon src={project.logoUrl} symbol={project.name} size="lg" />
                <h1 className={cn(typography.heading.className, "line-clamp-1 max-w-full")}>{project.name}</h1>
                {project.category ? (
                  <div className="flex items-center gap-2">
                    <Pill variant="neutral">{project.category}</Pill>
                  </div>
                ) : null}
                {(project.website || project.twitter) ? (
                  <div className="flex items-center gap-2">
                    {project.website ? (
                      <button
                        type="button"
                        onClick={() => { if (project.website) openExternalUrl(project.website); }}
                        className="flex min-h-11 items-center gap-1.5 rounded-[12px] bg-surface-elevated px-3 text-[13px] font-medium leading-[18px] tracking-[0.1px] text-foreground"
                      >
                        <ExternalLink size={14} />
                        {project.website}
                      </button>
                    ) : null}
                    {project.twitter ? (
                      <button
                        type="button"
                        onClick={() => { if (project.twitter) openExternalUrl(`https://x.com/${project.twitter}`); }}
                        className="flex min-h-11 items-center gap-1.5 rounded-[12px] bg-surface-elevated px-3 text-[13px] font-medium leading-[18px] tracking-[0.1px] text-foreground"
                      >
                        <AtSign size={14} />
                        {project.twitter}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </Section>

          {/* Summary — Score Card (Full), per DESIGN_SYSTEM "exactly once per entity, first content element after Hero." Reuses ScoreCircle as-is, no second implementation. */}
          <Section className="px-4">
            <Card className={cn(radius.xl, "bg-surface-elevated p-4")}>
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Skeleton variant="circle" className="size-[88px]" />
                  <Skeleton variant="line" className="w-16" />
                </div>
              ) : project.score !== null && project.grade !== null ? (
                <>
                  <div className="flex justify-center">
                    <ScoreCircle score={project.score} grade={project.grade} size="full" />
                  </div>
                  <Divider variant="full" className="my-4" />
                  <StatGrid
                    stats={[
                      {
                        label: "Market Cap",
                        value: project.marketCap !== null ? <>$<NumberFormatter value={project.marketCap} /></> : "—",
                      },
                      {
                        label: "FDV",
                        value: project.fdv !== null ? <>$<NumberFormatter value={project.fdv} /></> : "—",
                      },
                      {
                        label: "TVL",
                        value: project.tvl !== null ? <>$<NumberFormatter value={project.tvl} /></> : "—",
                      },
                      {
                        label: "24h Change",
                        value: project.changePercent24h !== null
                          ? <Percentage value={project.changePercent24h} className="text-[17px] font-semibold tracking-[-0.1px]" />
                          : "—",
                      },
                    ]}
                  />
                </>
              ) : (
                <EmptyState variant="section" description="Score not available yet." />
              )}
            </Card>
          </Section>

          {/* Scoring Breakdown — only rendered when score data exists. */}
          {project.score !== null && project.grade !== null && scoreCategories.length > 0 ? (
            <Section className="px-4">
              <Accordion
                title="Scoring Breakdown"
                trailing={overallCategory && project.grade !== null ? <Pill variant="neutral" className={scoreGradeColor[project.grade].text}>{project.grade}</Pill> : null}
              >
                <div className="flex flex-col gap-3 pb-3">
                  {[...subCategories, ...(overallCategory ? [overallCategory] : [])].map((category) => (
                    <div key={category.key}>
                      <div className="flex items-center justify-between text-[15px] font-medium leading-5 text-foreground">
                        <span>{category.label}</span>
                        <span className="tabular-nums text-muted-foreground">{category.score}</span>
                      </div>
                      <ProgressBar
                        value={category.score}
                        className="mt-1.5"
                        fillClassName={category.key === "overall" && project.grade !== null ? scoreGradeColor[project.grade].bg : "bg-accent"}
                      />
                    </div>
                  ))}
                </div>
              </Accordion>
            </Section>
          ) : null}

          {/* Funding — timeline of rounds. */}
          <Section className="px-4">
            <SectionHeader title="Funding" />
            {!isLoading && fundingRounds.length === 0 ? (
              <EmptyState variant="section" description="No funding rounds recorded yet." />
            ) : (
              <Card>
                {isLoading
                  ? [0, 1].map((i) => <FundingRoundRow key={i} round="" dateLabel="" amountUsd={null} isLoading isLast={i === 1} />)
                  : fundingRounds.map((round, index) => (
                      <FundingRoundRow key={round.round + round.dateLabel} {...round} isLast={index === fundingRounds.length - 1} />
                    ))}
              </Card>
            )}
          </Section>

          {/* Unlocks — reuses UnlockAlertCard. riskLevel is intentionally absent: no backend-authoritative threshold exists. */}
          <Section className="px-4">
            <SectionHeader title="Next Unlock" />
            <UnlockAlertCard
              name={project.name}
              logoUrl={project.logoUrl}
              dateLabel={nextUnlock.dateLabel}
              percentOfSupply={nextUnlock.percentOfSupply}
              isLoading={isLoading}
            />
          </Section>

          {/* Market Metrics */}
          <Section className="px-4">
            <SectionHeader title="Market Metrics" />
            <StatGrid
              isLoading={isLoading}
              stats={[
                {
                  label: "Market Cap",
                  value: project.marketCap !== null ? <>$<NumberFormatter value={project.marketCap} /></> : "—",
                },
                {
                  label: "FDV",
                  value: project.fdv !== null ? <>$<NumberFormatter value={project.fdv} /></> : "—",
                },
                {
                  label: "Volume (24h)",
                  value: project.volume24h !== null ? <>$<NumberFormatter value={project.volume24h} /></> : "—",
                },
                {
                  label: "TVL",
                  value: project.tvl !== null ? <>$<NumberFormatter value={project.tvl} /></> : "—",
                },
              ]}
            />
          </Section>

          {/* Tokenomics */}
          <Section className="px-4">
            <SectionHeader title="Tokenomics" />
            <StatGrid
              isLoading={isLoading}
              stats={[
                { label: "Circulating Supply", value: project.circulatingSupply !== null ? <NumberFormatter value={project.circulatingSupply} /> : "—" },
                { label: "Total Supply", value: project.totalSupply !== null ? <NumberFormatter value={project.totalSupply} /> : "—" },
                { label: "ATH", value: project.athPrice !== null ? <PriceFormatter value={project.athPrice} /> : "—" },
                { label: "ATL", value: project.atlPrice !== null ? <PriceFormatter value={project.atlPrice} /> : "—" },
              ]}
            />
          </Section>

          {/* Related Projects — reuses TrendingSection's existing Mini-card carousel rather than a new component. */}
          <Section>
            {relatedProjects.length === 0 ? (
              <>
                <SectionHeader title="Related Projects" />
                <EmptyState variant="section" description="No related projects yet." className="px-4" />
              </>
            ) : (
              <TrendingSection
                title="Related Projects"
                items={relatedProjects.map((item) => ({ ...item, onPress: () => router.push(`/project/${toSlug(item.name)}`) }))}
                isLoading={isLoading}
              />
            )}
          </Section>
          </>)}
        </SafeArea>
      </PageLayout>
  );
}
