import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "./safe-storage";

// Shared shape behind both watchlist-store and favorites-store: "a set of
// project/fund entities the user chose to keep client-side." The two
// stores are semantically distinct (research list vs. quick-access list)
// but structurally identical, so this factory is composed by each rather
// than one inheriting from the other (composition over inheritance) — it
// also means a third "saved ids" store later costs one line, not a copy
// of the whole implementation.
export type CollectibleKind = "project" | "fund";

export interface CollectibleEntity {
  /** Stable identifier — the entity's display `name`, namespaced by `kind` so a project and fund with the same name never collide. Intentionally not the DB UUID or slug so that `useIsWatchlisted` lookups at the call site don't need to know the slug at the time of the check. */
  id: string;
  kind: CollectibleKind;
  name: string;
  /** The backend slug used for navigation (e.g. "aave-v3"). Optional for backward-compat with entries persisted before this field was added — callers fall back to `toSlug(name)` when absent. */
  slug?: string;
}

export interface EntityCollectionState {
  entities: Record<string, CollectibleEntity>;
}

export interface EntityCollectionActions {
  add: (entity: CollectibleEntity) => void;
  remove: (key: string) => void;
  toggle: (entity: CollectibleEntity) => void;
  clear: () => void;
}

export type EntityCollectionStore = EntityCollectionState & EntityCollectionActions;

export function entityKey(kind: CollectibleKind, id: string): string {
  return `${kind}:${id}`;
}

/** One persisted store instance, keyed under its own `localStorage` name. */
export function createEntityCollectionStore(persistName: string) {
  return create<EntityCollectionStore>()(
    persist(
      (set, get) => ({
        entities: {},
        add: (entity) => set((state) => ({ entities: { ...state.entities, [entityKey(entity.kind, entity.id)]: entity } })),
        remove: (key) =>
          set((state) => {
            if (!(key in state.entities)) return state;
            const next = { ...state.entities };
            delete next[key];
            return { entities: next };
          }),
        toggle: (entity) => {
          const key = entityKey(entity.kind, entity.id);
          if (get().entities[key]) get().remove(key);
          else get().add(entity);
        },
        clear: () => set({ entities: {} }),
      }),
      {
        name: persistName,
        storage: safeJSONStorage<EntityCollectionState>(),
        partialize: (state) => ({ entities: state.entities }),
      },
    ),
  );
}
