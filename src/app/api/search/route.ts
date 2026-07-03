// Thin HTTP transport for handleGetSearch (src/api/search.ts →
// src/dashboard/search.ts). No business logic here — constructs the
// read-only Supabase client and delegates to the handler.
//
// Consumed by src/lib/api/sources/search.ts via apiFetch for both
// project and fund results on every non-empty Search query.
import { handleGetSearch, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../_lib/supabase-client";

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getReadOnlySupabaseClient();
    return await handleGetSearch(request, supabase);
  } catch (error) {
    return toErrorResponse(error);
  }
}
