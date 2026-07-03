// GET /api/funds/:slug — calls the Dashboard Query Layer exclusively
// (src/dashboard/fund.ts). See home.ts header for the layering rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { getFundInsights, getFundOverview, getFundPortfolio } from "../dashboard/fund";
import { notFound, toErrorResponse } from "./errors";
import { paginateArray, parsePaginationParams } from "./pagination";
import { successResponse } from "./response";

/**
 * Overview, paginated portfolio project list, and portfolio insights
 * (src/dashboard/fund.ts's getFundInsights — added alongside the DTO
 * expansion). 404 if the slug doesn't resolve to a fund. getFundPortfolio
 * returns its complete project list with no limit of its own, so
 * `totalItems` here is an exact count, not a bounded-window estimate —
 * see pagination.ts's paginateArray doc comment.
 */
export async function handleGetFund(
  request: Request,
  supabase: SupabaseClient<Database>,
  routeParams: { slug: string },
): Promise<Response> {
  try {
    const { slug } = routeParams;

    const overview = await getFundOverview(supabase, slug);
    if (!overview) throw notFound(`No fund found for slug "${slug}".`);

    const [portfolio, insights] = await Promise.all([getFundPortfolio(supabase, slug), getFundInsights(supabase, slug)]);
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url.searchParams);
    const { items: projects, pagination } = paginateArray(portfolio?.projects ?? [], paginationParams);

    return successResponse(
      { overview, portfolio: { fundId: overview.fundId, slug: overview.slug, projects }, insights },
      pagination,
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
