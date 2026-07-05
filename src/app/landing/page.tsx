import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ultimate Onchain Researcher — Crypto Research for Telegram",
  description:
    "Discover, score, and track onchain projects and venture funds. Weekly rankings, funding rounds, token unlock alerts — all inside Telegram.",
};

const FEATURES = [
  {
    label: "Scoring Engine",
    description:
      "Transparent 0–100 score across funding quality, TVL, market momentum, and token unlock risk — so you can compare projects at a glance.",
  },
  {
    label: "Weekly Rankings",
    description:
      "Top-ranked projects updated every week from live on-chain and funding data. No noise, no opinion — just the numbers.",
  },
  {
    label: "Funding Tracker",
    description:
      "Track funding rounds, investor participation, and recent fundraises across the ecosystem.",
  },
  {
    label: "Token Unlock Alerts",
    description:
      "See upcoming unlock schedules and supply percentages so you are never caught off guard by a cliff.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 text-[48px] leading-none" aria-hidden>
          🔍
        </div>

        <h1 className="mb-3 text-[28px] font-bold leading-[34px] tracking-[-0.2px] text-foreground">
          Ultimate Onchain Researcher
        </h1>

        <p className="mb-10 max-w-sm text-[17px] font-normal leading-[24px] text-muted-foreground">
          Discover, score, and track crypto projects and venture funds — right inside Telegram.
        </p>

        {/* CTA */}
        {/* TODO: replace YourBotUsername with the real Telegram bot handle before launch */}
        <a
          href="https://t.me/YourBotUsername"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-12 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-[15px] font-semibold leading-5 text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          Open in Telegram
        </a>

        {/* Features */}
        <ul className="w-full max-w-md space-y-4 text-left">
          {FEATURES.map(({ label, description }) => (
            <li key={label} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-primary">✓</span>
              <div>
                <span className="text-[15px] font-semibold leading-5 text-foreground">{label}</span>
                <span className="text-[15px] font-normal leading-5 text-muted-foreground">
                  {" — "}
                  {description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
        Data aggregated from public on-chain sources and updated daily.
      </footer>
    </div>
  );
}
