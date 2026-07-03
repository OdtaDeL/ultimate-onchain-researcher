"use client";

import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { SafeArea, Section, SectionHeader, StickyHeader } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { typography } from "@/lib/theme";
import { useWatchlistEntities, useWatchlistActions } from "@/store";
import { toSlug } from "@/lib/utils";
import type { CollectibleEntity } from "@/store/lib/create-entity-collection-store";

function WatchlistRow({
  entity,
  onNavigate,
  onRemove,
}: {
  entity: CollectibleEntity;
  onNavigate: () => void;
  onRemove: () => void;
}) {
  return (
    <Card pressable variant="compact" onClick={onNavigate} className="flex items-center gap-3">
      <CoinIcon symbol={entity.name} size="md" />
      <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">
        {entity.name}
      </span>
      <button
        type="button"
        aria-label={`Remove ${entity.name} from watchlist`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex size-9 shrink-0 items-center justify-center text-muted-foreground"
      >
        <Trash2 size={16} />
      </button>
    </Card>
  );
}

export default function WatchlistPage() {
  const router = useRouter();
  const entities = useWatchlistEntities();
  const { remove } = useWatchlistActions();

  const entries = Object.entries(entities);
  const projects = entries.filter(([, e]) => e.kind === "project");
  const funds = entries.filter(([, e]) => e.kind === "fund");
  const isEmpty = entries.length === 0;

  return (
    <>
      <StickyHeader>
        <SafeArea edges={["top"]}>
          <div className="px-4 py-3">
            <h1 className={typography.heading.className}>Watchlist</h1>
          </div>
        </SafeArea>
      </StickyHeader>

      <SafeArea edges={["bottom"]} className="flex flex-1 flex-col pb-8">
        {isEmpty ? (
          <Section className="flex flex-1 flex-col px-4">
            <EmptyState
              variant="full"
              icon={<Star size={40} />}
              title="Your Watchlist is empty"
              description="Save projects and funds you're researching to find them here."
              action={{ label: "Browse Markets", onClick: () => router.push("/markets") }}
            />
          </Section>
        ) : (
          <>
            {projects.length > 0 ? (
              <Section className="px-4">
                <SectionHeader title="Projects" />
                <div className="flex flex-col gap-2">
                  {projects.map(([key, entity]) => (
                    <WatchlistRow
                      key={key}
                      entity={entity}
                      onNavigate={() => router.push(`/project/${entity.slug ?? toSlug(entity.name)}`)}
                      onRemove={() => remove(key)}
                    />
                  ))}
                </div>
              </Section>
            ) : null}
            {funds.length > 0 ? (
              <Section className="px-4">
                <SectionHeader title="Funds" />
                <div className="flex flex-col gap-2">
                  {funds.map(([key, entity]) => (
                    <WatchlistRow
                      key={key}
                      entity={entity}
                      onNavigate={() => router.push(`/fund/${entity.slug ?? toSlug(entity.name)}`)}
                      onRemove={() => remove(key)}
                    />
                  ))}
                </div>
              </Section>
            ) : null}
          </>
        )}
      </SafeArea>
    </>
  );
}
