// Thin HTTP transport for handleGetWeeklyRankings (src/api/rankings.ts →
// src/dashboard/home.ts getWeeklyPicks). No business logic here —
// constructs the read-only Supabase client and delegates to the handler.
//
// Consumed by src/lib/api/sources/markets.ts via apiFetch (fetchRealProjectRows)
// on every Markets page load, and by src/lib/api/sources/home.ts for the
// Home Weekly Picks section.
import { handleGetWeeklyRankings, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../../_lib/supabase-client";

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getReadOnlySupabaseClient();
    return await handleGetWeeklyRankings(request, supabase);
  } catch (error) {
    return toErrorResponse(error);
  }
}
