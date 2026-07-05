import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// Cross-cutting, ephemeral UI state that doesn't belong to one feature
// store: the Markets tab selection and the Telegram WebApp viewport
// snapshot. None of this is persisted — it's either re-derived from the
// Telegram SDK on every load (viewport) or a transient browsing choice
// that shouldn't survive a reload (tab).
export type MarketsTab = "projects" | "funds";

export interface TelegramInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramViewportState {
  isAvailable: boolean;
  colorScheme: "light" | "dark";
  platform: string | null;
  safeAreaInset: TelegramInset;
  contentSafeAreaInset: TelegramInset;
}

const ZERO_INSET: TelegramInset = { top: 0, bottom: 0, left: 0, right: 0 };

const DEFAULT_TELEGRAM_VIEWPORT: TelegramViewportState = {
  isAvailable: false,
  colorScheme: "dark",
  platform: null,
  safeAreaInset: ZERO_INSET,
  contentSafeAreaInset: ZERO_INSET,
};

interface UiState {
  marketsTab: MarketsTab;
  telegramViewport: TelegramViewportState;
}

interface UiActions {
  setMarketsTab: (tab: MarketsTab) => void;
  setTelegramViewport: (viewport: TelegramViewportState) => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()((set) => ({
  marketsTab: "projects",
  telegramViewport: DEFAULT_TELEGRAM_VIEWPORT,
  setMarketsTab: (marketsTab) => set({ marketsTab }),
  setTelegramViewport: (telegramViewport) => set({ telegramViewport }),
}));

export const useMarketsTab = () => useUiStore((s) => s.marketsTab);
export const useTelegramViewport = () => useUiStore((s) => s.telegramViewport);

export const useUiActions = () =>
  useUiStore(
    useShallow((s) => ({
      setMarketsTab: s.setMarketsTab,
      setTelegramViewport: s.setTelegramViewport,
    })),
  );
