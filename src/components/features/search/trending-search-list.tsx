"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/layout";
import { motionPreset, duration, easing, staggerDelay } from "@/lib/theme";

export interface TrendingSearchListProps {
  items: string[];
  onSelect: (query: string) => void;
  className?: string;
}

/**
 * "TRENDING THIS WEEK" section on the Search screen's default (no-query)
 * state. DESIGN_SYSTEM.md Search spec 3.4: no remove action — this is
 * cross-user activity, not personal data.
 */
export function TrendingSearchList({ items, onSelect, className }: TrendingSearchListProps) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <SectionHeader title="Trending This Week" />
      <div className="flex flex-col px-4">
        {items.map((item, index) => (
          <motion.div
            key={item}
            {...motionPreset.fadeIn}
            transition={{ duration: duration.quick.s, ease: easing.easeOut, delay: index * staggerDelay }}
            className="flex h-12 items-stretch gap-3"
          >
            <TrendingUp size={16} className="shrink-0 self-center text-muted-foreground" />
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="line-clamp-1 flex flex-1 items-center self-stretch text-left text-[15px] font-medium leading-5 text-foreground"
            >
              {item}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
