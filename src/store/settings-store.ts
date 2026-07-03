import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "./lib/safe-storage";

// Persisted user preferences. Theme is the only preference today —
// defaults to "dark" (DESIGN_SYSTEM.md Section 5 primary theme). Written
// by the dark/light toggle on /settings; applied in AppContainer via the
// `.dark` class on the root element.
export type ThemePreference = "dark" | "light";

interface SettingsState {
  theme: ThemePreference;
}

interface SettingsActions {
  setTheme: (theme: ThemePreference) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "settings",
      storage: safeJSONStorage<SettingsState>(),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

export const useThemePreference = () => useSettingsStore((s) => s.theme);
export const useSetTheme = () => useSettingsStore((s) => s.setTheme);
