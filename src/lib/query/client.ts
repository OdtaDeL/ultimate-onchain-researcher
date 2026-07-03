import { QueryClient, environmentManager } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { queryDefaults } from "./defaults";

function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: queryDefaults });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Next.js App Router pattern (verified against the installed package's own
 * `environmentManager` export in node_modules/@tanstack/query-core, since
 * tanstack.com's docs returned 403 to direct fetches during this task):
 * the server always gets a fresh client (no cross-request state leakage
 * between users), the browser reuses one client for the whole tab so the
 * cache survives re-renders and route changes.
 */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// --- Foundation helpers (requirement: invalidateQueries / prefetchQuery /
// optimistic updates "foundation only" — no UI calls any of these yet) ---

/**
 * Optimistic-update scaffold for a future `useMutation`. Cancels any
 * in-flight query for `queryKey`, snapshots the current cached value,
 * applies `updater` immediately, and rolls back to the snapshot on error.
 * No mutation in this app uses this yet — see "Future mutation plan" in
 * the architecture report for the first concrete consumer (toggling
 * watchlist/favorite status against a real backend instead of only
 * src/store's local Zustand state).
 *
 * Usage once a mutation exists:
 * ```ts
 * useMutation({
 *   mutationFn: updateWatchlistOnServer,
 *   ...createOptimisticUpdateHandlers(queryClient, queryKeys.project(slug), (current) => ({ ...current, isWatchlisted: true })),
 * });
 * ```
 */
export interface OptimisticUpdateContext<T> {
  previousData: T | undefined;
}

export function createOptimisticUpdateHandlers<T>(queryClient: QueryClient, queryKey: QueryKey, updater: (current: T | undefined) => T) {
  return {
    onMutate: async (): Promise<OptimisticUpdateContext<T>> => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);
      queryClient.setQueryData<T>(queryKey, updater(previousData));
      return { previousData };
    },
    onError: (_error: unknown, _variables: unknown, context: OptimisticUpdateContext<T> | undefined) => {
      if (context) queryClient.setQueryData<T>(queryKey, context.previousData);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}
