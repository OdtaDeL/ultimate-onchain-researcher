// Response helpers — the only place in src/api/ that constructs a
// `Response` body shape directly. Every success path in every handler
// goes through successResponse() so the envelope (`{ success, data,
// pagination? }`) is identical across all 6 endpoints.

import type { ApiSuccessResponse, PaginationMeta } from "./types";

export function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function successResponse<T>(
  data: T,
  pagination?: PaginationMeta,
  status: number = 200,
): Response {
  const body: ApiSuccessResponse<T> = pagination ? { success: true, data, pagination } : { success: true, data };
  return jsonResponse(body, status);
}
