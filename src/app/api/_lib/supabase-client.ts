// Read-only Supabase client for this app's public-facing API routes —
// distinct from src/ingestion/chainbroker/supabase-client.ts's
// service-role client, which that file's own comment scopes to ingestion
// writes only ("not for this service"). This one uses the anon key so
// every request these routes serve goes through Postgres RLS like any
// other anonymous client would, rather than bypassing it.
//
// A `_`-prefixed folder (src/app/api/_lib/) is a Next.js "private folder"
// convention — excluded from routing, used here purely for this shared
// helper. Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
// (verified against the installed Next.js 16.2.9 docs directly).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../types/database.types";
import { env } from "@/config/env";
import { internalError } from "@/api";

let cachedClient: SupabaseClient<Database> | undefined;

export function getReadOnlySupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  let url: string;
  let anonKey: string;
  try {
    url = env.SUPABASE_URL;
    anonKey = env.SUPABASE_ANON_KEY;
  } catch (error) {
    // Re-thrown as an ApiError so this surfaces as the same JSON envelope
    // every other handler failure does (see src/api/errors.ts), not a raw
    // unhandled exception — env.ts's own message already names the
    // missing variable.
    throw internalError(error instanceof Error ? error.message : "Server is not configured: SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
  }

  cachedClient = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  return cachedClient;
}
