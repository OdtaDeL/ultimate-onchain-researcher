"use client";

import { Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/layout";
import { motionPreset, duration, easing, staggerDelay } from "@/lib/theme";

export interface RecentSearchListProps {
  items: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * "RECENT" section on the Search screen's default (no-query) state.
 * DESIGN_SYSTEM.md Search spec 3.4: hidden entirely when empty — never a
 * "No recent searches" message — and each row carries its own remove
 * action ("✕", 44px tap zone) alongside a "Clear all" header action.
 */
export function RecentSearchList({ items, onSelect, onRemove, onClearAll, className }: RecentSearchListProps) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <SectionHeader title="Recent" action={{ label: "Clear all", onClick: onClearAll }} />
      <div className="flex flex-col px-4">
        {items.map((item, index) => (
          <motion.div
            key={item}
            {...motionPreset.fadeIn}
            transition={{ duration: duration.quick.s, ease: easing.easeOut, delay: index * staggerDelay }}
            className="flex h-12 items-stretch gap-3"
          >
            <Clock size={16} className="shrink-0 self-center text-muted-foreground" />
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="line-clamp-1 flex flex-1 items-center self-stretch text-left text-[15px] font-medium leading-5 text-foreground"
            >
              {item}
            </button>
            <button
              type="button"
              onClick={() => onRemove(item)}
              aria-label={`Remove ${item} from recent searches`}
              className="flex size-11 shrink-0 items-center justify-center self-center text-muted-foreground"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
