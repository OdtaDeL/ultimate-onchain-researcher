"use client";

import { motion } from "framer-motion";
import { Card, Skeleton } from "@/components/ui";
import { CoinIcon, NumberFormatter } from "@/components/shared";
import { motionPreset } from "@/lib/theme";

export interface PlatformRowCardProps {
  protocol: string;
  logoUrl?: string | null;
  tvl: number;
  revenue: number;
  fees: number;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Markets "Platforms" list. Platforms have no Score and no
 * funding stage — their at-a-glance question is protocol-level health (TVL,
 * revenue, fees), not research quality. A genuinely different entity shape
 * from Projects, not a missing-field variant of it.
 */
export function PlatformRowCard({ protocol, logoUrl, tvl, revenue, fees, onPress, isLoading, className }: PlatformRowCardProps) {
  if (isLoading) {
    return (
      <Card variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="size-8" />
          <Skeleton variant="line" className="flex-1" />
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skeleton variant="line" className="w-16" />
            <Skeleton variant="line" className="w-20" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <CoinIcon src={logoUrl} symbol={protocol} size="md" />
          <span className="line-clamp-1 flex-1 text-[15px] font-medium leading-5 text-foreground">{protocol}</span>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-[13px] leading-[18px] tracking-[0.1px]">
            <span className="text-foreground">
              TVL $<NumberFormatter value={tvl} />
            </span>
            <span className="text-muted-foreground">
              Rev $<NumberFormatter value={revenue} /> · Fees $<NumberFormatter value={fees} />
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
