// Manual/on-demand sync trigger — NOT scheduled by Vercel Cron anymore.
// `maxDuration` below only takes effect on a Vercel Pro plan; this project
// runs on Hobby, which hard-caps every serverless function at 10 seconds
// regardless of this value, and a full sync takes tens of minutes. The
// actual daily schedule is `.github/workflows/sync.yml`, which runs the
// same `npm run sync:*` CLI commands directly on a GitHub Actions runner
// (no serverless timeout there). This endpoint is kept for manually
// triggering a *partial* run within the 10s budget (e.g. one phase) or for
// future use if this project ever moves to a Pro plan.
export const maxDuration = 300;

import { handleCronSync } from "@/api/cron";

export async function GET(request: Request): Promise<Response> {
  return handleCronSync(request);
}
