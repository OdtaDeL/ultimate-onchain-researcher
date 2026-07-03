// Thin HTTP transport for handleGetProject (src/api/project.ts →
// src/dashboard/project.ts). No business logic here — constructs the
// read-only Supabase client and delegates to the handler.
//
// Consumed by src/lib/api/sources/project.ts via apiFetch on every
// Project Detail page load. Fields without a DB source (chain, is_lead)
// are documented in that source file's header comment.
import { handleGetProject, toErrorResponse } from "@/api";
import { getReadOnlySupabaseClient } from "../../_lib/supabase-client";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  try {
    const { slug } = await params;
    const supabase = getReadOnlySupabaseClient();
    return await handleGetProject(request, supabase, { slug });
  } catch (error) {
    return toErrorResponse(error);
  }
}
