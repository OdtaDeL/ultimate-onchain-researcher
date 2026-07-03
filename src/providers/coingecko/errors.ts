// Thin CoinGecko-specific subclasses of the generic provider error
// hierarchy (src/providers/base/errors.ts) — same pattern as
// chainbroker/errors.ts. Networking/retry classification lives entirely
// in the base layer; this file only supplies the provider name and one
// CoinGecko-specific distinction (404 = unknown coin id).

import {
  ProviderError,
  ProviderHttpError,
  ProviderParseError,
  ProviderRetriesExhaustedError,
  ProviderTimeoutError,
  ProviderValidationError,
} from "../base/errors";
import type { ZodIssue } from "zod";

const PROVIDER_NAME = "CoinGecko";

export abstract class CoinGeckoError extends ProviderError {}

/** Non-2xx HTTP response. Retryable only for status codes the caller configured. */
export class CoinGeckoHttpError extends ProviderHttpError {
  constructor(url: string, status: number, body: string, retryable: boolean) {
    super(PROVIDER_NAME, url, status, body, retryable);
  }
}

/**
 * 404 from /coins/{id} — confirmed live (see SOURCE.md): the coin id does
 * not exist on CoinGecko. Never retryable, and deliberately distinct from
 * a generic ChainBrokerHttpError so a future CoinGecko ingestion layer can
 * skip-and-report an unknown coin id rather than treating it as a
 * transient failure — the same pattern ChainBroker's ingestion uses for
 * unknown project slugs.
 */
export class CoinGeckoNotFoundError extends ProviderHttpError {
  constructor(url: string, body: string) {
    super(PROVIDER_NAME, url, 404, body, false);
  }
}

/** Request did not complete within the configured timeout. Always retryable. */
export class CoinGeckoTimeoutError extends ProviderTimeoutError {
  constructor(url: string, timeoutMs: number) {
    super(PROVIDER_NAME, url, timeoutMs);
  }
}

/**
 * Response body was not valid JSON. Treated as retryable, consistent with
 * ChainBroker's reasoning, even though no bot-challenge layer has been
 * observed on CoinGecko (see SOURCE.md) — a conservative default.
 */
export class CoinGeckoParseError extends ProviderParseError {
  constructor(url: string, cause: unknown) {
    super(PROVIDER_NAME, url, cause);
  }
}

/**
 * Response was valid JSON but didn't match the expected schema — a real
 * contract break (CoinGecko changed a field), not a transient blip. Never
 * retryable.
 */
export class CoinGeckoValidationError extends ProviderValidationError {
  constructor(url: string, issues: ZodIssue[]) {
    super(PROVIDER_NAME, url, issues);
  }
}

/** All retry attempts were exhausted. Wraps the last error encountered. */
export class CoinGeckoRetriesExhaustedError extends ProviderRetriesExhaustedError {
  constructor(url: string, attempts: number, lastError: unknown) {
    super(PROVIDER_NAME, url, attempts, lastError);
  }
}
