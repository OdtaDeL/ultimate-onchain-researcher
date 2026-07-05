import type { ApiResponseBody, ApiSuccessResponse, PaginationMeta } from "./types";
import { ApiClientError } from "./errors";

const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiRequestOptions {
  signal?: AbortSignal;
  searchParams?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, searchParams?: ApiRequestOptions["searchParams"]): string {
  if (!searchParams) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Shared fetch implementation. Enforces a 10-second hard timeout, forwards
 * the caller's AbortSignal, attaches the Telegram initData header, and
 * parses the `{success:true,data,pagination?}` | `{success:false,error}`
 * envelope. Returns the full ApiSuccessResponse (including pagination) so
 * callers can choose what to surface.
 */
async function performFetch<T>(path: string, options: ApiRequestOptions): Promise<ApiSuccessResponse<T>> {
  const url = buildUrl(path, options.searchParams);

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => timeoutController.abort(options.signal?.reason),
      { once: true },
    );
  }

  const headers: HeadersInit = {};
  if (typeof window !== "undefined") {
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) headers["x-telegram-init-data"] = initData;
  }

  let response: Response;
  try {
    response = await fetch(url, { signal: timeoutController.signal, headers });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      if (options.signal?.aborted) throw error;
      throw new ApiClientError("TIMEOUT", "Request timed out.");
    }
    throw new ApiClientError("NETWORK_ERROR", error instanceof Error ? error.message : "Network request failed.");
  }
  clearTimeout(timeoutId);

  let body: ApiResponseBody<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiClientError("PARSE_ERROR", "Received an invalid response from the server.", response.status);
  }

  if (!body.success) {
    throw new ApiClientError(body.error.code, body.error.message, response.status);
  }

  return body;
}

/**
 * Typed fetch against this app's own `/api/*` routes. Returns only `data` —
 * use `apiFetchPaginated` when you also need pagination metadata.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const body = await performFetch<T>(path, options);
  return body.data;
}

/**
 * Like `apiFetch` but also returns `pagination` from the response envelope
 * (src/api/types.ts's `ApiSuccessResponse.pagination`). Use for endpoints
 * that paginate their results so callers can check `hasNextPage` and
 * conditionally offer a "Load more" control.
 */
export async function apiFetchPaginated<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; pagination?: PaginationMeta }> {
  const body = await performFetch<T>(path, options);
  return { data: body.data, pagination: body.pagination };
}
