import type { PaginationMeta } from "./types";

export function hasMore(pagination?: PaginationMeta): boolean {
  return pagination?.hasNextPage ?? false;
}
