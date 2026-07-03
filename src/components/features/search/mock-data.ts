// Mock data for the Search screen.
// mockTrendingSearches is live — imported by src/lib/api/sources/search.ts
//   for the Trending Searches list (no backend DTO yet).
// mockRecentSearches is a dead export — the search page reads recent
//   searches from the Zustand store, not from this file.
export const mockRecentSearches: string[] = ["Celestia", "a16z Crypto", "Ethereum"];

export const mockTrendingSearches: string[] = ["EigenLayer", "Berachain", "Solana", "Wormhole"];
