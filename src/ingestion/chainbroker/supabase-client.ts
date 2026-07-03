// Service-role Supabase client factory. Ingestion writes go through
// service_role, which bypasses RLS entirely (see the RLS comments in
// supabase/migrations/001_initial_schema.sql) — the "admin write" RLS
// policies exist for an eventual admin UI client, not for this service.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import { env } from "@/config/env";

export function createIngestionSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
