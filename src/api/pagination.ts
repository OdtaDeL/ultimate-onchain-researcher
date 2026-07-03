// Pagination helpers. The Dashboard Query Layer has no offset/count
// support anywhere — every list-returning function there takes a
// `limit` only (see src/dashboard/home.ts's getWeeklyPicks/getTopFunds/
// getNewFunding/getUnlockAlerts) or returns its full result set outright
// (src/dashboard/fund.ts's getFundPortfolio, capped-at-25
// src/dashboard/search.ts functions). True database-level offset
// pagination would require changing those signatures, which is
// out of scope ("do not modify dashboard logic"). These helpers instead
// paginate whatever array a handler already has in memory after calling
// the Dashboard Query Layer — see paginateArray's doc comment for the
// resulting, explicitly-flagged limitation.

import type { PaginationMeta, PaginationParams } from "./types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawPage = Number.parseInt(searchParams.get("page") ?? "", 10);
  const rawPageSize = Number.parseInt(searchParams.get("pageSize") ?? "", 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

/** Clamps a `limit` query param for endpoints that pass straight through to a Dashboard Query Layer `limit` parameter instead of paginating an in-memory array (e.g. GET /api/home's per-section limit). */
export function parseLimitParam(searchParams: URLSearchParams, fallback: number, max: number): number {
  const raw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(raw, max);
}

/**
 * Slices an already-fetched array into the requested page.
 *
 * Honest limitation: `totalItems`/`totalPages` describe the array passed
 * in, not a true database-wide row count — the Dashboard Query Layer
 * never ran a `count` query. For endpoints where the Dashboard function
 * already returns its complete result set (e.g. getFundPortfolio, or
 * search's already-capped-at-25 results), this is exact. For endpoints
 * where the handler only fetched a bounded window via `limit` (e.g.
 * rankings), `totalItems` reflects that window, not the full table —
 * documented per-handler where it applies. See this task's final report,
 * "Architecture concerns."
 */
export function paginateArray<T>(
  items: T[],
  params: PaginationParams,
): { items: T[]; pagination: PaginationMeta } {
  const { page, pageSize } = params;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
