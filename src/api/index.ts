// REST API layer. Every handler here calls into src/dashboard/
// exclusively — no handler in this folder uses `.from(...)` on a
// SupabaseClient or imports a table/view name from
// types/database.types.ts; the only Supabase awareness in src/api/ is the
// `SupabaseClient<Database>` type each handler threads through, unopened,
// to a Dashboard Query Layer function.
//
// This folder is intentionally framework-agnostic: handlers are plain
// `(Request, SupabaseClient, routeParams?) => Promise<Response>`
// functions built on the standard Fetch API Request/Response types
// (already available via tsconfig.json's `"lib": ["ES2022", "DOM"]`) —
// no Express/Next/Fastify dependency was added. Constructing the
// SupabaseClient, parsing a real URL's route params, and wiring an actual
// HTTP server on top of these handlers is deliberately out of scope per
// this task ("Only API routes") — the same relationship src/cli/ has to
// src/sync/: a thin entrypoint would sit on top of this folder, not
// inside it.

export { handleGetHome } from "./home";
export { handleGetProject } from "./project";
export { handleGetFund } from "./fund";
export { handleGetSearch } from "./search";
export { handleGetWeeklyRankings, handleGetMonthlyRankings, handleGetFundRankings } from "./rankings";

export { ApiError, badRequest, notFound, notImplemented, internalError, toErrorResponse } from "./errors";
export { jsonResponse, successResponse } from "./response";
export { parsePaginationParams, parseLimitParam, paginateArray } from "./pagination";
export type { ApiSuccessResponse, ApiErrorBody, ApiResponseBody, PaginationMeta, PaginationParams } from "./types";

/**
 * Route table — documentation for whatever thin server entrypoint
 * eventually wires these handlers to real HTTP routing. Not executable;
 * no router dependency lives in this folder.
 *
 *   GET /api/home             -> handleGetHome(req, supabase)
 *   GET /api/projects/:slug   -> handleGetProject(req, supabase, { slug })
 *   GET /api/funds/:slug      -> handleGetFund(req, supabase, { slug })
 *   GET /api/search           -> handleGetSearch(req, supabase)
 *   GET /api/rankings/weekly  -> handleGetWeeklyRankings(req, supabase)
 *   GET /api/rankings/monthly -> handleGetMonthlyRankings(req, supabase)
 *   GET /api/rankings/funds   -> handleGetFundRankings(req, supabase)
 */
