"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { PageLayout, SafeArea, Section, SectionHeader } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { typography } from "@/lib/theme";
import { useFavoriteEntities, useFavoritesActions } from "@/store";
import { toSlug } from "@/lib/utils";
import type { CollectibleEntity } from "@/store/lib/create-entity-collection-store";

function FavoritesRow({
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
        aria-label={`Remove ${entity.name} from favorites`}
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

export default function FavoritesPage() {
  const router = useRouter();
  const entities = useFavoriteEntities();
  const { remove } = useFavoritesActions();

  const entries = Object.entries(entities);
  const projects = entries.filter(([, e]) => e.kind === "project");
  const funds = entries.filter(([, e]) => e.kind === "fund");
  const isEmpty = entries.length === 0;

  return (
    <PageLayout
      header={
        <SafeArea edges={["top"]}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex size-11 shrink-0 items-center justify-center text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={typography.heading.className}>Favorites</h1>
          </div>
        </SafeArea>
      }
    >
      <SafeArea edges={["bottom"]} className="flex flex-1 flex-col pb-8">
        {isEmpty ? (
          <Section className="flex flex-1 flex-col px-4">
            <EmptyState
              variant="full"
              icon={<Bookmark size={40} />}
              title="No favorites yet"
              description="Bookmark projects and funds for quick access."
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
                    <FavoritesRow
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
                    <FavoritesRow
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
    </PageLayout>
  );
}
