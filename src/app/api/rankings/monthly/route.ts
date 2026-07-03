// Thin HTTP transport for handleGetMonthlyRankings (src/api/rankings.ts →
// src/dashboard/home.ts getMonthlyPicks). No business logic here —
// constructs the read-only Supabase client and delegates to the handler.
//
// Not yet consumed by any frontend source — no UI section currently
// displays monthly rankings. The endpoint is tested and ready for wiring
// when a Monthly Rankings tab or section is added.
import { handleGetMonthlyRankings, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../../_lib/supabase-client";

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getReadOnlySupabaseClient();
    return await handleGetMonthlyRankings(request, supabase);
  } catch (error) {
    return toErrorResponse(error);
  }
}
