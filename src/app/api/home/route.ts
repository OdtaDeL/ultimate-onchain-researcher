// Thin HTTP transport for the already-implemented handleGetHome
// (src/api/home.ts -> src/dashboard/home.ts). No business logic lives
// here — this only constructs the read-only Supabase client and hands the
// request to the existing handler, exactly matching the route table
// documented (but never wired) in src/api/index.ts.
import { handleGetHome, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../_lib/supabase-client";

// GET handlers default to dynamic rendering since Next.js 15 (verified
// against the installed 16.2.9 docs) — correct here regardless, since
// this always reads live data and must never be statically cached.
export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getReadOnlySupabaseClient();
    return await handleGetHome(request, supabase);
  } catch (error) {
    return toErrorResponse(error);
  }
}
