// Thin DefiLlama-specific subclasses of the generic provider error
// hierarchy (src/providers/base/errors.ts) — same pattern as
// chainbroker/errors.ts and coingecko/errors.ts. Networking/retry
// classification lives entirely in the base layer; this file only
// supplies the provider name and one DefiLlama-specific distinction
// (unknown protocol slug, confirmed live as HTTP 400 — see SOURCE.md).

import {
  ProviderError,
  ProviderHttpError,
  ProviderParseError,
  ProviderRetriesExhaustedError,
  ProviderTimeoutError,
  ProviderValidationError,
} from "../base/errors";
import type { ZodIssue } from "zod";

const PROVIDER_NAME = "DefiLlama";

export abstract class DefiLlamaError extends ProviderError {}

/** Non-2xx HTTP response. Retryable only for status codes the caller configured. */
export class DefiLlamaHttpError extends ProviderHttpError {
  constructor(url: string, status: number, body: string, retryable: boolean) {
    super(PROVIDER_NAME, url, status, body, retryable);
  }
}

/**
 * Unknown protocol slug — confirmed live (see SOURCE.md) as **HTTP 400**
 * with a plain-text body ("Protocol not found" / "Fees for {slug} not
 * found, ..."), not a 404 like ChainBroker/CoinGecko. Never retryable,
 * and deliberately distinct from a generic DefiLlamaHttpError so a future
 * DefiLlama ingestion layer can skip-and-report an unknown protocol slug
 * rather than treating it as a transient failure — the same pattern used
 * by ChainBroker's unknown project slugs and CoinGecko's unknown coin ids.
 */
export class DefiLlamaNotFoundError extends ProviderHttpError {
  constructor(url: string, body: string) {
    super(PROVIDER_NAME, url, 400, body, false);
  }
}

/** Request did not complete within the configured timeout. Always retryable. */
export class DefiLlamaTimeoutError extends ProviderTimeoutError {
  constructor(url: string, timeoutMs: number) {
    super(PROVIDER_NAME, url, timeoutMs);
  }
}

/**
 * Response body was not valid JSON. Treated as retryable, consistent with
 * ChainBroker/CoinGecko's reasoning, even though no bot-challenge layer
 * has been observed on DefiLlama — a conservative default.
 */
export class DefiLlamaParseError extends ProviderParseError {
  constructor(url: string, cause: unknown) {
    super(PROVIDER_NAME, url, cause);
  }
}

/**
 * Response was valid JSON but didn't match the expected schema — a real
 * contract break (DefiLlama changed a field), not a transient blip. Never
 * retryable.
 */
export class DefiLlamaValidationError extends ProviderValidationError {
  constructor(url: string, issues: ZodIssue[]) {
    super(PROVIDER_NAME, url, issues);
  }
}

/** All retry attempts were exhausted. Wraps the last error encountered. */
export class DefiLlamaRetriesExhaustedError extends ProviderRetriesExhaustedError {
  constructor(url: string, attempts: number, lastError: unknown) {
    super(PROVIDER_NAME, url, attempts, lastError);
  }
}
