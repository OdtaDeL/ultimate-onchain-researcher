// Error helpers — typed errors a handler can throw, plus the single
// function (toErrorResponse) that converts anything thrown — an ApiError
// or an unexpected error bubbling up from the Dashboard Query Layer —
// into the same `{ success: false, error: { code, message } }` envelope
// every handler's catch block returns through.

import { jsonResponse } from "./response";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, "BAD_REQUEST", message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, "NOT_FOUND", message);
}

export function notImplemented(message: string): ApiError {
  return new ApiError(501, "NOT_IMPLEMENTED", message);
}

export function internalError(message: string): ApiError {
  return new ApiError(500, "INTERNAL_ERROR", message);
}

/**
 * Converts any thrown value into a consistent JSON Response. An ApiError
 * carries its own status/code and is safe to expose verbatim — its
 * message was authored by this layer. Anything else (e.g. a generic
 * `Error` thrown by a Dashboard Query Layer function, which can embed raw
 * Postgrest error text — see DEVELOPER_GUIDE.md's `describeError()` note)
 * is logged server-side but never handed to the client verbatim, so a
 * database-shaped error message never leaks into a public API response.
 */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return jsonResponse({ success: false, error: { code: error.code, message: error.message } }, error.status);
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ event: "api.unhandled_error", message }));
  return jsonResponse(
    { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
    500,
  );
}
