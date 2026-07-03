# System Architecture — Smart Money Discovery Platform

**Status: Phase 1 backend foundation, frozen.** This document describes the
system as it exists today (ChainBroker as the only provider) and the
contract that CoinGecko, DefiLlama, and future providers must integrate
against without modifying anything described here as "existing."

Phase 1 scope: database schema, ChainBroker provider, ingestion layer, sync
jobs, bootstrap orchestration, sync metadata. Explicitly **not** built yet:
scoring engine, REST API, any frontend, any UI. Diagrams below mark these
as planned layers — described so Phase 2 has a target to build into, not
because they exist.

---

## High-Level Diagram

```
                    User
                     ↓
                    API                 ← planned (Phase 2+, not built)
                     ↓
              Scoring Engine            ← planned (Phase 2+, not built)
                     ↓
                  Database              ← exists (Supabase/Postgres)
                     ↑
              Ingestion Layer           ← exists
                     ↑
                 Providers              ← exists (ChainBroker only)
                     ↑
               External APIs            ← ChainBroker's undocumented REST API
```

The diagram is bidirectional by design: data flows *up* from external APIs
into the database (ingestion), and *down* from the database to the user
(serving). These are two independent pipelines that happen to share a
database as their handoff point — nothing in the upward path knows or
cares about the downward path, and vice versa. That separation is the
single most important property of this architecture; almost every design
principle below exists to protect it.

### Layer responsibilities

| Layer | Responsibility | Status |
|---|---|---|
| **External APIs** | Third-party data sources (ChainBroker today; CoinGecko, DefiLlama, RootData, CryptoRank, Kaito later). Owned by someone else, can change without notice, have no uniform contract. | External |
| **Providers** | Translate one external API's actual wire format into this platform's `Normalized*` types. Own HTTP, retry, backoff, rate-limiting, timeout, and runtime schema validation for *their* source only. Know nothing about Supabase, the database schema, or any other provider. | Exists (`src/providers/chainbroker`) |
| **Ingestion Layer** | Map `Normalized*` provider output onto draft rows shaped like the database schema, deduplicate within a batch, and upsert into Supabase using the right strategy per table (real upsert vs. find-or-create). The only layer permitted to hold a Supabase client. | Exists (`src/ingestion/chainbroker`) |
| **Sync Jobs / Bootstrap** | Decide *when* and *how much* to ingest — paginate a feed to completion, cap it for dev runs, run jobs in dependency order, retry a failed page, report progress, and (best-effort) record what happened. Owns no business logic of its own — it calls the ingestion layer and adds orchestration on top. | Exists (`src/sync/chainbroker`, `src/cli`) |
| **Database** | Source of truth. Postgres via Supabase, RLS-protected, the only thing every other layer can agree on. | Exists (`supabase/migrations`) |
| **Scoring Engine** | Reads from the database, computes derived rankings/scores (project scores, weekly/monthly rankings, fund leaderboard refresh), writes results back to the database. Never talks to a provider directly. | **Planned** — `project_scores`/`weekly_rankings`/`monthly_rankings` tables and the `fund_leaderboard` materialized view already exist (migrations 001/003) specifically so this layer has somewhere to write/read; the compute logic itself doesn't exist yet. |
| **API** | Serves database content (including scoring engine output) to clients. | **Planned** — no routes exist. |
| **User** | Frontend/consumer of the API. | **Planned** — explicitly out of scope per every task so far ("do not build UI/API routes"). |

---

## Folder Structure

```
src/
├── providers/      one subfolder per external data source
├── ingestion/       one subfolder per provider, maps + writes that provider's data
├── sync/            orchestration: pagination, retry, bootstrap, metadata
├── cli/             thin command-line entrypoints over the sync layer
└── lib/             intended: cross-provider shared utilities (see note below)
supabase/
└── migrations/      the database schema, applied in order, hand-numbered
types/
└── database.types.ts  hand-authored mirror of the Supabase schema (Database type)
```

### `src/providers/<name>/`

One folder per external API. Each contains:
- `SOURCE.md` — the source investigation: endpoint inventory, auth, rate
  limits, response schemas, observed quirks. Written *before* any client
  code, per this project's documentation-first/source-driven-development
  practice (see `src/providers/chainbroker/SOURCE.md`).
