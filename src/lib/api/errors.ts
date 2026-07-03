// Frontend mirror of src/api/errors.ts's normalization pattern (read, not
// imported — that module also exports server-only handler functions). Any
// error a hook's data source throws — a network failure, a timeout, or an
// ApiClientError already thrown by apiFetch — passes through here so every
// hook reports errors the same shape, regardless of source.
export class ApiClientError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (error instanceof Error) return new ApiClientError("UNKNOWN", error.message);
  return new ApiClientError("UNKNOWN", "An unexpected error occurred.");
}
