// Liveness probe — no DB call, no auth required, bypasses the rate-limiter
// (see src/proxy.ts). Used by Vercel / load balancers to confirm the app is
// alive. Returns 200 as long as the Next.js runtime is responsive.
export async function GET(): Promise<Response> {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
