// GET /api/home — calls the Dashboard Query Layer exclusively
// (src/dashboard/home.ts); never imports @supabase/supabase-js's query
// builder or types/database.types.ts's table names. The SupabaseClient
// this handler receives is only ever passed through to dashboard
// functions, never used to call `.from(...)` itself.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { getMarketOverview, getMonthlyPicks, getNewFunding, getRecentlyAdded, getTopFunds, getTopGainers, getUnlockAlerts, getWeeklyPicks } from "../dashboard/home";
import { toErrorResponse } from "./errors";
import { parseLimitParam } from "./pagination";
import { successResponse } from "./response";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** Landing-page sections, each capped by a shared `?limit=` query param (default 10, max 50). */
export async function handleGetHome(request: Request, supabase: SupabaseClient<Database>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseLimitParam(url.searchParams, DEFAULT_LIMIT, MAX_LIMIT);

    const [weeklyPicks, monthlyPicks, topFunds, topGainers, recentlyAdded, newFunding, unlockAlerts, marketOverview] = await Promise.all([
      getWeeklyPicks(supabase, limit),
      getMonthlyPicks(supabase, limit),
      getTopFunds(supabase, limit),
      getTopGainers(supabase, limit),
      getRecentlyAdded(supabase, limit),
      getNewFunding(supabase, limit),
      getUnlockAlerts(supabase, limit),
      getMarketOverview(supabase),
    ]);

    return successResponse({ weeklyPicks, monthlyPicks, topFunds, topGainers, recentlyAdded, newFunding, unlockAlerts, marketOverview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
