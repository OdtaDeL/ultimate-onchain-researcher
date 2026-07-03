"use client";

import { motion } from "framer-motion";
import { Avatar, Card, Skeleton } from "@/components/ui";
import { Percentage } from "@/components/shared";
import { SectionHeader } from "@/components/layout";
import { duration, easing, motionPreset, staggerDelay } from "@/lib/theme";

export interface TrendingItem {
  id: string;
  name: string;
  logoUrl?: string | null;
  /** Pre-formatted by the caller — Score for projects, portfolio count for funds, nothing for platforms. Keeps this component entity-agnostic. */
  metricLabel?: string;
  changePercent?: number;
  onPress?: () => void;
}

export interface TrendingSectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: TrendingItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  className?: string;
  /** Skip the built-in SectionHeader — used when an outer container (e.g. a tabbed Trending section) already renders a shared header above the active list. */
  hideHeader?: boolean;
}

const CARD_WIDTH = 140;

/**
 * Reusable horizontal-carousel section — the one shell behind each Trending
 * tab's list on Home (HOME_SCREEN_SPEC.md Section 3.5). Free-scroll (no
 * snap), partial peek of the next card at the trailing edge to signal "more
 * exists" (DESIGN_SYSTEM Rule 44) — the horizontal swipe gesture itself is
 * this component's "Slide" interaction.
 */
export function TrendingSection({ title, actionLabel, onAction, items, isLoading, skeletonCount = 5, emptyMessage, className, hideHeader }: TrendingSectionProps) {
  return (
    <div className={className}>
      {hideHeader ? null : (
        <SectionHeader title={title} action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined} />
      )}

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto px-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} variant="block" style={{ width: CARD_WIDTH }} className="h-[120px] shrink-0" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{emptyMessage ?? "Nothing to show yet."}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none]">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              {...motionPreset.fadeIn}
              transition={{ duration: duration.quick.s, ease: easing.easeOut, delay: index * staggerDelay }}
              className="shrink-0"
              style={{ width: CARD_WIDTH }}
            >
              <Card pressable={Boolean(item.onPress)} onClick={item.onPress} variant="compact" className="flex h-[120px] flex-col items-center justify-center gap-1.5 text-center">
                <Avatar src={item.logoUrl} alt={item.name} fallback={item.name} size="md" />
                <span className="line-clamp-1 text-[15px] font-medium leading-5 text-foreground">{item.name}</span>
                {item.metricLabel ? <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{item.metricLabel}</span> : null}
                {item.changePercent !== undefined ? <Percentage value={item.changePercent} className="text-[13px]" /> : null}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
