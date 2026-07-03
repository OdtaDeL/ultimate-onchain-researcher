// Structured (JSON-line) logging. Always writes to stderr regardless of
// level — stdout is reserved for the sync job's final JSON report, so a
// CLI invocation can be piped/parsed without diagnostic noise mixed in.

export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
  /** Returns a new logger with `fields` merged into every subsequent line. */
  child(fields: LogFields): Logger;
}

export function createLogger(baseFields: LogFields = {}): Logger {
  function write(level: "info" | "warn" | "error", event: string, fields: LogFields = {}): void {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      ...baseFields,
      ...fields,
    });
    console.error(line);
  }

  return {
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields),
    child: (fields) => createLogger({ ...baseFields, ...fields }),
  };
}
