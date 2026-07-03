// Minimal typed surface of `window.Telegram.WebApp`, scoped to what the UI
// Foundation needs (safe areas, theme params, viewport, ready/expand).
// Verified against the official Telegram Bot API WebApps docs:
// https://core.telegram.org/bots/webapps — loaded via the official script
// (`https://telegram.org/js/telegram-web-app.js`), not a third-party npm
// package: Telegram does not publish one, so wrapping the documented global
// directly is more source-driven than depending on an unofficial wrapper.
//
// Extend this file as additional documented fields are actually needed —
// do not widen it speculatively.

export interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  [key: string]: string | undefined;
}

export type TelegramColorScheme = "light" | "dark";

/** Telegram WebApp user — sourced from initDataUnsafe (display only; NOT verified). */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_premium?: boolean;
}

/** Parsed but unverified launch params. Fields vary by entry point. */
export interface TelegramInitDataUnsafe {
  user?: TelegramUser;
  [key: string]: unknown;
}

export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  /** Opens a URL in the user's default browser. Preferred over window.open inside Telegram. */
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  readonly platform: string;
  readonly colorScheme: TelegramColorScheme;
  readonly themeParams: TelegramThemeParams;
  readonly viewportHeight: number;
  readonly viewportStableHeight: number;
  readonly isExpanded: boolean;
  readonly safeAreaInset: TelegramSafeAreaInset;
  readonly contentSafeAreaInset: TelegramSafeAreaInset;
  /** Raw URL-encoded launch parameters — send to the server as-is for HMAC-SHA256 verification (D-008). Empty string outside Telegram context. */
  readonly initData: string;
  /** Parsed but unverified user data — safe for display; never for authorization. */
  readonly initDataUnsafe: TelegramInitDataUnsafe;
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
