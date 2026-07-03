// Job-level retry: wraps one whole page-ingestion call (ChainBroker fetch
// + Supabase upsert together). This is a different layer from the
// ChainBrokerClient's own internal HTTP retry (src/providers/chainbroker/
// client.ts) — that one recovers from a single flaky request; this one
// recovers a whole page if, say, the Supabase upsert step fails after the
// fetch already succeeded, without re-running the entire job from page 1.

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === options.maxAttempts) break;
      options.onRetry?.(attempt, error);
      const backoffMs = options.baseDelayMs * 2 ** (attempt - 1);
      const jitterMs = Math.random() * options.baseDelayMs;
      await sleep(backoffMs + jitterMs);
    }
  }
  throw lastError;
}
