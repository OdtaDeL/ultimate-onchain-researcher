import { create } from "zustand";

// Home's "Trending" segmented control selection — the one piece of
// interaction state the Home screen owns. Not persisted: which tab was
// open last session isn't meaningful to restore (it's a glance-level
// browsing choice, not a saved preference).
export type TrendingTab = "projects" | "funds";

interface HomeState {
  trendingTab: TrendingTab;
}

interface HomeActions {
  setTrendingTab: (tab: TrendingTab) => void;
}

type HomeStore = HomeState & HomeActions;

export const useHomeStore = create<HomeStore>()((set) => ({
  trendingTab: "projects",
  setTrendingTab: (trendingTab) => set({ trendingTab }),
}));

export const useTrendingTab = () => useHomeStore((s) => s.trendingTab);
export const useSetTrendingTab = () => useHomeStore((s) => s.setTrendingTab);
