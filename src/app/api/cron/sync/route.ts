// Vercel Cron endpoint — triggered on the schedule defined in vercel.json.
// maxDuration extends the serverless function timeout to 5 minutes (requires
// Vercel Pro plan; capped at 10 s on Hobby). A full sync typically takes
// 1–3 minutes depending on ChainBroker page count and CoinGecko rate limits.
export const maxDuration = 300;

import { handleCronSync } from "@/api/cron";

export async function GET(request: Request): Promise<Response> {
  return handleCronSync(request);
}
