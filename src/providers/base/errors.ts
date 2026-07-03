// Generic provider-HTTP error hierarchy. Every concrete provider's
// errors.ts (e.g. chainbroker/errors.ts) should define thin subclasses of
// these, passing its own `providerName` so messages stay
// provider-specific ("ChainBroker request failed: ...") while the
// retry-classification logic in base/retry.ts and base/http-client.ts
// stays provider-agnostic.

import type { ZodIssue } from "zod";

export abstract class ProviderError extends Error {
  abstract readonly retryable: boolean;

  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Non-2xx HTTP response. Retryable only for status codes the caller configured. */
export class ProviderHttpError extends ProviderError {
  readonly retryable: boolean;

  constructor(
    readonly providerName: string,
    readonly url: string,
    readonly status: number,
    readonly body: string,
    retryable: boolean,
    message: string = `${providerName} request failed: ${status} ${url}`,
  ) {
    super(message);
    this.retryable = retryable;
  }
}

/** Request did not complete within the configured timeout. Always retryable. */
export class ProviderTimeoutError extends ProviderError {
  readonly retryable = true;

  constructor(
    readonly providerName: string,
    readonly url: string,
    readonly timeoutMs: number,
    message: string = `${providerName} request timed out after ${timeoutMs}ms: ${url}`,
  ) {
    super(message);
  }
}

/**
 * Response body was not valid JSON. Treated as retryable by default: many
 * providers sit behind something like Cloudflare, where a soft
 * bot-challenge returns an HTML page in place of JSON — a transient
 * condition a retry can clear.
 */
export class ProviderParseError extends ProviderError {
  readonly retryable = true;

  constructor(
    readonly providerName: string,
    readonly url: string,
    cause: unknown,
    message: string = `${providerName} response was not valid JSON: ${url}`,
  ) {
    super(message, cause);
  }
}

/**
 * Response was valid JSON but didn't match the expected schema — a real
 * contract break (upstream changed a field), not a transient blip. Never
 * retryable: retrying won't change the shape of the response.
 */
export class ProviderValidationError extends ProviderError {
  readonly retryable = false;

  constructor(
    readonly providerName: string,
    readonly url: string,
    readonly issues: ZodIssue[],
    message: string = `${providerName} response failed schema validation: ${url} — ${issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  ) {
    super(message);
  }
}

/** All retry attempts were exhausted. Wraps the last error encountered. */
export class ProviderRetriesExhaustedError extends ProviderError {
  readonly retryable = false;

  constructor(
    readonly providerName: string,
    readonly url: string,
    readonly attempts: number,
    lastError: unknown,
    message: string = `${providerName} request failed after ${attempts} attempt(s): ${url}`,
  ) {
    super(message, lastError);
  }
}
