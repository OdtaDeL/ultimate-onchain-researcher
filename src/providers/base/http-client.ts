// The shared networking engine every provider client should compose with
// (or extend) instead of reimplementing. Wires together: rate limiting,
// timeout, fetch, JSON parsing, schema validation, retry/backoff, and
// (optional) request logging.
//
// Providers must only define endpoints, request mapping, and response
// normalization on top of this — see DEVELOPER_GUIDE.md "Adding a New
// Provider."

import type { z } from "zod";
import type { BaseProviderConfig } from "./config";
import {
  ProviderHttpError,
  ProviderParseError,
  ProviderRetriesExhaustedError,
  ProviderTimeoutError,
  ProviderValidationError,
} from "./errors";
import { RateLimiter } from "./rate-limiter";
import { executeWithRetry } from "./retry";
import { NoopRequestLogger, type RequestLogger } from "./request-logger";
import { validateOrThrow } from "./validation";

export class BaseHttpClient {
  protected readonly config: BaseProviderConfig;
  private readonly providerName: string;
  private readonly rateLimiter: RateLimiter;
  private readonly requestLogger: RequestLogger;

  constructor(
    providerName: string,
    config: BaseProviderConfig,
    requestLogger: RequestLogger = new NoopRequestLogger(),
  ) {
    this.providerName = providerName;
    this.config = config;
    this.rateLimiter = new RateLimiter(config.maxRequestsPerSecond);
    this.requestLogger = requestLogger;
  }

  /** Fetches `path` (relative to config.baseUrl), validates it against `schema`, retrying transient failures. */
  protected async getJson<S extends z.ZodTypeAny>(
    path: string,
    schema: S,
  ): Promise<z.infer<S>> {
    const url = `${this.config.baseUrl}${path}`;
    let attempt = 0;

    return executeWithRetry(
      () => {
        attempt += 1;
        this.requestLogger.onRequest({ providerName: this.providerName, url, attempt });
        return this.rateLimiter.schedule(() => this.fetchAndValidate(url, schema));
      },
      this.config.retry,
      (error) => {
        const retryable =
          error instanceof ProviderHttpError ||
          error instanceof ProviderTimeoutError ||
          error instanceof ProviderParseError
            ? error.retryable
            : false;
        if (retryable) {
          this.requestLogger.onRetry({ providerName: this.providerName, url, attempt, error });
        }
        return retryable;
      },
      (lastError) => {
        this.requestLogger.onFailure({ providerName: this.providerName, url, attempt, error: lastError });
        if (
          (lastError instanceof ProviderHttpError ||
            lastError instanceof ProviderTimeoutError ||
            lastError instanceof ProviderParseError ||
            lastError instanceof ProviderValidationError) &&
          !lastError.retryable
        ) {
          return lastError;
        }
        return new ProviderRetriesExhaustedError(
          this.providerName,
          url,
          this.config.retry.maxAttempts,
          lastError,
        );
      },
    );
  }

  private async fetchAndValidate<S extends z.ZodTypeAny>(
    url: string,
    schema: S,
  ): Promise<z.infer<S>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": this.config.userAgent,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderTimeoutError(this.providerName, url, this.config.timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const retryable = this.config.retry.retryOnStatusCodes.includes(response.status);
      throw new ProviderHttpError(this.providerName, url, response.status, body, retryable);
    }

    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new ProviderParseError(this.providerName, url, error);
    }

    return validateOrThrow(schema, json, this.providerName, url);
  }
}
