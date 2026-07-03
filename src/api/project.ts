// GET /api/projects/:slug — calls the Dashboard Query Layer exclusively
// (src/dashboard/project.ts). See home.ts header for the layering rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { getProjectFunding, getProjectMetrics, getProjectOverview, getProjectUnlocks } from "../dashboard/project";
import { notFound, toErrorResponse } from "./errors";
import { successResponse } from "./response";

/** Overview, funding, metrics, and unlocks for one project. 404 if the slug doesn't resolve to a project. */
export async function handleGetProject(
  _request: Request,
  supabase: SupabaseClient<Database>,
  routeParams: { slug: string },
): Promise<Response> {
  try {
    const { slug } = routeParams;

    const overview = await getProjectOverview(supabase, slug);
    if (!overview) throw notFound(`No project found for slug "${slug}".`);

    const [funding, metrics, unlocks] = await Promise.all([
      getProjectFunding(supabase, slug),
      getProjectMetrics(supabase, slug),
      getProjectUnlocks(supabase, slug),
    ]);

    return successResponse({ overview, funding, metrics, unlocks });
  } catch (error) {
    return toErrorResponse(error);
  }
}
