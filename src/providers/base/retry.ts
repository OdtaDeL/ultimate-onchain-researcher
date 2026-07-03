// Generic attempt/backoff/jitter loop, extracted from ChainBrokerClient's
// original `getJson`. Provider-agnostic: it knows nothing about HTTP,
// only about "run this, and if it fails in a retryable way, try again."

import type { BaseProviderRetryConfig } from "./config";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` up to `retry.maxAttempts` times. `classifyRetryable` decides
 * whether a thrown error is worth retrying; on the final non-retryable (or
 * exhausted) failure, `onExhausted` is called with the last error and its
 * return value is thrown.
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retry: BaseProviderRetryConfig,
  classifyRetryable: (error: unknown) => boolean,
  onExhausted: (lastError: unknown) => unknown,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = classifyRetryable(error);

      if (!retryable || attempt === retry.maxAttempts) {
        break;
      }

      const backoffMs = retry.baseDelayMs * 2 ** (attempt - 1);
      const jitterMs = Math.random() * retry.baseDelayMs;
      await sleep(backoffMs + jitterMs);
    }
  }

  throw onExhausted(lastError);
}
