// Stable query key hierarchy for every TanStack Query consumer in this
// app. Centralizing these (rather than inlining array literals in each
// hook) is what makes `invalidateQueries`/`prefetchQuery` reliable: an
// invalidation against `queryKeys.project()` matches every query built
// from that same factory, with no risk of a typo'd literal silently
// missing the cache entry it meant to target.
//
// `slug` is optional on project()/fund() so callers can invalidate the
// entire project or fund family at once (e.g. after a server-side write)
// via `invalidateQueries({ queryKey: queryKeys.project() })` — omitting the
// slug matches every ["project", *] entry in the cache. Hooks always pass
// a concrete slug; the optional overload is a cache-management affordance.
export const queryKeys = {
  home: () => ["home"] as const,
  markets: () => ["markets"] as const,
  search: (query: string) => ["search", query] as const,
  project: (slug?: string) => (slug ? (["project", slug] as const) : (["project"] as const)),
  fund: (slug?: string) => (slug ? (["fund", slug] as const) : (["fund"] as const)),
};
