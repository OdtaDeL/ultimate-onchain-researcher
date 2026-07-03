# Developer Guide — Smart Money Discovery Platform

Companion to [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md). That
document explains *why* the system is shaped this way; this one is the
checklist you follow when extending it. If something here seems to
contradict the architecture doc, the architecture doc wins — file an
inconsistency rather than picking one.

---

## Adding a New Provider

Using CoinGecko as the running example.

1. **Investigate before writing code.** Create `src/providers/coingecko/SOURCE.md`:
   base URL, auth method, rate limits (CoinGecko's free tier has real,
   documented ones — unlike ChainBroker), endpoint inventory, and raw
   response shapes for every endpoint you intend to use. Do this by hitting
   the real API, not by reading docs alone — `chainbroker/SOURCE.md` was
   written from live requests and that's what caught the
   display-string-number quirk ("$25M") before it became a parsing bug.
2. Define `RawXxx` types matching the verbatim API response, and the
   `NormalizedXxx` types this provider promises to produce, in `types.ts`.
3. Write zod schemas for every `RawXxx` shape in `schemas.ts`. Keep them
   **non-strict** — `.passthrough()` or no `.strict()` — so an
   undocumented API adding a field doesn't break validation.
4. Define provider-specific error classes in `errors.ts`, each with a
   `retryable: boolean`. Mirror `chainbroker/errors.ts`'s shape
   (`HttpError`, `TimeoutError`, `ParseError`, `ValidationError`,
   `RetriesExhaustedError`) — don't invent new names for the same concepts.
5. Write `client.ts`: HTTP calls + timeout (`AbortController`) + retry
   with backoff + your own rate limiter respecting CoinGecko's actual
   limits + zod validation + Raw→Normalized mapping. **No Supabase import
   in this file, ever.**
6. Define a `CoinGeckoProvider` interface in `provider.ts` that
   `CoinGeckoClient` implements. Even with one implementation — see
   [SYSTEM_ARCHITECTURE.md ADR 5](SYSTEM_ARCHITECTURE.md#adr-5--provider-interfaces-exist-even-with-one-implementation).
7. **Stop here if your task scope is "provider only."** Do not start the
   ingestion layer in the same change unless asked.

**Checklist:**
- [ ] `SOURCE.md` written from live API calls, not assumptions
- [ ] `types.ts`: `Raw*` + `Normalized*`
- [ ] `schemas.ts`: non-strict zod for every `Raw*`
- [ ] `errors.ts`: typed errors with `retryable` flags
- [ ] `client.ts`: zero Supabase imports, verified by inspection
- [ ] `provider.ts`: interface the client implements
- [ ] `index.ts`: barrel export
- [ ] No existing provider folder touched

---

## Creating a New Ingestion Pipeline

Paired 1:1 with the provider above, in `src/ingestion/coingecko/`.

1. **Decide where each `Normalized*` type lands** in the existing schema
   first. CoinGecko's price/market-cap data likely maps onto the existing
   `project_metrics` table (current-state, no history per the MVP scope
   decision) — check before assuming you need a new table.
2. Write `mapper.ts`: pure `Normalized* → Draft*` functions. If you find
   yourself writing an `if`, stop — that logic belongs either back in the
   provider (interpreting the source) or in `normalize.ts`/the
   upsert-service (a storage-layer decision).
3. Write `normalize.ts`: dedup functions, one per upsert-conflict key your
   drafts could collide on within a single batch. Required wherever
   `ON CONFLICT` will be used — Postgres rejects a batch with duplicate
   conflict keys outright.
4. Check whether the target table has a real unique constraint:
   - **Has one** → real upsert in `upsert-service.ts`, `onConflict: "<column>"`.
   - **Doesn't have one** → find-or-create (select first, insert if
     missing), same pattern as `funding_rounds`/`token_unlock_events` in
     `ingestion/chainbroker/upsert-service.ts`. Don't add a migration to
     create the missing constraint as a side effect of an unrelated task —
     flag it and ask, the same way the ChainBroker gaps were flagged
     rather than silently fixed.
