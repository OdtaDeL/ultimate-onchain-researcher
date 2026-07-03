import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppContainer } from "@/components/layout";
import { QueryProvider } from "@/lib/query";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ultimate Onchain Researcher",
  description: "Crypto research companion for Telegram.",
};

// Never disable zoom (UI/UX guideline `viewport-meta`) — Telegram's own
// WebApp chrome handles pinch/zoom suppression where it matters; the web
// viewport meta itself stays permissive.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
         * Official Telegram WebApp script (https://core.telegram.org/bots/webapps)
         * — there is no official npm package, so this is the documented
         * integration path rather than an unofficial third-party wrapper.
         * `beforeInteractive` loads it ahead of hydration so
         * `window.Telegram.WebApp` and its `--tg-*` CSS variables are
         * available the moment any component reads them.
         */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <QueryProvider>
          <AppContainer>{children}</AppContainer>
        </QueryProvider>
      </body>
    </html>
  );
}
