// Thin ChainBroker-specific subclasses of the generic provider error
// hierarchy (src/providers/base/errors.ts). Same class names, same
// retryable semantics, same message text as before this provider was
// refactored onto the shared base layer — only the implementation moved.

import {
  ProviderError,
  ProviderHttpError,
  ProviderParseError,
  ProviderRetriesExhaustedError,
  ProviderTimeoutError,
  ProviderValidationError,
} from "../base/errors";
import type { ZodIssue } from "zod";

const PROVIDER_NAME = "ChainBroker";

export abstract class ChainBrokerError extends ProviderError {}

/** Non-2xx HTTP response. Retryable only for status codes the caller configured. */
export class ChainBrokerHttpError extends ProviderHttpError {
  constructor(url: string, status: number, body: string, retryable: boolean) {
    super(PROVIDER_NAME, url, status, body, retryable);
  }
}

/** Request did not complete within the configured timeout. Always retryable. */
export class ChainBrokerTimeoutError extends ProviderTimeoutError {
  constructor(url: string, timeoutMs: number) {
    super(PROVIDER_NAME, url, timeoutMs);
  }
}

/**
 * Response body was not valid JSON. Treated as retryable: ChainBroker sits
 * behind Cloudflare, and a soft bot-challenge returns an HTML page in place
 * of JSON — a transient condition a retry can clear (see SOURCE.md).
 */
export class ChainBrokerParseError extends ProviderParseError {
  constructor(url: string, cause: unknown) {
    super(PROVIDER_NAME, url, cause);
  }
}

/**
 * Response was valid JSON but didn't match the expected schema — a real
 * contract break (upstream changed a field), not a transient blip. Never
 * retryable: retrying won't change the shape of the response.
 */
export class ChainBrokerValidationError extends ProviderValidationError {
  constructor(url: string, issues: ZodIssue[]) {
    super(PROVIDER_NAME, url, issues);
  }
}

/** All retry attempts were exhausted. Wraps the last error encountered. */
export class ChainBrokerRetriesExhaustedError extends ProviderRetriesExhaustedError {
  constructor(url: string, attempts: number, lastError: unknown) {
    super(PROVIDER_NAME, url, attempts, lastError);
  }
}
