// GET /api/rankings/weekly, GET /api/rankings/monthly — calls the
// Dashboard Query Layer exclusively. See home.ts header for the layering
// rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { getMonthlyPicks, getTopFunds, getWeeklyPicks } from "../dashboard/home";
import { toErrorResponse } from "./errors";
import { paginateArray, parseLimitParam, parsePaginationParams } from "./pagination";
import { successResponse } from "./response";

/** Bounds how many rows are fetched to satisfy a deep page request — see handleGetWeeklyRankings's doc comment. */
const MAX_FETCH_WINDOW = 200;

/**
 * Paginates weekly_rankings_mv via src/dashboard/home.ts's getWeeklyPicks.
 * getWeeklyPicks only accepts a `limit` (no offset/count — see its
 * signature), so this fetches `page * pageSize` rows, capped at
 * MAX_FETCH_WINDOW, and paginates that window in memory.
 * `totalItems`/`totalPages` therefore describe the fetched window, not a
 * true database-wide row count — see this task's final report,
 * "Architecture concerns," and pagination.ts's paginateArray doc comment.
 */
export async function handleGetWeeklyRankings(
  request: Request,
  supabase: SupabaseClient<Database>,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url.searchParams);
    const fetchLimit = Math.min(paginationParams.page * paginationParams.pageSize, MAX_FETCH_WINDOW);

    const rankings = await getWeeklyPicks(supabase, fetchLimit);
    const { items, pagination } = paginateArray(rankings, paginationParams);

    return successResponse(items, pagination);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Top-ranked funds by portfolio quality via src/dashboard/home.ts's getTopFunds. Returns a flat array (no pagination) — top_funds is already bounded by its materialized view and `limit` param. */
export async function handleGetFundRankings(
  request: Request,
  supabase: SupabaseClient<Database>,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseLimitParam(url.searchParams, 50, 100);
    const funds = await getTopFunds(supabase, limit);
    return successResponse(funds);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Paginates monthly_rankings_mv via src/dashboard/home.ts's
 * getMonthlyPicks — symmetrical with handleGetWeeklyRankings above,
 * same fetch-window caveat applies (`totalItems`/`totalPages` describe
 * the fetched window, not a true database-wide row count).
 */
export async function handleGetMonthlyRankings(
  request: Request,
  supabase: SupabaseClient<Database>,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url.searchParams);
    const fetchLimit = Math.min(paginationParams.page * paginationParams.pageSize, MAX_FETCH_WINDOW);

    const rankings = await getMonthlyPicks(supabase, fetchLimit);
    const { items, pagination } = paginateArray(rankings, paginationParams);

    return successResponse(items, pagination);
  } catch (error) {
    return toErrorResponse(error);
  }
}
