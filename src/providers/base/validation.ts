import type { z } from "zod";
import { ProviderValidationError } from "./errors";

/** Validates `json` against `schema`, throwing a generic ProviderValidationError (never retryable) on mismatch. */
export function validateOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  json: unknown,
  providerName: string,
  url: string,
): z.infer<S> {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ProviderValidationError(providerName, url, result.error.issues);
  }
  return result.data;
}
