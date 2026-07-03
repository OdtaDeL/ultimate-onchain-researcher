export class IngestionUpsertError extends Error {
  constructor(readonly table: string, readonly cause: unknown) {
    super(`Upsert into "${table}" failed: ${String((cause as { message?: string })?.message ?? cause)}`);
    this.name = "IngestionUpsertError";
  }
}

/** Thrown when a draft references a project/fund that hasn't been ingested yet. */
export class IngestionPrerequisiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionPrerequisiteError";
  }
}
