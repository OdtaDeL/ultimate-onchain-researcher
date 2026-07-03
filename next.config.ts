import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Project and fund logos ingested from Chainbroker (src/ingestion/chainbroker/)
      { protocol: "https", hostname: "static.chainbroker.io" },
      // Coin logos from CoinGecko — not stored today but whitelisted ahead of
      // a metrics-logo expansion so next/image doesn't block on first use
      { protocol: "https", hostname: "coin-images.coingecko.com" },
    ],
  },
};

export default nextConfig;
