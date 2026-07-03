import { createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

// zustand's persist middleware calls `getStorage()` synchronously the
// moment a persisted store module is evaluated (zustand/esm/middleware.mjs:
// `createJSONStorage` invokes its `getStorage` argument immediately, not
// lazily on first read). This app's pages are statically prerendered by
// Next.js (`npm run build` emits "○ (Static)" for every route), which
// means every "use client" module — including store modules — is also
// evaluated once in Node during that prerender pass, where `window`
// doesn't exist. Referencing `window.localStorage` directly at module
// scope would throw there, so every persisted store in this app must go
// through this guarded storage instead of `createJSONStorage(() =>
// window.localStorage)` directly.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function safeJSONStorage<S>() {
  return createJSONStorage<S>(() => (typeof window !== "undefined" ? window.localStorage : noopStorage));
}