- `types.ts` — `Raw*` types (the API's actual shape, verbatim) and
  `Normalized*` types (this provider's output contract).
- `schemas.ts` — zod runtime validation for every `Raw*` shape.
- `errors.ts` — HTTP/timeout/parse/validation error classes specific to
  talking to this API.
- `client.ts` — the actual HTTP client: timeout, retry+backoff, rate
  limiting, validation, and Raw→Normalized mapping. No Supabase import
  anywhere in this folder.
- `provider.ts` — the interface this client satisfies (`ChainBrokerProvider`
  today), so a second implementation (e.g. a Playwright-based scraper, if
  the API ever gets blocked) can be swapped in without touching callers.

### `src/ingestion/<name>/`

One folder per provider, paired 1:1 with `src/providers/<name>/`. Contains:
- `mapper.ts` — pure functions, `Normalized* → Draft*`. No I/O, no
  deduplication, no Supabase.
- `normalize.ts` — pure functions that deduplicate a batch of drafts down
  to one row per upsert-conflict key. No I/O.
- `upsert-service.ts` — the **only** file in the entire codebase, per
  provider, that holds a `SupabaseClient`. Real upserts where the schema
  has a unique constraint; find-or-create where it doesn't.
- `ingestion-service.ts` — orchestrates provider client → mapper →
  normalize → upsert-service for each entity type this provider produces.
  Enforces dependency order (e.g. projects/funds before funding-rounds) by
  skipping unknown references rather than fabricating rows.
- `supabase-client.ts` — service-role client factory (env-var based).
- `errors.ts`, `types.ts` — ingestion-layer error classes and `Draft*`/
  report types.

### `src/sync/<name>/` and `src/sync/` (shared)

Per-provider orchestration (`src/sync/chainbroker/`): structured logger,
job-level retry, the paginated-sync loop, the four sync jobs
(`syncProjects`/`syncFunds`/`syncFundingRounds`/`syncUnlocks`), their
bootstrap variants, and `runBootstrap.ts` (the full-catalog orchestrator).

Shared, provider-agnostic (`src/sync/sync-metadata.ts`): `recordSyncRun()`
and `hasJobEverSucceeded()`, writing to the generic `sync_runs` table.
This file was deliberately pulled *out* of `src/sync/chainbroker/` the
moment a second consumer (any future provider) became foreseeable — see
ADR 2.

### `src/cli/`

One file per provider exposing its sync jobs as shell commands
(`chainbroker-sync.ts`). Thin: argument parsing, env-var wiring, calling
into `src/sync/<name>/`, printing the JSON report to stdout with logs on
stderr. No business logic.

### `src/lib/` (intended, not yet created)

**Honest current-state note**: this folder doesn't exist yet. `logger.ts`
and `retry.ts` currently live under `src/sync/chainbroker/`, but neither
contains any ChainBroker-specific logic — they're colocated there purely
because ChainBroker has been the only provider so far, the same situation
`sync-metadata.ts` was in before it was extracted (ADR 2). **When the
second provider (CoinGecko) is added**, `logger.ts` and `retry.ts` should
move to `src/lib/` (or merge into `src/sync/`) so both providers' sync
layers import the same implementation instead of duplicating it. This is
flagged explicitly as planned technical debt, not an oversight to silently
fix here — Phase 1 is frozen.

### `supabase/migrations/`

Hand-numbered SQL files (`001_...` through `004_...`), applied in order.
See "Database Migration Guidelines" in `DEVELOPER_GUIDE.md`.

### `types/`

`database.types.ts` — hand-authored to mirror the live schema, in the
exact shape `supabase gen types typescript --linked` would produce
(including the `Relationships: []` field every table/view needs to satisfy
`@supabase/supabase-js`'s generic constraints). Should be regenerated from
a linked project once one exists; until then, every migration must be
mirrored here by hand.

---

## Data Flow

Concrete example, one entity (a ChainBroker funding round), through every
layer that currently exists:

```
ChainBroker (api.chainbroker.io)
  ↓  GET /projects/fundraises/{slug}/  — raw JSON, display-string money fields
Provider  (ChainBrokerClient)
  ↓  zod-validates the response, parses "$25M" → 25_000_000,
  ↓  returns NormalizedFundingRound { projectSlug, amountRaisedUsd, investors, ... }
Mapper  (ingestion/chainbroker/mapper.ts)
  ↓  1:1 field rename: NormalizedFundingRound → FundingRoundDraft
  ↓  (no logic — if this function needs an if-statement, it's in the wrong file)
Normalizer  (ingestion/chainbroker/normalize.ts)
  ↓  collapses duplicate drafts sharing a conflict key within this batch
  ↓  (e.g. the same fund backing two rounds in the same page of results)
Upsert  (ingestion/chainbroker/upsert-service.ts)
  ↓  resolves project_id by slug, upserts/find-or-creates the row,
  ↓  upserts the funding_investors join rows
Supabase  (Postgres)
  ↓  row now durable, RLS-protected, queryable
Scoring Engine                                    ← planned
  ↓  would read funding_rounds, compute funding_score into project_scores
Frontend                                          ← planned
  ↓  would read project_scores / weekly_rankings via the (planned) API
```

Every arrow above is a **type boundary**: each layer's output type is the
next layer's input type, and nothing skips a layer. A provider cannot hand
data directly to the upsert service; a sync job cannot read raw API JSON.
This is enforced by what each module imports, not by a lint rule — see
"Design Principles" for why that's intentional.

---

## Design Principles

### Providers never write directly to the database

`src/providers/chainbroker/` has no import of `@supabase/supabase-js`
anywhere in it, by inspection. A provider's job is "tell the truth about
what the external API said," nothing else. If a provider could write to
the database, every schema change would risk touching every provider's
code, and testing a provider would require a database. Decoupling them
means the ChainBroker client was fully unit-verified (against the live
API) in isolation, before the ingestion layer that depends on it existed.

### Mapper contains no business logic

`mapper.ts` files are 1:1 field renames — `NormalizedFundingRound.amountRaisedUsd`
becomes `FundingRoundDraft.amountRaisedUsd`, full stop. No conditionals, no
lookups, no I/O. This is enforced by convention, not a type system
guarantee, but it's load-bearing: the moment a mapper needs an `if`, that
logic either belongs in the provider (if it's about interpreting the
source's data) or in `normalize.ts`/`upsert-service.ts` (if it's about
this platform's storage rules). Keeping mappers logic-free means they're
trivially safe to regenerate or rewrite when a provider's `Normalized*`
shape changes.

### Normalizer is provider-independent

`normalize.ts` only knows about `Draft*` types — it has never imported
anything from `src/providers/`. Its job (collapsing duplicate
upsert-conflict keys within one batch) is a Postgres concern, not a
ChainBroker concern: `INSERT ... ON CONFLICT` rejects a batch containing
the same key twice, regardless of which provider produced the batch. Any
future provider's ingestion layer needs the exact same kind of
deduplication, which is why this is named and structured to be copied, not
specialized.

### Sync orchestration is separate from ingestion

`ingestion-service.ts` answers "how do I turn one page of provider data
into database rows." `syncProjects.ts`/`runBootstrap.ts` answer "how many
pages, in what order, with what retry policy, reporting progress how."
These are different concerns with different failure modes: an ingestion
failure means a row is wrong or missing; a sync failure means a *job*
didn't finish. Conflating them was the literal root cause of the bootstrap
bug fixed in this phase (see ADR 2) — metadata bookkeeping, a sync-layer
concern, was originally embedded inside what should have been pure
ingestion, and its failure silently aborted unrelated ingestion that had
already succeeded.

### Metadata is best-effort only

`recordSyncRun()` (`src/sync/sync-metadata.ts`) catches every error
internally and only logs it — it cannot throw. Sync metadata (`sync_runs`)
exists to answer "did this job run, and what happened" *after the fact*;
it is bookkeeping about ingestion, not a precondition for it. A metadata
table being unreachable is a monitoring gap, not a data-integrity problem,
and it must never be treated as the latter. This is asymmetric on purpose:
reads of `sync_runs` (e.g. a future "has bootstrap run?" check) can be
made strict if a caller wants that; *writes* to it must never be able to
block anything.

### Business logic never depends on metadata

No ingestion or sync code branches on the contents of `sync_runs`. The one
helper that reads it (`hasJobEverSucceeded()`) is exported but
**unused** — written so a future job *could* gate itself on bootstrap
having run, deliberately not wired in yet. The actual mechanism that
protects against running incremental syncs before bootstrap is structural,
not metadata-driven: `ingestion-service.ts` resolves project/fund
references by querying the real `projects`/`funds` tables and skips
anything unresolvable, rather than trusting a flag that says "bootstrap
finished." A flag can be stale or wrong; a foreign-key lookup against the
table that matters cannot.

---

## Error Handling

```
Provider failure
  ↓  (HTTP error, timeout, malformed JSON — see providers/chainbroker/errors.ts)
Retry
  ↓  exponential backoff + jitter, bounded attempts, only for errors marked
  ↓  `retryable: true` (a 404 fails fast; a 503 or timeout retries)
Partial success
  ↓  one page failing doesn't abort the job — paged-sync.ts records the
  ↓  page number in `failedPages` and continues to the next page
Structured logs
  ↓  every retry, page completion, and failure is a JSON line to stderr
  ↓  (src/sync/chainbroker/logger.ts) — human/machine readable, never
  ↓  mixed with the job's stdout result
Sync metadata
  ↓  best-effort row in `sync_runs` summarizing the whole run — pages
     processed, items processed/skipped, failed pages, a synthesized
     last_error. If even this write fails, it's logged and the run's
     actual result (returned to the caller, already computed) is
     unaffected.
```

Two independent retry layers exist, deliberately not merged:
- **Provider-level** (`ChainBrokerClient`): retries a single HTTP request.
  Knows about status codes, timeouts, JSON parse failures.
- **Sync-level** (`src/sync/chainbroker/retry.ts`): retries one whole page
  (provider fetch *and* the ingestion/upsert that follows it) as a unit.
  Knows nothing about HTTP — it retries "this function failed," generically.

This means a transient Supabase failure on page 12 doesn't require
re-fetching pages 1–11 from the external API, and a transient ChainBroker
timeout doesn't need the sync layer to understand HTTP semantics. Each
layer retries at the granularity it actually controls.

---

## Future Providers

A new provider (CoinGecko, DefiLlama, RootData, CryptoRank, Kaito) is
added by creating new folders, never editing existing ones:

```
src/providers/<new-provider>/   (SOURCE.md, types.ts, schemas.ts, errors.ts, client.ts, provider.ts)
src/ingestion/<new-provider>/   (mapper.ts, normalize.ts, upsert-service.ts, ingestion-service.ts, ...)
src/sync/<new-provider>/        (the new provider's own sync jobs, reusing src/lib once it exists)
src/cli/<new-provider>-sync.ts
```

The only *shared* touchpoints are additive, not modifications:
- `sync_runs` already has a `provider` column for exactly this — a new
  provider just writes rows with `provider: "coingecko"`.
- If a new provider supplies data for an *existing* table (e.g. CoinGecko
  also has `market_cap`/`price`, which `project_metrics` already models),
  its upsert-service writes into that same table. It does not import or
  call ChainBroker's upsert-service — it has its own, writing to the same
  table independently. Two providers disagreeing about a project's price
  is a product/scoring decision (which source wins?), explicitly out of
  scope for the ingestion layer to resolve.
- If a new provider supplies genuinely new data shapes (e.g. Kaito's
  mindshare score), it gets a new migration adding a new table — exactly
  like `social_metrics` was added in migration 002 anticipating this.

**Nothing in `src/providers/chainbroker/`, `src/ingestion/chainbroker/`,
or `src/sync/chainbroker/` should ever need to change** to support a new
provider. If adding CoinGecko requires editing a ChainBroker file, that's
a sign the abstraction boundary was drawn in the wrong place.

---

## Future Features

| Feature | Belongs in | Why |
|---|---|---|
| **Weekly Picks** | Scoring Engine (write) → API (read) | Reads `project_scores`, writes `weekly_rankings`. Already has a unique `(week_start, rank)` index built for exactly this query pattern (migration 001). |
| **Monthly Rankings** | Scoring Engine (write) → API (read) | Same shape as Weekly Picks, monthly cadence; `monthly_rankings` table already exists. |
| **Top Funds** | Scoring Engine (refresh) → API (read) | Reads from the `fund_leaderboard` materialized view (migration 003), refreshed via `REFRESH MATERIALIZED VIEW CONCURRENTLY` after funding ingestion — a scoring-engine-adjacent job, not part of ingestion itself. |
| **Unlock Alerts** | API (read) | Pure read of `token_unlock_events` filtered by date range — no new compute needed; this is a query, not a scoring concern. |
| **AI Summary** | New layer, downstream of Scoring Engine | Consumes already-computed scores/rankings as its prompt input. Should not read raw ingestion tables directly — it's a presentation concern over derived data, same boundary as the API. |
| **Notification Service** | New layer, downstream of Scoring Engine + sync_runs | Two distinct triggers: score/ranking changes (reads Scoring Engine output) and ingestion events (could legitimately read `sync_runs` — this is the one place reading sync metadata for *business* purposes, e.g. "notify when a sync fails repeatedly," is appropriate, since notifications are inherently about operational events). |
| **REST API** | New layer, between Database/Scoring Engine and User | Read-only for all the above; the only layer that should ever be public-facing. RLS policies (migrations 001–003) already assume this — public-read on content tables. |
| **Admin Dashboard** | Consumes REST API (write-capable) | The existing `is_admin()` RLS function and admin-write policies (migration 001) were built anticipating exactly this client. |
| **User Dashboard** | Consumes REST API (read-only) | Anon/authenticated read access already modeled by every content table's public-read policy. |

---

## ADR (Architecture Decision Records)

### ADR 1 — Providers don't know Supabase

**Context**: ChainBroker's API is undocumented and unofficial (see
`src/providers/chainbroker/SOURCE.md`) — no SLA, can change or get blocked
without notice. **Decision**: the provider layer has zero dependency on
`@supabase/supabase-js` or the database schema. **Consequences**: a
provider can be fully replaced (e.g. swapped for a Playwright-based
scraper if the API gets blocked) without touching the ingestion layer,
since both implementations satisfy the same `ChainBrokerProvider`
interface. It also means the provider was independently verifiable against
the *live* external API before any database existed for it to write to —
which is in fact how it was built and tested.

### ADR 2 — Metadata is best-effort, and lives outside the provider folder

**Context**: the original bootstrap implementation called
`recordSyncRun()` *inside* `syncBootstrapProjects`, with a throwing
contract, before `sync_runs` had been deployed. The metadata write failed,
threw, and silently aborted every subsequent bootstrap job — even though
2,262 projects had already ingested successfully. **Decision**: metadata
persistence was moved to a separate phase, after all data jobs complete,
using a helper that catches and logs internally rather than throwing; and
that helper was relocated from `src/sync/chainbroker/` to `src/sync/`
since it has no ChainBroker-specific logic. **Consequences**: a
metadata-table outage can never again take down a data pipeline. This was
found via a real production-shaped verification run, not anticipated in
advance — documented here so it isn't reintroduced when CoinGecko's sync
jobs are written.

### ADR 3 — Ingestion is idempotent by upsert/find-or-create, not by checking history

**Context**: sync jobs are expected to be re-run — on a schedule, after a
partial failure, or manually. **Decision**: idempotency is enforced at the
write layer (`upsert-service.ts`), using real `ON CONFLICT` upserts where
the schema has a unique constraint (`projects.slug`, `funds.name`,
`funding_investors(funding_round_id, fund_id)`), and an explicit
select-then-insert find-or-create where it doesn't yet
(`funding_rounds`, `token_unlock_events` — these tables have no unique
constraint today; this is a named, accepted gap, not an oversight — see
`DEVELOPER_GUIDE.md` Do & Don't). **Consequences**: re-running any sync
job is always safe. The cost is that `funding_rounds`/`token_unlock_events`
do an extra `SELECT` per row instead of a single batched upsert — a
deliberate trade favoring correctness over a database migration that
wasn't in scope for the tasks that built them.

### ADR 4 — Scoring is separated from ingestion

**Context**: ingestion's job is "get external data into the database
faithfully." Scoring's job is "compute platform-specific judgments from
that data" (what counts as a good funding round, how unlocks affect
score). **Decision**: no scoring logic exists in any provider, ingestion,
or sync file — those layers stop at raw, faithfully-mapped rows.
**Consequences**: scoring rules can change weekly (a product decision)
without redeploying or re-validating the ingestion pipeline (an
infrastructure concern). It also means multiple providers can disagree
about a project's metrics in the database, and reconciling that disagreement
is explicitly the scoring engine's job, not ingestion's — ingestion from
two providers writing to the same table is not a conflict to prevent, it's
input the scoring layer is supposed to receive.

### ADR 5 — Provider interfaces exist even with one implementation

**Context**: `src/providers/chainbroker/provider.ts` defines
`ChainBrokerProvider` as an interface, separate from `ChainBrokerClient`,
even though exactly one implementation exists. **Decision**: keep the
interface. **Consequences**: every caller (the ingestion layer) depends on
the interface's shape, not the HTTP client's. This was justified up front
specifically because ChainBroker's API is unofficial (ADR 1) — the
realistic chance of needing a second implementation (browser-automation
fallback) was judged high enough to pay the small abstraction cost
immediately, rather than retrofitting an interface later under time
pressure if/when the API actually gets blocked.

### ADR 6 — `sync_runs` is generic from day one

**Context**: the original `004_sync_metadata.sql` was ChainBroker-specific
(no `provider` column, narrower field set). It was rewritten before
deployment once CoinGecko/DefiLlama were known to be coming next.
**Decision**: `sync_runs` is keyed by `(provider, job_name)`, with columns
(`items_processed`/`inserted`/`updated`/`skipped`) generic enough to
describe any paginated ingestion job, not just ChainBroker's. **Consequences**:
adding a provider never requires a `sync_runs` migration. The trade-off,
documented honestly rather than hidden: `items_inserted`/`items_updated`
are NULL for every job today, because no current ingestion layer tracks
that granularity (only an aggregate "upserted" count) — the columns exist
for a future change to populate, not because they're populated now.
