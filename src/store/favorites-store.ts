import { useShallow } from "zustand/react/shallow";
import { createEntityCollectionStore, entityKey } from "./lib/create-entity-collection-store";
import type { CollectibleKind } from "./lib/create-entity-collection-store";

// A separate, lighter "quick access" list — structurally identical to
// watchlist-store but intentionally a different persisted key, since
// "favorites" (quick bookmarks) and "watchlist" (active research list)
// are distinct user intents. The Bookmark toggle on project/fund detail
// pages writes here; /favorites lists all saved entries grouped by kind.
export const useFavoritesStore = createEntityCollectionStore("favorites");

export const useFavoriteEntities = () => useFavoritesStore((s) => s.entities);

export const useIsFavorited = (kind: CollectibleKind, id: string): boolean =>
  useFavoritesStore((s) => Boolean(s.entities[entityKey(kind, id)]));

export const useFavoritesActions = () =>
  useFavoritesStore(
    useShallow((s) => ({
      add: s.add,
      remove: s.remove,
      toggle: s.toggle,
      clear: s.clear,
    })),
  );
