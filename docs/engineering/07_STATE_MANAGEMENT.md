# 07 — State Management

## Zustand Stores

Six stores. All in `src/store/`. All use Zustand v5.

| Store | File | Persisted | Contents |
|---|---|---|---|
| `useWatchlistStore` | `watchlist-store.ts` | localStorage | Saved projects/funds |
| `useFavoritesStore` | `favorites-store.ts` | localStorage | Favorited projects/funds |
| `useSearchStore` | `search-store.ts` | localStorage | Recent search queries |
| `useHomeStore` | `home-store.ts` | No | Home tab UI state |
| `useUIStore` | `ui-store.ts` | No | Global UI state (loading, modals) |
| `useAuthStore` | `auth-store.ts` | No | Auth/session state (Telegram user) |

## Entity Collection Store (`src/store/lib/create-entity-collection-store.ts`)

Watchlist and Favorites both use this factory:

```typescript
type CollectibleKind = "project" | "fund";

interface CollectibleEntity {
  id: string;       // currently = name
  kind: CollectibleKind;
  name: string;
}

function entityKey(kind, id): string {
  return `${kind}:${id}`;
}

// Store shape:
{
  entities: Record<string, CollectibleEntity>;  // key = entityKey(kind, id)
  add(entity): void;
  remove(key: string): void;
  toggle(entity): void;   // add if absent, remove if present
  clear(): void;
}
```

## Exported Hooks

### Watchlist

```typescript
useWatchlistStore     // full store access
useWatchlistEntities  // () => Record<string, CollectibleEntity>
useIsWatchlisted      // (kind, id) => boolean
useWatchlistActions   // () => { add, remove, toggle, clear }
```

### Favorites

```typescript
useFavoritesStore
useFavoritesEntities
useIsFavorited
useFavoritesActions
```

## Persistence

- Watchlist: `localStorage` key `"watchlist"`
- Favorites: `localStorage` key `"favorites"`
- Search recents: `localStorage` key `"search-recents"`
- All use Zustand `persist` middleware
- Telegram Mini App has localStorage access; data survives Mini App close/reopen

## Cross-Store Interaction

- No cross-store imports — each store is self-contained
- Pages compose multiple stores (e.g. project detail page reads `useIsWatchlisted`)

## `id === name` Coupling

Current: `entity.id === entity.name`. This means:
- The watchlist key is `${kind}:${name}` (e.g. `project:Ethereum`)
- Navigation slug is `toSlug(entity.name)` (e.g. `ethereum`)
- If a project name changes, the stored key becomes orphaned

Future: Use a stable numeric/UUID from the database as `id`.

## Watchlist Page Bug (CRITICAL — Fixed in this session)

Before fix: `src/app/(tabs)/watchlist/page.tsx` never called `useWatchlistEntities()`. The page always rendered the empty state regardless of store contents. Users who tapped the Star button would see items saved (star filled) but the Watchlist tab would remain empty.

After fix: Page reads `useWatchlistEntities()`, renders `WatchlistRow` components for each saved entity, grouped by kind (projects first, then funds). Real empty state shown only when `Object.keys(entities).length === 0`.
