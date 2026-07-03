# 12 — Security Audit

## Authentication

- No user authentication currently
- All API endpoints are public (data is public crypto info)
- Telegram Mini App identity (`initData`) not yet verified server-side

## API Keys

| Key | Location | Risk |
|---|---|---|
| `SUPABASE_URL` | `.env` / Vercel env | Low — anon key is designed to be public |
| `SUPABASE_ANON_KEY` | `.env` / Vercel env | Low — RLS restricts to SELECT |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` (server-only) | **High if exposed** — must never be sent to browser |
| `CHAINBROKER_API_KEY` | `.env` (server-only) | High — keep out of frontend bundles |
| `COINGECKO_API_KEY` | `.env` (server-only) | Medium |

## Surface Area

- **SQL injection**: Supabase PostgREST uses parameterized queries — not vulnerable to injection
- **XSS**: React escapes JSX expressions by default; no `dangerouslySetInnerHTML` found
- **CSRF**: API routes are GET-only reads; no state mutation endpoints exist yet
- **Open redirect**: No redirect handlers found
- **Command injection**: No shell execution in the web server

## RLS (Row-Level Security)

- Anon role: SELECT on all tables ✅
- No INSERT/UPDATE/DELETE for anon role ✅
- Service role used only in CLI scripts (not in Vercel deployment) ✅

## Ingestion CLI Security

- CLI scripts run server-side with `SUPABASE_SERVICE_ROLE_KEY`
- Provider API keys never logged (confirm no `console.log(apiKey)`)
- External API responses are typed — but no schema validation (e.g. zod) at ingestion boundary

## Gaps to Address Before Auth Launch

1. Verify Telegram `initData` signature server-side before treating user as authenticated
2. Add rate limiting on API routes (e.g. `@upstash/ratelimit`)
3. Add zod validation on query params in API handlers
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is not in any client-side bundle (verify with `next build` output)
