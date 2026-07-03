import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { safeJSONStorage } from "./lib/safe-storage";

export type SearchResultTab = "all" | "projects" | "funds" | "platforms";

const MAX_RECENT_SEARCHES = 10;

// Seeds the same 3 terms the Search screen's old local `useState` started
// with, so a first-ever visit (nothing in localStorage yet) looks
// identical to before this store existed.
const DEFAULT_RECENT_SEARCHES = ["Celestia", "a16z Crypto", "Ethereum"];

interface SearchState {
  query: string;
  activeTab: SearchResultTab;
  recentSearches: string[];
}

interface SearchActions {
  setQuery: (query: string) => void;
  clearQuery: () => void;
  setActiveTab: (tab: SearchResultTab) => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

type SearchStore = SearchState & SearchActions;

interface PersistedSearchState {
  recentSearches: string[];
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      query: "",
      activeTab: "all",
      recentSearches: DEFAULT_RECENT_SEARCHES,
      setQuery: (query) => set({ query, activeTab: "all" }),
      clearQuery: () => set({ query: "" }),
      setActiveTab: (activeTab) => set({ activeTab }),
      addRecentSearch: (term) =>
        set((state) => ({
          recentSearches: [term, ...state.recentSearches.filter((existing) => existing !== term)].slice(0, MAX_RECENT_SEARCHES),
        })),
      removeRecentSearch: (term) => set((state) => ({ recentSearches: state.recentSearches.filter((existing) => existing !== term) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "search",
      storage: safeJSONStorage<PersistedSearchState>(),
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    },
  ),
);

// query/activeTab are live UI state (not persisted: re-opening Search
// should start from a clean slate, not a stale query) — only
// recentSearches is restored from storage above.
export const useSearchQuery = () => useSearchStore((s) => s.query);
export const useSearchActiveTab = () => useSearchStore((s) => s.activeTab);
export const useRecentSearches = () => useSearchStore((s) => s.recentSearches);

export const useSearchActions = () =>
  useSearchStore(
    useShallow((s) => ({
      setQuery: s.setQuery,
      clearQuery: s.clearQuery,
      setActiveTab: s.setActiveTab,
      addRecentSearch: s.addRecentSearch,
      removeRecentSearch: s.removeRecentSearch,
      clearRecentSearches: s.clearRecentSearches,
    })),
  );
