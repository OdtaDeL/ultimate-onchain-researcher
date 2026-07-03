// Centralized environment configuration — the ONLY file in this codebase
// allowed to read `process.env` directly. Every other module gets
// environment-specific values through the typed `env` object exported
// here, never through `process.env` itself (see DEVELOPER_GUIDE.md).
//
// Variables are validated lazily, on first access, not at module-import
// time. This app has two independent entry points with different
// requirements:
//   - the Next.js web app's API routes (src/app/api/**) need
//     SUPABASE_URL + SUPABASE_ANON_KEY (src/app/api/_lib/supabase-client.ts
//     uses the anon key so requests go through Postgres RLS);
//   - the ingestion CLI scripts (src/cli/*.ts) need SUPABASE_URL +
//     SUPABASE_SERVICE_ROLE_KEY (src/ingestion/chainbroker/
//     supabase-client.ts uses the service-role key to bypass RLS for
//     writes).
// Eagerly validating all three at import time would force a web-only
// deployment to provision a service-role secret it never uses (and vice
// versa for a CLI-only environment without the anon key). Each getter
// instead throws a descriptive error the first time ITS variable is
// read if missing, and caches the value on every subsequent read.

interface AppEnv {
  /** Supabase project URL. Required by both the web app and ingestion CLI. */
  readonly SUPABASE_URL: string;
  /** Supabase anon/public key — used by the web app's read-only API routes so requests go through RLS like any other anonymous client. Never used for writes. */
  readonly SUPABASE_ANON_KEY: string;
  /** Supabase service-role key — bypasses RLS entirely. Used ONLY by the ingestion CLI scripts (src/cli/*.ts) for writes; never imported by anything reachable from an HTTP request. */
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  /** Telegram Bot Token — optional. When present, proxy.ts verifies every /api/* request's Telegram initData HMAC-SHA256 signature in production. Obtain from @BotFather. Without this, initData verification is skipped (safe for development). */
  readonly TELEGRAM_BOT_TOKEN: string | undefined;
}

const cache = new Map<keyof AppEnv, string>();

function readRequired(name: keyof AppEnv): string {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your .env file — see .env.example for the full list of required variables and where each value comes from.`,
    );
  }

  cache.set(name, value);
  return value;
}

export const env: AppEnv = {
  get SUPABASE_URL() {
    return readRequired("SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return readRequired("SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return readRequired("SUPABASE_SERVICE_ROLE_KEY");
  },
  get TELEGRAM_BOT_TOKEN() {
    return process.env.TELEGRAM_BOT_TOKEN || undefined;
  },
};

export type Env = typeof env;
