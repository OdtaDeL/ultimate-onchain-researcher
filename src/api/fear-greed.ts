import { fetchFearGreedIndex } from "../providers/feargreed";
import { successResponse } from "./response";

export async function handleGetFearGreed(_request: Request): Promise<Response> {
  const snapshot = await fetchFearGreedIndex();
  return successResponse({
    value: snapshot.value,
    classification: snapshot.classification,
    updatedAt: snapshot.timestamp,
  });
}
