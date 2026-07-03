import type { DefaultOptions } from "@tanstack/react-query";

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;

/**
 * Telegram Mini Apps run inside a WebView that gets backgrounded constantly
 * (the user switches to a Telegram chat and back) and over mobile networks
 * that drop packets transiently rather than going cleanly offline. These
 * defaults are tuned for that environment specifically, not a generic
 * desktop SPA. Every value is explained below; per-query overrides belong
 * on individual `useQuery` calls in src/lib/api/hooks, not here.
 */
export const queryDefaults: DefaultOptions = {
  queries: {
    // 30s: the data behind every current hook (rankings, scores, fund/
    // project detail) doesn't change fast enough that re-fetching on
    // every remount or focus is worth a network round trip, but it's
    // short enough that re-opening the Mini App after a few minutes away
    // shows current-ish numbers without the user needing to pull-to-refresh.
    staleTime: 30 * ONE_SECOND,
    // 5 minutes: how long an unused query stays cached after its last
    // observer unmounts. Telegram users routinely background the app for
    // under 5 minutes (read a chat, come back) — keeping the cache that
    // long means returning to a screen renders the previous data
    // instantly while a background refetch (governed by staleTime above)
    // brings it current, instead of showing a skeleton again.
    gcTime: 5 * ONE_MINUTE,
    // 2 retries (3 attempts total): mobile connections drop packets
    // transiently; a couple of retries absorbs a one-off blip without the
    // user ever seeing an error. Not higher — repeatedly retrying a *real*
    // failure (e.g. a 4xx from a malformed request) just delays the error
    // state the UI needs to show.
    retry: 2,
    // Exponential backoff capped at 30s — same shape as TanStack Query's
    // own internal default, written out explicitly here so the cap is
    // visible without reading the library source.
    retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30 * ONE_SECOND),
    // Telegram's embedded WebView can report `navigator.onLine` is true
    // even when the actual connection backing the Mini App is degraded
    // (general WebView behavior — there is no Telegram-specific online/
    // offline API documented at https://core.telegram.org/bots/webapps to
    // override this). TanStack Query's default `networkMode: 'online'`
    // pauses queries whenever the browser reports offline, which risks
    // wrongly refusing to even attempt a request the WebView could have
    // completed. `'offlineFirst'` always attempts the fetch once and only
    // treats the query as paused after that attempt actually fails.
    networkMode: "offlineFirst",
    // Reconnecting after a dropped connection (subway, tunnel, app
    // backgrounded mid-fetch) is the one "the world changed, go refetch"
    // signal worth acting on automatically.
    refetchOnReconnect: true,
    // There is no real browser "window focus" concept inside a Telegram
    // WebView — switching to another Telegram chat and back doesn't
    // blur/focus this window the way alt-tabbing does on desktop, so this
    // event either never fires or fires on a signal that doesn't mean
    // what it means on desktop. `staleTime` above already governs when a
    // remount should trigger a background refetch; this would only add
    // surprise refetches on an unreliable signal.
    refetchOnWindowFocus: false,
  },
  mutations: {
    // Mutations must never auto-retry silently — retrying a write blind
    // to whether the first attempt actually applied risks duplicating the
    // side effect (e.g. submitting a watchlist add twice). No mutations
    // exist yet (see the "Future mutation plan" in the architecture
    // report), but this is the safe default for when they land.
    retry: 0,
  },
};
