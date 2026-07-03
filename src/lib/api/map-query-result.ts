import type { UseQueryResult } from "@tanstack/react-query";
import { ApiClientError, normalizeError } from "./errors";

export interface AsyncDataResult<T> {
  data: T;
  loading: boolean;
  error: ApiClientError | null;
  refresh: () => void;
}

/**
 * Adapts a TanStack Query `useQuery()` result to this app's existing
 * public hook contract (`{data, loading, error, refresh}`), unchanged
 * since before this migration — every feature hook (useHome, useMarkets,
 * useSearch, useProject, useFund) and every page consuming them keeps the
 * exact same shape. `fallback` plays the role `initialData` played in the
 * old hand-rolled `useAsyncData` state machine: `data` is never
 * `undefined`, even before the first fetch resolves, so screens never
 * need a null-check before reading it.
 *
 * This is a pure mapping function, not a hook — each feature hook still
 * calls `useQuery()` itself (see src/lib/api/hooks/*.ts); this only
 * removes the need to repeat the same 4-line shape translation five times.
 */
export function mapQueryResult<T>(query: UseQueryResult<T, ApiClientError>, fallback: T): AsyncDataResult<T> {
  return {
    data: query.data ?? fallback,
    loading: query.isPending,
    error: query.error ? normalizeError(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}
