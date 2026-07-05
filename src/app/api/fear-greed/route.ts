// Cache for 1 hour: the Fear & Greed Index updates once daily; hourly
// revalidation is more than fresh enough.
export const revalidate = 3600;

import { handleGetFearGreed, toErrorResponse } from "@/api";

export async function GET(request: Request): Promise<Response> {
  try {
    return await handleGetFearGreed(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}
