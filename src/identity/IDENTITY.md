# Project Identity Resolution

Provider-independent layer that answers one question: *given whatever a
provider calls a project, which row in `projects` is that?* Built against
the real shape of ChainBroker, CoinGecko, and DefiLlama's data, with
RootData/CryptoRank/Kaito as the extension target.

## Why this exists

Each provider names the same real-world project differently:

| Provider | What it calls Aave |
|---|---|
| ChainBroker | `slug = "aave"` |
| CoinGecko | `id = "aave"`, `symbol = "AAVE"` |
| DefiLlama | `slug = "aave-v3"` (note: **not** `"aave"`) |

Without a shared resolution layer, every future provider's ingestion code
would reinvent its own ad-hoc "find the project" logic, with its own bugs
and its own silent mismatches. This layer is that logic, written once.

## Layering

```
identity-service.ts   <- public facade; ingestion code imports only this
        |
   resolver.ts         <- holds the SupabaseClient; fetches, persists
        |
   matcher.ts           <- pure functions; no I/O, no Supabase
        |
   types.ts             <- shared domain types, no dependencies
```

Same split as `providers/<x>/client.ts` (I/O) vs.
`providers/<x>/mapper.ts` (pure) elsewhere in this codebase.
`src/identity/` does not import from `src/providers/`, `src/ingestion/`,
or `src/sync/` — it's a peer layer those will depend on once metrics
ingestion is built (out of scope here), not a child of any of them.

## Database: `project_aliases` (migration `005_project_identity.sql`)

```sql
project_aliases (
  id, project_id, provider, provider_identifier, provider_slug,
  provider_symbol, provider_name, contract_address,
  confidence, is_primary, created_at, updated_at
)
```

**Relationship to `project_external_ids` (migration 002)**: that table
already maps `project_id <-> data_source_id <-> external_id`, but with
one opaque ID per (project, source), no slug/symbol/name/contract fields,
no confidence, and no primary/historical distinction — and nothing has
ever written to it. `project_aliases` supersedes it as the identity
mechanism going forward. `project_external_ids` was **not** modified or
dropped — deciding to deprecate it is a separate decision this task
doesn't make unilaterally.

### Why the schema has no `chain` column

Several future providers (RootData, CryptoRank) and even DefiLlama itself
report chain-scoped deployments (the same protocol on Ethereum and
Arbitrum, say). This table deliberately tracks identity at the
**project** level, not project+chain — chain-scoped *metrics* (TVL per
chain, etc.) are a metrics-ingestion concern (out of scope here, see
DefiLlama's `NormalizedDefiLlamaMetrics.chain` field), not an identity
concern. One project can have many chain deployments; it still has one
identity.

## Matching tiers and confidence

| # | Tier | Confidence | Compared against |
|---|---|---|---|
| 1 | Contract address | 100 | `projects.metadata->>'contract_address'` (best-effort — see below) |
| 2 | Provider-specific ID | 95 | *(only ever discoverable via the alias table — see below)* |
| 3 | Slug | 90 | `projects.slug` |
| 4 | Symbol | 75 | `projects.ticker` |
| 5 | Exact project name | 60 | `projects.name` |
| 6 | Alias table | 40 | `project_aliases` (any column, this provider) |
| 7 | Manual override | 100 | `project_aliases` (same table, `writeAlias` called via `applyManualOverride`) |

Confidence is assigned **once, at row-creation time**, by whichever tier
created the row, and stored. Every later lookup that hits an existing
alias row returns that stored value — it is never recomputed. This is
why tier 6's "40" doesn't mean "every alias-table hit is worth 40": a row
created by a slug match and found again later via the alias table still
carries its original 90.

### Why tiers 2, 6, and 7 collapse into one lookup

Reading `projects`' actual columns (migration 001) was the key
architecture-review finding for this design: `projects` has `slug`,
`ticker`, and `name` — directly comparable against a fresh provider
identity — but **no generic external-ID column**. A "provider-specific
ID" (CoinGecko's `id`, DefiLlama's numeric `id` distinct from its slug)
has nowhere to be compared *except* the alias table itself, because
that's the only place it's ever stored. So tier 2 cannot be implemented
as a fresh comparison the way tiers 3-5 are — it can only ever be a
lookup against rows that already exist.

Manual overrides (tier 7) live in the exact same table, written through
the exact same `writeAlias` path as everything else (just with
`confidence = 100` and called from `applyManualOverride` instead of the
automated resolver). Once written, there is nothing structurally
distinguishing "a row discovered by automated matching" from "a row a
human asserted" — they're both just rows.

Given that, `resolver.ts` implements **one alias-table lookup** that
checks every identifying column (`provider_identifier`, `provider_slug`,
`provider_symbol`, `provider_name`, `contract_address`) at once, scoped
to the calling provider. This single lookup mechanically *is* tiers 2, 6,
and 7 — there's no second, different way to query the same table three
times for three "different" tiers. The brief's ordering (manual override
listed *last*, as the tier you reach for when nothing else works) is
preserved in spirit: a row that exists because a human manually created
it is found on the very first lookup, before tiers 3-5 ever run — exactly
the precedence an override should have. Listing it "last" in the
priority spec is read as "the resolution path of last resort when
automation can't figure it out," which is logically equivalent to
"checked first, since once it exists it always wins."

**Resolution order actually implemented**: alias table (tiers 2/6/7) →
contract address (1) → slug (3) → symbol (4) → name (5). Whichever tier
produces a unique hit first wins; the result is registered back into
`project_aliases` so the next call for the same identity is an instant
alias-table hit, regardless of which tier originally resolved it.

