// Upsert services: the only layer in this module that talks to Supabase.
// Mapping and normalization (mapper.ts, normalize.ts) are pure; this file
// is where drafts actually become rows.
//
// `projects`, `funds`, and `funding_investors` have real unique
// constraints (slug, name, and (funding_round_id, fund_id) respectively),
// so those use genuine `upsert(...).on Conflict(...)`. `funding_rounds`
// and `token_unlock_events` have NO unique constraint in the current
// schema (see supabase/migrations/001_initial_schema.sql /
// 002_future_integrations.sql) — there's no natural key to upsert against.
// Those two use an application-level find-or-create instead: select on a
// best-effort match, insert only if nothing matched. This is the
// pragmatic fix for re-running ingestion without duplicating rows; the
// real fix is adding a unique constraint in a future migration, which is
// out of scope for "ingestion service only."

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";
import { IngestionUpsertError } from "./errors";
import { normalizeFundDrafts, normalizeProjectDrafts } from "./normalize";
import type { FundingInvestorPair } from "./normalize";
import type { FundDraft, FundingRoundDraft, ProjectDraft, TokenUnlockEventDraft } from "./types";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type FundInsert = Database["public"]["Tables"]["funds"]["Insert"];
type FundingRoundInsert = Database["public"]["Tables"]["funding_rounds"]["Insert"];
type FundingInvestorInsert = Database["public"]["Tables"]["funding_investors"]["Insert"];
type TokenUnlockEventInsert = Database["public"]["Tables"]["token_unlock_events"]["Insert"];

export class ChainBrokerUpsertService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /** Returns a map of slug -> project id for every draft (existing or newly created). */
  async upsertProjects(drafts: ProjectDraft[]): Promise<Map<string, string>> {
    const deduped = normalizeProjectDrafts(drafts);
    if (deduped.length === 0) return new Map();

    const rows: ProjectInsert[] = deduped.map((d) => ({
      slug: d.slug,
      name: d.name,
      ticker: d.ticker,
      logo_url: d.logoUrl,
    }));

    const { data, error } = await this.supabase
      .from("projects")
      .upsert(rows, { onConflict: "slug" })
      .select("id, slug");

    if (error) throw new IngestionUpsertError("projects", error);
    return new Map(data.map((row) => [row.slug, row.id]));
  }

  /** Look up already-ingested projects by slug without creating any. */
  async findProjectIdsBySlug(slugs: string[]): Promise<Map<string, string>> {
    const uniqueSlugs = [...new Set(slugs)];
    if (uniqueSlugs.length === 0) return new Map();

    const { data, error } = await this.supabase
      .from("projects")
      .select("id, slug")
      .in("slug", uniqueSlugs);

    if (error) throw new IngestionUpsertError("projects", error);
    return new Map(data.map((row) => [row.slug, row.id]));
  }

  /**
   * Returns a map keyed by ChainBroker's fund *slug*. `name` remains the
   * upsert conflict key (unchanged — `funds_name_key` predates `slug` and
   * a fund's display name is still the more stable real-world identity
   * ChainBroker reports), but `slug` is now written to `funds.slug`
   * directly on every insert/update — see supabase/migrations/
   * 010_funds_slug.sql.
   */
  async upsertFunds(drafts: FundDraft[]): Promise<Map<string, string>> {
    const deduped = normalizeFundDrafts(drafts);
    if (deduped.length === 0) return new Map();

    const rows: FundInsert[] = deduped.map((d) => ({
      slug: d.slug,
      name: d.name,
      logo_url: d.logoUrl,
    }));

    const { data, error } = await this.supabase
      .from("funds")
      .upsert(rows, { onConflict: "name" })
      .select("id, name");

    if (error) throw new IngestionUpsertError("funds", error);

    const idByName = new Map(data.map((row) => [row.name, row.id]));
    const idBySlug = new Map<string, string>();
    for (const draft of deduped) {
      const id = idByName.get(draft.name);
      if (id) idBySlug.set(draft.slug, id);
    }
    return idBySlug;
  }

  /** Find-or-create on (project_id, announced_date, amount_raised) — see file header. */
  async upsertFundingRound(projectId: string, draft: FundingRoundDraft): Promise<string> {
    let query = this.supabase
      .from("funding_rounds")
      .select("id")
      .eq("project_id", projectId);
    query =
      draft.announcedDate === null
        ? query.is("announced_date", null)
        : query.eq("announced_date", draft.announcedDate);
    query =
      draft.amountRaisedUsd === null
        ? query.is("amount_raised", null)
        : query.eq("amount_raised", draft.amountRaisedUsd);

    const { data: existing, error: selectError } = await query.maybeSingle();
    if (selectError) throw new IngestionUpsertError("funding_rounds", selectError);
    if (existing) return existing.id;

    const row: FundingRoundInsert = {
      project_id: projectId,
      round_type: draft.roundType,
      amount_raised: draft.amountRaisedUsd,
      announced_date: draft.announcedDate,
      fdv: draft.fdvUsd,
    };
    const { data, error } = await this.supabase
      .from("funding_rounds")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new IngestionUpsertError("funding_rounds", error);
    return data.id;
  }

  async upsertFundingInvestors(pairs: FundingInvestorPair[]): Promise<void> {
    if (pairs.length === 0) return;
    const rows: FundingInvestorInsert[] = pairs.map((p) => ({
      funding_round_id: p.fundingRoundId,
      fund_id: p.fundId,
    }));
    const { error } = await this.supabase
      .from("funding_investors")
      .upsert(rows, { onConflict: "funding_round_id,fund_id" });
    if (error) throw new IngestionUpsertError("funding_investors", error);
  }

  /**
   * Find-or-create on (project_id, unlock_date, amount_tokens, unlock_type)
   * — see file header. `unlock_date` is NOT NULL in the schema; callers
   * must filter out drafts with no parseable date before calling this
   * (the ingestion service does). Throws rather than fabricating a date.
   */
  async upsertTokenUnlockEvent(
    projectId: string,
    draft: TokenUnlockEventDraft,
  ): Promise<string> {
    if (draft.unlockDate === null) {
      throw new IngestionUpsertError(
        "token_unlock_events",
        new Error("unlock_date is required but draft.unlockDate is null — filter before upserting"),
      );
    }

    let query = this.supabase
      .from("token_unlock_events")
      .select("id")
      .eq("project_id", projectId)
      .eq("unlock_date", draft.unlockDate);
    query =
      draft.amountTokens === null
        ? query.is("amount_tokens", null)
        : query.eq("amount_tokens", draft.amountTokens);
    query =
      draft.unlockType === null
        ? query.is("unlock_type", null)
        : query.eq("unlock_type", draft.unlockType);

    const { data: existing, error: selectError } = await query.maybeSingle();
    if (selectError) throw new IngestionUpsertError("token_unlock_events", selectError);
    if (existing) return existing.id;

    const row: TokenUnlockEventInsert = {
      project_id: projectId,
      unlock_date: draft.unlockDate,
      unlock_type: draft.unlockType,
      amount_tokens: draft.amountTokens,
      amount_usd: draft.amountUsd,
      percent_of_supply: draft.percentOfSupply,
    };
    const { data, error } = await this.supabase
      .from("token_unlock_events")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new IngestionUpsertError("token_unlock_events", error);
    return data.id;
  }
}
