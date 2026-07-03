// Thin HTTP transport for handleGetFundRankings
// (src/api/rankings.ts -> src/dashboard/home.ts's getTopFunds). No
// business logic here — matches the route table in src/api/index.ts.
import { handleGetFundRankings, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../../_lib/supabase-client";

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getReadOnlySupabaseClient();
    return await handleGetFundRankings(request, supabase);
  } catch (error) {
    return toErrorResponse(error);
  }
}
