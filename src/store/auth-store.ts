import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// Client-side identity state only — no fetching here. AppContainer reads
// `initDataUnsafe.user` from the Telegram WebApp SDK and calls
// `setIdentity` once on mount. Not persisted: re-deriving identity from
// Telegram's own init data each session is correct; caching a stale
// identity across sessions isn't.
export interface TelegramIdentity {
  id: number;
  firstName: string;
  username?: string;
}

interface AuthState {
  identity: TelegramIdentity | null;
}

interface AuthActions {
  setIdentity: (identity: TelegramIdentity) => void;
  clearIdentity: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),
  clearIdentity: () => set({ identity: null }),
}));

export const useAuthIdentity = () => useAuthStore((s) => s.identity);
export const useIsAuthenticated = () => useAuthStore((s) => s.identity !== null);

export const useAuthActions = () =>
  useAuthStore(
    useShallow((s) => ({
      setIdentity: s.setIdentity,
      clearIdentity: s.clearIdentity,
    })),
  );