### Contract address tier — best-effort, honestly

`projects` has no dedicated `contract_address` column (only the
free-form `metadata` jsonb bag, per migration 001's own comment
anticipating this). Tier 1 reads `metadata->>'contract_address'`, which
**no current ingestion code populates** — ChainBroker, CoinGecko, and
DefiLlama as implemented so far don't write to `projects.metadata` at
all. This tier is wired up and ready for the day a provider (or a future
metrics-ingestion change) starts populating it, rather than removed for
being currently unused — consistent with this project's practice of
building forward-compatible extension points (e.g. `sync_runs.items_inserted`
exists unpopulated today for the same reason).

## Conflict Resolution

| Case | Handling |
|---|---|
| **One provider maps to multiple projects** | A tier finding 2+ distinct `project_id` candidates returns `status: "ambiguous"` immediately — resolution stops at that tier rather than falling through to a lower-confidence tier and silently picking a different answer. The caller gets `conflictingProjectIds` to resolve manually (`applyManualOverride`). |
| **Duplicate aliases** | Rejected at the database layer (`project_aliases_provider_identifier_key`, `..._provider_slug_key`, `..._provider_contract_key` unique indexes). `resolver.writeAlias` catches the Postgres unique-violation code (`23505`) and raises `IdentityConflictError` instead of letting a raw Postgrest error propagate. |
| **Symbol collisions** | `provider_symbol` has **no** unique constraint — collisions across distinct real projects (two tickers happening to match) are expected, not errors. The symbol tier (75) only auto-resolves when exactly one `projects.ticker` matches; a collision there is an *ambiguous* result (see above), not a constraint violation. |
| **Missing identifiers** | Each matcher tier simply returns `{ kind: "none" }` when its corresponding input field is null — never an error, just "this tier had nothing to check." A provider supplying only `slug` and `name` is fully supported, it just can't be found via tiers 1/2/4. |
| **Case sensitivity** | Every comparison normalizes via `trim().toLowerCase()` (`matcher.ts`'s `normalize()`). The database's uniqueness indexes are functional (`lower(...)`), so `"AAVE"` and `"aave"` collide there too — while the original casing is still preserved in the stored column for display. |
| **Renamed protocols** | Handled by `is_primary`, not by editing history. When tiers 1/3/4/5 resolve a *new* primary mapping for a `(project_id, provider)` pair that already has a different primary row, `writeAlias` demotes the old row (`is_primary = false`) before inserting the new one as primary. The old row is never deleted — it remains queryable as alias history. |
| **Merged projects** | Two previously-separate `project_id` rows turning out to be the same real-world entity is **out of scope** for this layer — fixing it means re-pointing every other table's foreign keys (`funding_rounds`, `project_metrics`, etc.), not just identity rows, which is a project-merge operation this task didn't authorize. This layer can *surface* the signal (an `"ambiguous"` result naming both project ids is exactly that signal) but does not execute a merge. Flagged here rather than silently implemented. |

## Manual Overrides

```ts
import { applyManualOverride } from "../identity/identity-service";

await applyManualOverride(supabase, projectId, {
  provider: "rootdata",
  providerId: "rd-8821",
  slug: "aave-v3",
});
```

This is the entire mechanism — no code change to `matcher.ts`/`resolver.ts`
is ever required to fix a wrong or missing mapping. It always wins on the
next resolution, because `resolveProjectIdentity` checks the alias table
(where this row now lives) before running any automated tier. The same
effect can be achieved by a direct SQL insert/update against
`project_aliases` (e.g. from an admin dashboard once one exists) — the
function is a thin, audited convenience wrapper around exactly that.

## Known limitation: full-table fetch

`resolver.ts` fetches the entire `projects` table (`id, slug, name,
ticker, metadata`) once per `resolveProjectIdentity` call rather than
issuing four targeted queries (one per direct tier). This is simpler and
fully sufficient at the current scale (~2,300 rows from the ChainBroker
bootstrap). If `projects` grows large enough for this to matter, the fix
is to replace `fetchProjectCandidates` with per-tier targeted queries
(e.g. `.eq("slug", identity.slug)`) — `matcher.ts`'s pure functions
already accept an arbitrary candidate list, so this change is isolated to
`resolver.ts` and requires no change to the matching logic itself.

## Extension Guide — RootData, CryptoRank, Kaito

Adding a new provider to this system requires **zero changes** to
`matcher.ts` or `resolver.ts`. A future provider's ingestion code (not
built in this task) only needs to:

1. Register the provider in `data_sources` (a migration, additive — see
   `005_project_identity.sql`'s own `rootdata` seed row for the pattern).
2. Call `resolveProjectIdentity(supabase, { provider: "rootdata", ...whatever fields RootData actually exposes... })`
   before writing any metrics for that provider.
3. Handle the three possible outcomes:
   - `"resolved"` → proceed, using `result.projectId`.
   - `"ambiguous"` → skip and log (the same `skippedUnknownProjectSlugs`-style
     pattern ChainBroker's ingestion already uses for unresolvable
     references), or escalate for a manual override.
   - `"unresolved"` → same as ambiguous — do not fabricate a project_id.

No future provider needs to know how any other provider is matched, and
no existing provider's resolution behavior changes when a new one is
added — the matching tiers operate on `projects`/`project_aliases`, not
on provider-specific code paths.
