// Thin HTTP transport for handleGetFund (src/api/fund.ts →
// src/dashboard/fund.ts). No business logic here — constructs the
// read-only Supabase client and delegates to the handler.
//
// Consumed by src/lib/api/sources/fund.ts via apiFetch on every
// Fund Detail page load. Fields without a DB source (activityStatus,
// activeInvestments, is_lead) are documented in that source file's
// header comment.
import { handleGetFund, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../../_lib/supabase-client";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  try {
    const { slug } = await params;
    const supabase = getReadOnlySupabaseClient();
    return await handleGetFund(request, supabase, { slug });
  } catch (error) {
    return toErrorResponse(error);
  }
}
