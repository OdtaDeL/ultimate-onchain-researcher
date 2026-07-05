// Alternative.me Fear & Greed Index — https://api.alternative.me/fng/
// Free and unauthenticated; updates once daily. No rate-limit concerns for
// single-request usage from the /api/fear-greed route handler.
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

interface AlternativeMeResponse {
  data: Array<{
    value: string;               // stringified integer, e.g. "72"
    value_classification: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
    timestamp: string;            // Unix seconds as a string, e.g. "1720051200"
  }>;
  metadata: { error: string | null };
}

export interface FearGreedSnapshot {
  value: number;
  classification: string;
  timestamp: number; // Unix seconds
}

export async function fetchFearGreedIndex(): Promise<FearGreedSnapshot> {
  const response = await fetch(FEAR_GREED_URL);
  if (!response.ok) {
    throw new Error(`Fear & Greed API returned ${response.status}`);
  }
  const body: AlternativeMeResponse = await response.json();
  if (body.metadata?.error) {
    throw new Error(`Fear & Greed API error: ${body.metadata.error}`);
  }
  const entry = body.data?.[0];
  if (!entry) {
    throw new Error("Fear & Greed API returned no data");
  }
  return {
    value: parseInt(entry.value, 10),
    classification: entry.value_classification,
    timestamp: parseInt(entry.timestamp, 10),
  };
}
