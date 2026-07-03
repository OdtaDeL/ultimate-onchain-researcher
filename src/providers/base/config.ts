// Shared shape every provider's HTTP config follows. Concrete providers
// (e.g. chainbroker/provider.ts's `ChainBrokerProviderConfig`) extend this
// — usually as a plain alias, since the networking knobs are the same
// regardless of which API is on the other end.

export interface BaseProviderRetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  /** Status codes treated as transient (rate-limit/soft-block/upstream 5xx) rather than hard failures. */
  retryOnStatusCodes: number[];
}

export interface BaseProviderConfig {
  baseUrl: string;
  /** Identifies this client to the remote API; most unofficial APIs have no key-based auth. */
  userAgent: string;
  /** Per-request timeout in ms. */
  timeoutMs: number;
  /** Max requests per second this provider is allowed to issue. */
  maxRequestsPerSecond: number;
  retry: BaseProviderRetryConfig;
}

/** Deep-merges retry config so a caller can override one field (e.g. just maxAttempts) without restating the rest. */
export function mergeProviderConfig<C extends BaseProviderConfig>(
  defaults: C,
  overrides: Partial<C>,
): C {
  return {
    ...defaults,
    ...overrides,
    retry: { ...defaults.retry, ...overrides.retry },
  };
}
