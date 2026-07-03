// Structured request-level logging extension point. Distinct from the
// job-level logger in src/sync/<provider>/logger.ts — this is lower in the
// stack, one level per HTTP request/retry/failure, and optional.
//
// Default behavior must stay a no-op: ChainBroker's existing client never
// logged at the request level, and wiring this in must not change that
// (see SYSTEM_ARCHITECTURE.md "Existing ChainBroker behavior must remain
// unchanged").

export interface RequestLogEvent {
  providerName: string;
  url: string;
  attempt: number;
}

export interface RequestLogger {
  onRequest(event: RequestLogEvent): void;
  onRetry(event: RequestLogEvent & { error: unknown }): void;
  onFailure(event: RequestLogEvent & { error: unknown }): void;
}

export class NoopRequestLogger implements RequestLogger {
  onRequest(): void {}
  onRetry(): void {}
  onFailure(): void {}
}
