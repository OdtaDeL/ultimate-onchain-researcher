"use client";

import { motion } from "framer-motion";
import { Card, Pill, Skeleton } from "@/components/ui";
import { CoinIcon } from "@/components/shared";
import { motionPreset } from "@/lib/theme";
import type { RiskLevel } from "./types";

export interface UnlockAlertCardProps {
  slug?: string;
  name: string;
  logoUrl?: string | null;
  /** Pre-formatted, e.g. "Jul 2". */
  dateLabel: string;
  /** Null when the backend provides no percentOfSupply for this event. */
  percentOfSupply: number | null;
  /** Absent when no backend-authoritative risk threshold exists for this unlock. */
  riskLevel?: RiskLevel;
  onPress?: () => void;
  isLoading?: boolean;
  className?: string;
}

const riskVariant: Record<RiskLevel, "success" | "warning" | "danger"> = { low: "success", moderate: "warning", high: "danger" };
const riskLabel: Record<RiskLevel, string> = { low: "Low risk", moderate: "Moderate", high: "High risk" };

/**
 * One row in the Unlock Alerts feed. HOME_SCREEN_SPEC.md Section 3.10:
 * date leads (most scannable), risk severity always carries an explicit
 * word + color — never color alone (DESIGN_SYSTEM Section 12).
 */
export function UnlockAlertCard({ name, logoUrl, dateLabel, percentOfSupply, riskLevel, onPress, isLoading, className }: UnlockAlertCardProps) {
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
            <div className="flex items-center gap-1 text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">
              <span>{dateLabel}</span>
              <span>·</span>
              <span>{percentOfSupply !== null ? `${percentOfSupply.toFixed(1)}% supply` : "—"}</span>
            </div>
          </div>
          {riskLevel ? (
            <Pill variant={riskVariant[riskLevel]} className="shrink-0">
              {riskLabel[riskLevel]}
            </Pill>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