5. If your drafts reference rows another ingestion pipeline owns (e.g. a
   CoinGecko draft referencing a project by slug), **resolve the
   reference by querying the real table and skip what's unresolvable** —
   do not fabricate the missing row. This is the actual mechanism that
   keeps dependency order safe; see
   [SYSTEM_ARCHITECTURE.md — "Business logic never depends on metadata"](SYSTEM_ARCHITECTURE.md#business-logic-never-depends-on-metadata).
6. Write `ingestion-service.ts` orchestrating client → mapper → normalize
   → upsert per entity type.
7. **Never call another provider's upsert-service.** If two providers
   write to the same table, each gets its own independent upsert call.

**Checklist:**
- [ ] Target table(s) confirmed against existing schema before adding new ones
- [ ] `mapper.ts` has no conditionals
- [ ] `normalize.ts` dedups every conflict key used in an upsert
- [ ] Upsert strategy matches whether a real unique constraint exists
- [ ] Unknown references are skipped, not fabricated, with the skip reported
- [ ] `supabase-client.ts` reused or copied (service-role, env-var based) — not a shared singleton imported across provider folders
- [ ] No import of another provider's `upsert-service.ts`

---

## Adding a New Sync Job

Within `src/sync/coingecko/` (or `src/sync/<provider>/`).

1. Decide if this job is **paginated** (use `runPagedSync()` if you can —
   don't write a new pagination loop) or a **single-shot** fetch (mirror
   `syncFunds.ts`'s plain try/catch shape instead).
2. Job functions accept `SyncJobOptions` (`maxPages`, `logger`,
   `onProgress`, retry config) and return a report object — never throw.
   If your job's loop can fail in a way `runPagedSync`/the try/catch
   pattern doesn't already catch, catch it explicitly; an uncaught throw
   here is the exact bug class [ADR 2](SYSTEM_ARCHITECTURE.md#adr-2--metadata-is-best-effort-and-lives-outside-the-provider-folder)
   exists to warn you about.
3. If this job needs a bootstrap variant (full uncapped run), write a
   thin wrapper forcing `maxPages: undefined` and relabeling `job`
   (`syncBootstrapProjects.ts` is the template) — **no metadata call
   inside the wrapper.**
4. Metadata persistence is *never* called from inside a job or its
   bootstrap wrapper. It belongs only in the orchestrator
   (`runBootstrap.ts`-equivalent), as a phase that runs after all data
   jobs, via `recordSyncRun()` from `src/sync/sync-metadata.ts`. Import it
   from there, not by writing a new one.
5. Wire the job into the provider's CLI file (`src/cli/coingecko-sync.ts`)
   following `chainbroker-sync.ts`'s shape: structured logs to stderr,
   final JSON report to stdout, exit code derived from `report.succeeded`.

**Checklist:**
- [ ] Job function cannot throw (verified by reading every awaited call inside it)
- [ ] Uses `runPagedSync()` if paginated; doesn't reinvent pagination
- [ ] Bootstrap wrapper (if any) has zero metadata-persistence code
- [ ] Metadata recorded only from the cross-job orchestrator, after all data jobs finish
- [ ] CLI command added, follows existing stdout/stderr split

---

## Creating a New Materialized View

Following the `fund_leaderboard` precedent (migration 003).

1. Materialized views in Supabase **do not support RLS policies.** Don't
   write `alter materialized view ... enable row level security` — it
   will fail or silently do nothing useful. Instead:
   ```sql
   grant select on public.<view_name> to anon, authenticated;
   ```
   Grant directly. This is intentional, not a workaround — the view is
   derived, read-only, and already only exposes what the underlying
   tables' own RLS already allowed through at refresh time.
2. Index the view for the access pattern you're actually optimizing —
   `fund_leaderboard`'s composite index exists because the leaderboard
   query sorts/filters by it, not as a default habit.
3. Decide refresh strategy up front and document it in the migration file
   as a comment: who calls `REFRESH MATERIALIZED VIEW CONCURRENTLY
   <view>`, and on what trigger (after a specific ingestion job, on a
   schedule, etc.) — there's no automatic refresh in Postgres, and an
   undocumented refresh policy is a guaranteed staleness bug later.
   `CONCURRENTLY` requires a unique index on the view; add one if you want
   non-blocking refreshes.
4. Add the view to `types/database.types.ts` under its own table-like
   entry, with `Relationships: []` — `@supabase/supabase-js`'s generics
   need this on views exactly as much as on tables (see
   [SYSTEM_ARCHITECTURE.md — types/](SYSTEM_ARCHITECTURE.md#types)).

**Checklist:**
- [ ] `grant select` used instead of RLS
- [ ] Index matches the actual query pattern
- [ ] Refresh trigger documented as a SQL comment in the migration
- [ ] Unique index added if `CONCURRENTLY` refresh is intended
- [ ] View added to `database.types.ts` with `Relationships: []`

---

## Database Migration Guidelines

1. **Hand-numbered, sequential, never renumbered.** Next migration after
   `004_sync_metadata.sql` is `005_...`. Don't insert a migration between
   existing numbers.
2. **Every table gets the shared RLS pattern** (`is_admin()` +
   public-read/admin-write policies from `001_initial_schema.sql`) —
   *unless* the table is internal operational metadata like `sync_runs`,
   which gets RLS enabled with **no policies** (service_role-only by
   default). Decide which category a new table is in before writing its
   policies, and say so in a comment if it's the metadata category — it's
   the exception, not the rule, and should read as a deliberate choice.
3. **Add real unique constraints when you can**, even if the immediate
   ingestion code will use find-or-create initially — a constraint costs
   nothing unused, and lets a later change switch to a real upsert without
   a schema migration. (The fact that `funds`/`funding_rounds` lack one
   today is a named gap, not the desired end state — see Do & Don't below.)
4. **Mirror every migration into `types/database.types.ts` by hand**
   immediately, in the same change — don't let the type file drift from
   the schema. Include `Relationships: []` on every table/view entry.
5. **Deploy through the connection pooler**, not the direct host, in any
   environment without outbound IPv6 — `db.<ref>.supabase.co` is
   IPv6-only; `aws-X-<region>.pooler.supabase.com:6543` is the IPv4-safe
   path. This is an environment fact, not a permanent architecture
   decision — re-check if running from a different network.
6. **Never commit a connection string or service-role key.** Read
   credentials from a scratchpad-only file outside the repo, inject via
   command substitution, and delete the file once the migration is
   applied.

**Checklist:**
- [ ] Filename continues the sequence, doesn't renumber
- [ ] RLS category decided explicitly (public content vs. internal metadata)
- [ ] Unique constraints added wherever a real upsert is plausible
- [ ] `database.types.ts` updated in the same change, with `Relationships: []`
- [ ] No secret committed; pooler used if direct host isn't reachable

---

## Coding Standards

**Naming conventions**
- Provider folders/files: lowercase provider name (`chainbroker`,
  `coingecko`), matching the `data_sources.slug` seeded in migration 002.
- Types: `Raw*` (verbatim external shape), `Normalized*` (provider output
  contract), `Draft*` (ingestion's pre-upsert, natural-keyed shape).
- Sync job functions: `sync<Entity>` (incremental), `syncBootstrap<Entity>`
  (full, uncapped). Report types: `<Entity>SyncReport` /
  `Bootstrap<Entity>Report`.
- Error classes: `<Provider><Failure>Error` (e.g. `ChainBrokerTimeoutError`),
  always with a `retryable: boolean` field — never a bare `Error` thrown
  from inside a provider client.

**Folder conventions**
- One folder per provider under each of `providers/`, `ingestion/`,
  `sync/`. Never split a provider's ingestion logic across two folders, and
  never let two providers share a folder.
- `index.ts` barrel exports at every folder level that has external
  consumers (a CLI file, another layer).

**Dependency direction** (the one rule that matters most — see
[SYSTEM_ARCHITECTURE.md High-Level Diagram](SYSTEM_ARCHITECTURE.md#high-level-diagram)):
```
providers/<x>  →  ingestion/<x>  →  sync/<x>  →  cli/<x>
```
Arrows are "depends on," pointing left. A file may only import from its
own column or columns strictly to its left. `providers/` never imports
from `ingestion/` or `sync/`. `ingestion/` never imports from `sync/`.
This is checked by reading imports, not tooling — when reviewing a PR,
literally check each new import against this diagram.

**Error handling**
- Provider layer: typed errors, `retryable` flag, real retry+backoff
  inside the client.
- Ingestion layer: typed errors (`IngestionUpsertError`,
  `IngestionPrerequisiteError`) that *can* throw — ingestion failures are
  real data problems and should surface, not be swallowed.
- Sync layer: catches everything from ingestion/providers into a report
  object (`succeeded`, `failedPages`, etc.) — a sync job function itself
  must never throw.
- Metadata layer (`sync-metadata.ts`): catches everything internally,
  logs, returns `void`/`false` — must never throw, by design, always.

**Logging**
- Structured JSON lines, one event per line, always to **stderr**.
- stdout is reserved for the final machine-readable report of a CLI
  command — never mix a log line into stdout.
- Use `logger.child({ job })` to scope a sub-logger rather than
  re-stringifying context into every message manually.

**Testing**
- No test framework is configured yet (`package.json` has none). Until
  one is added, verification has happened via two patterns, both
  acceptable for now:
  - **Mocked smoke tests**: hand-written fake dependencies (a fake
    ingestion service, a fake Supabase client) run through `tsx` directly,
    asserting on the returned report shape — used to reproduce the
    bootstrap metadata bug before fixing it.
  - **Real-data verification runs**: capped (`--max-pages=N`) runs against
    the live ChainBroker API and a live Supabase project, with the
    resulting report inspected by hand.
  Don't block a change on adding a test framework unless asked — but don't
  skip verifying a behavior change either; pick whichever of the two
  patterns above fits and show the result.

---

## Do & Don't

**Do**
- Do keep a provider's `client.ts` free of any `@supabase/supabase-js`
  import — verify with a search before considering a provider "done."
- Do let `mapper.ts` be boring. A mapper you can't explain in one
  sentence per field has a bug.
- Do skip-and-report unresolvable references (`skippedUnknownProjectSlugs`)
  rather than inventing a placeholder row.
- Do put metadata persistence in its own phase, after data jobs, never
  interleaved with them — this is the one rule a real production bug was
  caused by violating (ADR 2).
- Do flag a schema gap (missing unique constraint, missing column) and ask
  before silently working around it with a new migration — the `funds`
  slug gap and `funding_investors.is_lead` gap were both deliberately left
  as documented gaps rather than fixed inside unrelated tasks.

**Don't — these are real violations this codebase has caught and fixed**
- Don't call `recordSyncRun()` (or any metadata write) from inside a data
  job or bootstrap wrapper. *(Caused the original bootstrap bug — see ADR 2.)*
- Don't fabricate data to satisfy a NOT NULL constraint (e.g. defaulting a
  null `unlockDate` to "today"). Throw an explicit ingestion error instead
  and let the caller decide whether to skip the row. *(`upsertTokenUnlockEvent`
  was corrected from doing exactly this.)*
- Don't assume two superficially similar provider fields mean the same
  thing — ChainBroker's `circulation` (cumulative % already unlocked) and
  `percentOfSupply` (% unlocked in *this* event) look interchangeable and
  aren't; mapping one onto the other silently corrupts the metric.
  *(Caught via live-data testing in `normalizeGlobalUnlockItem`.)*
- Don't use `String(error)` to log a Supabase/Postgrest error — it's a
  plain object, not an `Error` instance, and produces `"[object Object]"`.
  Use a `describeError()`-style helper that checks `instanceof Error`
  first, then falls back to `.message`.
- Don't construct a Supabase client (or anything that can throw on missing
  env vars) outside the `try` block of a CLI entrypoint — it bypasses the
  structured error/exit-code path and produces a raw stack trace instead.
- Don't import one provider's ingestion/upsert code from another
  provider's folder, even if they happen to write the same table.

---

## Extension Guide — Adding RootData, CryptoRank, or Kaito Without Touching Existing Logic

Worked example for **RootData** (funding/investor data, similar shape to
ChainBroker) and **Kaito** (a genuinely new data shape — mindshare scores)
to show both cases:

**RootData (overlapping data with ChainBroker)**
1. `src/providers/rootdata/` — full provider folder, independent
   `RootDataClient`, own rate limiting (RootData's limits, not
   ChainBroker's), own error types. Zero shared code with
   `providers/chainbroker/` beyond conventions.
2. `src/ingestion/rootdata/` — its own `upsert-service.ts`. If RootData
   also reports `funding_rounds`, this upsert-service writes to the same
   `funding_rounds` table ChainBroker's does — independently, with its own
   conflict-handling. The two providers disagreeing about a round's amount
   is not resolved here; it's data for the (future) scoring engine to
   weigh.
3. `src/sync/rootdata/` + `src/cli/rootdata-sync.ts` — own jobs, own CLI,
   writing `sync_runs` rows with `provider: "rootdata"`. No edit to
   `sync_runs`'s schema needed — it was built generic for this.
4. **Files never opened during this work**: anything under
   `providers/chainbroker/`, `ingestion/chainbroker/`,
   `sync/chainbroker/`. If a RootData task requires opening one of these,
   stop and reconsider the design — it means a "shared" concern wasn't
   actually shared correctly (e.g. it should have been in `src/lib/`
   instead).

**Kaito (new data shape — mindshare score, no existing table)**
1. Same provider/ingestion/sync folder structure.
2. Since no existing table fits, add `006_kaito_metrics.sql` (or whatever
   the next number is) — a new table, following the standard RLS pattern,
   following the Migration Guidelines above. This mirrors how
   `social_metrics` was added in migration 002 in anticipation of exactly
   this kind of provider.
3. Update `database.types.ts` for the new table, in the same change.
4. Nothing about Kaito's addition required editing `001_initial_schema.sql`,
   `002_future_integrations.sql`, or any other provider's code — only
   additive new files.

**The test for "did I do this right"**: at the end of adding any new
provider, run a diff/git-status equivalent and confirm the only modified
files (not newly created) are, at most: `sync_runs`-style shared
infrastructure if it generuinely needed a new generic column (rare), and
`database.types.ts` (additive entries only). If `providers/chainbroker/`,
`ingestion/chainbroker/`, or `sync/chainbroker/` show up as *modified*
rather than untouched, the new provider work leaked into the wrong layer.
