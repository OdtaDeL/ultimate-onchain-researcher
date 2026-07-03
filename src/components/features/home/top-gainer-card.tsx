"use client";

import { motion } from "framer-motion";
import { Card, Skeleton } from "@/components/ui";
import { CoinIcon, Percentage } from "@/components/shared";
import { motionPreset } from "@/lib/theme";

export interface TopGainerCardProps {
  rank: number;
  name: string;
  logoUrl?: string | null;
  changePercent: number;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Top Gainers list. HOME_SCREEN_SPEC.md Section 3.7: pure
 * price-performance row — no Score (Gainers ranks by 24h%, not research
 * quality; conflating the two is a data-integrity mistake).
 */
export function TopGainerCard({ rank, name, logoUrl, changePercent, onPress, isLoading, className }: TopGainerCardProps) {
  if (isLoading) {
    return (
      <div className={`flex h-14 items-center gap-3 px-4 ${className ?? ""}`}>
        <Skeleton variant="line" className="w-4" />
        <Skeleton variant="circle" className="size-7" />
        <Skeleton variant="line" className="flex-1" />
      </div>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={`flex items-center gap-3 ${className ?? ""}`}>
        <span className="w-4 shrink-0 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{rank}</span>
        <CoinIcon src={logoUrl} symbol={name} size="sm" />
        <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>
        <Percentage value={changePercent} />
      </Card>
    </motion.div>
  );
}
