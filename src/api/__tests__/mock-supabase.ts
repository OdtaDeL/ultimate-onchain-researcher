// Test-only fake SupabaseClient for src/api/ integration tests. Mocks
// Supabase only — every dashboard function under test still runs for
// real; only the network/Postgres boundary is faked. Not imported by any
// production file.
//
// Each table gets a `TableHandler`: a plain function of the filters
// recorded against that table's query builder (`.eq()`, `.in()`, etc.) to
// a canned `{ data, error }` result. This is order-independent — safe
// even when a handler under test issues several queries against the same
// table from concurrent `Promise.all` branches (e.g. src/dashboard/
// home.ts's getWeeklyPicks/getNewFunding/getUnlockAlerts all query
// `projects`) — because each call is resolved by inspecting its own
// filters, not by a fixed call-order queue.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";

export interface RecordedFilter {
  method: string;
  args: unknown[];
}

export interface MockResult {
  data: unknown;
  error: { message: string } | null;
}

export type TableHandler = (filters: RecordedFilter[]) => MockResult;

/** Wraps an array as a successful, error-free result — the common case for every handler below. */
export function rows<T>(data: T[]): MockResult {
  return { data, error: null };
}

/** Reads the value of the first `.eq(column, value)` call recorded against a builder, if any. */
export function getEq(filters: RecordedFilter[], column: string): unknown {
  return filters.find((f) => f.method === "eq" && f.args[0] === column)?.args[1];
}

/** Reads the array passed to the first `.in(column, values)` call recorded against a builder, if any. */
export function getIn(filters: RecordedFilter[], column: string): unknown[] | undefined {
  return filters.find((f) => f.method === "in" && f.args[0] === column)?.args[1] as unknown[] | undefined;
}

function makeBuilder(handler: TableHandler | undefined): unknown {
  const filters: RecordedFilter[] = [];
  const resolve = (): MockResult => (handler ? handler(filters) : { data: [], error: null });

  const record =
    (method: string) =>
    (...args: unknown[]) => {
      filters.push({ method, args });
      return builder;
    };

  const builder: Record<string, unknown> = {
    select: record("select"),
    eq: record("eq"),
    in: record("in"),
    gte: record("gte"),
    lte: record("lte"),
    not: record("not"),
    or: record("or"),
    ilike: record("ilike"),
    order: record("order"),
    limit: record("limit"),
    maybeSingle: async () => {
      const res = resolve();
      const data = Array.isArray(res.data) ? res.data[0] ?? null : res.data;
      return { data, error: res.error };
    },
    // supabase-js's PostgrestFilterBuilder is itself a thenable — code
    // that `await`s the builder directly (without calling .maybeSingle())
    // relies on this, e.g. src/dashboard/home.ts's getWeeklyPicks.
    then(onFulfilled: (value: MockResult) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(resolve()).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

/** Builds a fake SupabaseClient whose `.from(table)` returns a chainable builder resolved by that table's handler. Tables with no handler configured resolve to an empty, error-free array. */
export function createMockSupabase(handlers: Partial<Record<string, TableHandler>>): SupabaseClient<Database> {
  return {
    from: (table: string) => makeBuilder(handlers[table]),
    rpc: async () => ({ data: null, error: null }),
  } as unknown as SupabaseClient<Database>;
}
