"use client";

import { motion } from "framer-motion";
import { Card, Skeleton } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { motionPreset } from "@/lib/theme";

export interface RecentlyAddedCardProps {
  name: string;
  logoUrl?: string | null;
  category?: string | null;
  /** Pre-formatted relative date, e.g. "1d ago". */
  addedLabel: string;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * One row in the Recently Added feed. HOME_SCREEN_SPEC.md Section 3.9:
 * never shows a Score — newly-onboarded entities often lack enough data
 * for one yet, and a default/low value would mislead.
 */
export function RecentlyAddedCard({ name, logoUrl, category, addedLabel, onPress, isLoading, className }: RecentlyAddedCardProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2 ${className ?? ""}`}>
        <Skeleton variant="circle" className="size-7" />
        <Skeleton variant="line" className="flex-1" />
      </div>
    );
  }

  return (
    <motion.div {...motionPreset.fadeIn}>
      <Card pressable={Boolean(onPress)} onClick={onPress} variant="compact" className={className}>
        <div className="flex items-center gap-3">
          <CoinIcon src={logoUrl} symbol={name} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="line-clamp-1 text-[15px] font-medium leading-5 text-foreground">{name}</span>
            {category ? <p className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{category}</p> : null}
          </div>
          <span className="shrink-0 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{addedLabel}</span>
        </div>
      </Card>
    </motion.div>
  );
}
