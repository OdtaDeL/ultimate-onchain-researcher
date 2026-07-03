"use client";

import { useEffect, useState } from "react";
import type { TelegramSafeAreaInset, TelegramUser, TelegramWebApp } from "./types";

const ZERO_INSET: TelegramSafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 };

export interface TelegramWebAppState {
  /** True once `window.Telegram.WebApp` was found (i.e. running inside Telegram). */
  isAvailable: boolean;
  safeAreaInset: TelegramSafeAreaInset;
  contentSafeAreaInset: TelegramSafeAreaInset;
  colorScheme: "light" | "dark";
  platform: string | null;
  /** Parsed but unverified user from initDataUnsafe — null outside Telegram or when absent. Safe for display only, never for authorization. */
  user: TelegramUser | null;
}

const FALLBACK_STATE: TelegramWebAppState = {
  isAvailable: false,
  safeAreaInset: ZERO_INSET,
  contentSafeAreaInset: ZERO_INSET,
  colorScheme: "dark",
  platform: null,
  user: null,
};

/**
 * Foundation-only access to the Telegram WebApp SDK: reads safe-area insets
 * and color scheme, and (optionally) calls the documented `ready()`/`expand()`
 * bootstrap. Degrades gracefully outside Telegram (plain browser, SSR) so
 * every consuming component still renders — no business logic, no data
 * fetching, just SDK presence + the fields SafeArea/AppContainer need.
 */
export function useTelegramWebApp(options: { autoReady?: boolean; autoExpand?: boolean } = {}): TelegramWebAppState {
  const { autoReady = true, autoExpand = true } = options;
  const [state, setState] = useState<TelegramWebAppState>(FALLBACK_STATE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const webApp: TelegramWebApp | undefined = window.Telegram?.WebApp;
    if (!webApp) return;

    if (autoReady) webApp.ready();
    if (autoExpand) webApp.expand();

    const readState = () =>
      setState({
        isAvailable: true,
        safeAreaInset: webApp.safeAreaInset ?? ZERO_INSET,
        contentSafeAreaInset: webApp.contentSafeAreaInset ?? ZERO_INSET,
        colorScheme: webApp.colorScheme ?? "dark",
        platform: webApp.platform ?? null,
        user: webApp.initDataUnsafe?.user ?? null,
      });

    readState();

    webApp.onEvent("viewportChanged", readState);
    webApp.onEvent("themeChanged", readState);
    return () => {
      webApp.offEvent("viewportChanged", readState);
      webApp.offEvent("themeChanged", readState);
    };
  }, [autoReady, autoExpand]);

  return state;
}
