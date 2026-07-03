/**
 * Mirrors each screen's existing SIMULATED_LOAD_MS pattern so swapping a
 * source from mock data to a real fetch doesn't change perceived loading
 * behavior. Real `apiFetch` calls have their own natural network latency
 * and won't need this.
 */
export function simulateLatency(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
