function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Serializes requests so no more than `maxRequestsPerSecond` start per second. */
export class RateLimiter {
  private nextAvailableAt = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly maxRequestsPerSecond: number) {}

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const intervalMs =
        this.maxRequestsPerSecond > 0 ? 1000 / this.maxRequestsPerSecond : 0;
      const now = Date.now();
      const waitMs = Math.max(0, this.nextAvailableAt - now);
      this.nextAvailableAt = Math.max(now, this.nextAvailableAt) + intervalMs;
      if (waitMs > 0) await sleep(waitMs);
    });
    this.queue = run;
    return run.then(fn);
  }
}
