// GET /api/search — calls the Dashboard Query Layer exclusively
// (src/dashboard/search.ts). See home.ts header for the layering rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { searchFunds, searchProjects } from "../dashboard/search";
import { badRequest, toErrorResponse } from "./errors";
import { paginateArray, parsePaginationParams } from "./pagination";
import { successResponse } from "./response";

type SearchType = "all" | "projects" | "funds";

const MAX_QUERY_LENGTH = 200;

function parseSearchType(raw: string | null): SearchType {
  return raw === "projects" || raw === "funds" ? raw : "all";
}

/**
 * `?q=` is required (400 if missing/blank) and capped at MAX_QUERY_LENGTH
 * characters (400 if exceeded — prevents an unbounded ILIKE pattern from
 * reaching Supabase). `?type=` narrows to `projects` or `funds`; defaults
 * to `all`. Both dashboard search functions already cap themselves at 25
 * rows each (src/dashboard/search.ts), so the pagination here slices that
 * already-fetched, already-capped set — `totalItems` per list is exact
 * within that cap, not a true database-wide match count.
 */
export async function handleGetSearch(request: Request, supabase: SupabaseClient<Database>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (!query) throw badRequest('Query parameter "q" is required.');
    if (query.length > MAX_QUERY_LENGTH) throw badRequest(`Query parameter "q" must be ${MAX_QUERY_LENGTH} characters or fewer.`);

    const type = parseSearchType(url.searchParams.get("type"));
    const paginationParams = parsePaginationParams(url.searchParams);

    const [projects, funds] = await Promise.all([
      type === "funds" ? Promise.resolve([]) : searchProjects(supabase, query),
      type === "projects" ? Promise.resolve([]) : searchFunds(supabase, query),
    ]);

    const projectsPage = paginateArray(projects, paginationParams);
    const fundsPage = paginateArray(funds, paginationParams);

    return successResponse({
      query,
      type,
      projects: projectsPage.items,
      funds: fundsPage.items,
      pagination: { projects: projectsPage.pagination, funds: fundsPage.pagination },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
