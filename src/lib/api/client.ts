import type { ApiResponseBody } from "./types";
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
 * Typed fetch against this app's own `/api/*` routes. Enforces a 10-second
 * hard timeout on every request and forwards the caller's AbortSignal (React
 * Query's cancellation signal) so stale requests from unmounted components or
 * superseded queries are aborted promptly. Parses the
 * `{success:true,data,pagination?}` | `{success:false,error}` envelope from
 * src/api/response.ts / src/api/errors.ts.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.searchParams);

  // Create a single controller that aborts on whichever fires first:
  // the hard 10-second timeout, or the caller's own signal (React Query
  // cancellation on component unmount / query key change).
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => timeoutController.abort(options.signal?.reason),
      { once: true },
    );
  }

  // Attach Telegram initData for server-side HMAC verification (proxy.ts).
  // Empty string when running outside Telegram (dev browser, tests) — header
  // is omitted in that case so proxy.ts can distinguish absent vs invalid.
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
      // React Query cancelled the query (component unmounted, key changed) —
      // rethrow as-is so TanStack Query silences it rather than marking
      // the query as failed.
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

  return body.data;
}
