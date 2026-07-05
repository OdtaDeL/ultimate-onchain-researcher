# Deployment Guide

This document is the authoritative reference for deploying Ultimate Onchain Researcher to
production. `vercel.json` at the repo root is the authoritative env var list — this doc explains
each variable and the deployment steps.

---

## Environment Variables

All variables are validated by `src/config/env.ts` — the only file in the codebase that reads
`process.env` directly. No other module reads environment variables; everything goes through the
typed `env` object exported from that file.

| Variable | Required for web app | Required for ingestion CLI | Description | Where to get the value |
| --- | --- | --- | --- | --- |
| `SUPABASE_URL` | Yes | Yes | Supabase project URL, e.g. `https://xxxxxxxxxxxx.supabase.co` | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Yes | No | Supabase anonymous/public key. Used by read-only API routes; requests go through RLS. Safe to set as a plain env var (not a secret). | Supabase Dashboard → Project Settings → API → `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Yes | Supabase service-role key. Bypasses RLS entirely — used only by `npm run sync:*` ingestion scripts for writes. Treat as a high-privilege secret; never expose to a browser or commit it. | Supabase Dashboard → Project Settings → API → `service_role` key |
| `TELEGRAM_BOT_TOKEN` | Optional | No | When set in production, `src/proxy.ts` verifies every `/api/*` request's Telegram initData HMAC-SHA256 signature. Without it, verification is skipped (safe for development). Obtain from [@BotFather](https://t.me/BotFather). | Telegram: chat with @BotFather → `/newbot` or `/mybots` |
| `CRON_SECRET` | Optional | No | When set, `GET /api/cron/sync` requires `Authorization: Bearer <CRON_SECRET>`. Vercel sets this header automatically on scheduled cron invocations. Without it, the endpoint is unprotected (safe for development, **not recommended for production**). Generate any long random string. | `openssl rand -hex 32` or any secrets manager |

**Notes:**

- The web app (`npm run dev` / `build` / `start`) only needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  and optionally `TELEGRAM_BOT_TOKEN`. It will start and serve requests without `SUPABASE_SERVICE_ROLE_KEY`.
- The ingestion CLI (`npm run sync:*`) needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It
  does not need `SUPABASE_ANON_KEY` or `TELEGRAM_BOT_TOKEN`.
- Neither the web app nor the ingestion CLI require third-party API keys — ChainBroker and
  CoinGecko are accessed via their public (unauthenticated) endpoints.
- `NODE_ENV` is set automatically by Vercel (`production`) and Next.js (`development`/`test`);
  do not set it manually.

---

## Deploying to Vercel

### First deployment

1. Push the repository to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repository.
3. Vercel auto-detects Next.js and uses `vercel.json` for build/install commands.
4. Under **Environment Variables**, add each variable from the table above for the
   **Production** environment. For `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN`, set
   them as **Sensitive** (Vercel will not show the value after saving).
5. Click **Deploy**.

### Subsequent deployments

Pushing to the main branch triggers a deployment automatically. No manual steps required.

### Deploying via the Vercel CLI

`vercel.json` does **not** declare an `env` block — Vercel injects every Project Environment
Variable (set via the dashboard or `vercel env add`) into the build and runtime process
automatically; no per-variable mapping is needed. (The old `@secret-name` / `vercel secrets`
syntax this doc previously described has been removed from the Vercel platform — `vercel secrets`
no longer exists as a CLI command.)

```bash
vercel link                                          # link this directory to a Vercel project
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production   # sensitive — required for /api/cron/sync
vercel env add TELEGRAM_BOT_TOKEN production           # optional
vercel env add CRON_SECRET production                  # optional but recommended
vercel --prod                                          # deploy
```

---

## Local Development

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
# edit .env with your Supabase project credentials
npm run dev
```

The `.env` file is gitignored — never commit it.

---

## Running Ingestion Locally

The ingestion CLI runs outside Vercel (it is a Node.js script, not an HTTP handler). Run it with
the same `.env` file:

```bash
npm run sync:all        # fetch projects, funds, funding rounds, token unlocks
npm run sync:metrics    # fetch market data (price, TVL, etc.) from CoinGecko/DefiLlama
npm run sync:scores     # run scoring engine; refresh materialized views
```

Scheduled ingestion (Vercel Cron) is planned for Phase 5 — see ROADMAP.md.
