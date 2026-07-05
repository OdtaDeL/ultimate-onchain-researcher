import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "./lib/safe-storage";

// Persisted user preferences. Written by the dark/light toggle on /settings
// and tracked automatically on first launch for onboarding.
export type ThemePreference = "dark" | "light";

interface SettingsState {
  theme: ThemePreference;
  onboardingDone: boolean;
}

interface SettingsActions {
  setTheme: (theme: ThemePreference) => void;
  completeOnboarding: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      onboardingDone: false,
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: "settings",
      storage: safeJSONStorage<SettingsState>(),
      partialize: (state) => ({ theme: state.theme, onboardingDone: state.onboardingDone }),
    },
  ),
);

export const useThemePreference = () => useSettingsStore((s) => s.theme);
export const useSetTheme = () => useSettingsStore((s) => s.setTheme);
export const useOnboardingDone = () => useSettingsStore((s) => s.onboardingDone);
export const useCompleteOnboarding = () => useSettingsStore((s) => s.completeOnboarding);
