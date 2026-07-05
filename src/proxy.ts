import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "./config/env";

// Per-IP sliding-window rate limiter for all /api/* routes.
//
// Works correctly for single-process deployments (VPS, Docker single-replica,
// PM2). Does NOT coordinate across separate processes — if deploying with
// multiple Node.js processes, replace ipWindows with an Upstash Redis store
// (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
const WINDOW_MS = 60_000; // 1-minute sliding window
const MAX_REQUESTS = 60; // requests per window per IP (1 req/s average)
const MAX_TRACKED_IPS = 10_000; // prune expired entries before this

const ipWindows = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [ip, window] of ipWindows) {
    if (now >= window.resetAt) ipWindows.delete(ip);
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Verifies Telegram Mini App initData against the bot token using HMAC-SHA256.
// Algorithm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//   secret_key = HMAC-SHA256(key="WebAppData", message=botToken)
//   expected   = hex(HMAC-SHA256(key=secret_key, message=data_check_string))
// Returns false for missing, malformed, or stale (> 24 h) initData.
async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  if (!initData) return false;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return false;
  }

  const hash = params.get("hash");
  if (!hash) return false;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > 86_400) return false;

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const encoder = new TextEncoder();

  const webAppDataKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const secretKeyBytes = await crypto.subtle.sign("HMAC", webAppDataKey, encoder.encode(botToken));

  const secretKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedBytes = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(dataCheckString));
  const expectedHash = Array.from(new Uint8Array(expectedBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedHash === hash;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // ── Health check bypass ──────────────────────────────────────────────────
  // /api/health is a liveness probe for Vercel / load balancers. It must
  // respond 200 unconditionally — before rate limiting and before Telegram
  // auth — so it never returns 429 or 401 under any condition.
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const now = Date.now();
  const record = ipWindows.get(ip);

  if (!record || now >= record.resetAt) {
    if (ipWindows.size >= MAX_TRACKED_IPS) pruneExpired();
    ipWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else if (record.count >= MAX_REQUESTS) {
    const retryAfterSecs = Math.ceil((record.resetAt - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSecs),
        },
      },
    );
  } else {
    record.count++;
  }

  // ── Telegram initData verification ───────────────────────────────────────
  // Active in production only when TELEGRAM_BOT_TOKEN is configured.
  // Skipped in development so the app works normally in a browser.
  // Tests bypass the proxy entirely (they call handlers directly).
  if (process.env.NODE_ENV === "production") {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      const initData = request.headers.get("x-telegram-init-data") ?? "";
      if (!(await verifyTelegramInitData(initData, botToken))) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Invalid or expired Telegram session." },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
