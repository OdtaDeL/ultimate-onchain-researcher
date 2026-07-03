import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** "See all" / "View All" trailing action. SectionHeader's own text is never tappable as a whole (DESIGN_SYSTEM Rule 43) — only this explicit action is. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Labels a content block on a scrolling page ("WEEKLY PICKS", "MARKET
 * FEED"). COMPONENT_SPEC.md Section 4: 16px horizontal margin, 12px gap
 * below to the first content row (the gap above is the parent Section's
 * own margin, not duplicated here).
 */
export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between px-4", className)}>
      <div>
        <h2 className="text-[17px] font-semibold leading-[22px] text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="-m-3 flex items-center gap-0.5 p-3 text-[15px] font-semibold leading-5 text-accent"
        >
          {action.label}
          <ChevronRight size={16} />
        </button>
      ) : null}
    </div>
  );
}
