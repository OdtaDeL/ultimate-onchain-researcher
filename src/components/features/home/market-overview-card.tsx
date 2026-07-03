"use client";

import { motion } from "framer-motion";
import { Card, Divider, Skeleton } from "@/components/ui";
import { CoinIcon, NumberFormatter, Percentage, PriceFormatter } from "@/components/shared";
import { motionPreset } from "@/lib/theme";
import type { MarketAsset } from "./types";

export interface MarketOverviewCardProps {
  /** Exactly 3 peer assets (BTC/ETH/BNB on Home) — equal visual weight, no single asset emphasized. */
  assets: MarketAsset[];
  totalMarketCap: number;
  totalMarketCapChangePercent24h: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * One-glance macro market context. HOME_SCREEN_SPEC.md Section 3.3: fixed
 * composition (3-asset row + divider + market-cap row) — never duplicated
 * elsewhere, never scrolls internally. Fear & Greed is its own component
 * (FearGreedCard) per this task's component split.
 */
export function MarketOverviewCard({ assets, totalMarketCap, totalMarketCapChangePercent24h, isLoading, className }: MarketOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <div className="flex justify-between">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton variant="circle" className="size-8" />
              <Skeleton variant="line" className="w-12" />
              <Skeleton variant="line" className="w-10" />
            </div>
          ))}
        </div>
        <Divider variant="full" className="my-3" />
        <Skeleton variant="line" className="w-full" />
      </Card>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card className={className}>
        <div className="flex justify-between">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex flex-1 flex-col items-center gap-2 text-center">
              <CoinIcon src={asset.logoUrl} symbol={asset.symbol} size="sm" />
              <PriceFormatter value={asset.price} className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground" />
              <Percentage value={asset.changePercent24h} className="text-[13px]" />
            </div>
          ))}
        </div>

        <Divider variant="full" className="my-3" />

        <div className="flex items-center justify-between">
          <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">Total Market Cap</span>
          <div className="flex items-center gap-2">
            <NumberFormatter value={totalMarketCap} className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-foreground" />
            <Percentage value={totalMarketCapChangePercent24h} className="text-[13px]" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
