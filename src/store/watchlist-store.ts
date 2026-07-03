import { useShallow } from "zustand/react/shallow";
import { createEntityCollectionStore, entityKey } from "./lib/create-entity-collection-store";
import type { CollectibleKind } from "./lib/create-entity-collection-store";

// The research list surfaced today by the Star icon on Project/Fund
// Detail ("Add to Watchlist" / "Remove from Watchlist") and the Watchlist
// tab. Persisted — a user's saved entities must survive a reload.
export const useWatchlistStore = createEntityCollectionStore("watchlist");

export const useWatchlistEntities = () => useWatchlistStore((s) => s.entities);

export const useIsWatchlisted = (kind: CollectibleKind, id: string): boolean =>
  useWatchlistStore((s) => Boolean(s.entities[entityKey(kind, id)]));

export const useWatchlistActions = () =>
  useWatchlistStore(
    useShallow((s) => ({
      add: s.add,
      remove: s.remove,
      toggle: s.toggle,
      clear: s.clear,
    })),
  );
