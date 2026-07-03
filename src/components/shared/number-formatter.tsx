import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/format";

interface NumberFormatterProps {
  value: number;
  /** Use compact notation ("$1.2B"-style magnitude, without the currency sign) for market cap/volume/supply. Defaults to true. */
  compact?: boolean;
  maximumFractionDigits?: number;
  className?: string;
}

/**
 * Renders a large numeric value through the product's number-formatting
 * convention (DESIGN_SYSTEM.md Anti-pattern 10) instead of a raw figure.
 * Tabular figures prevent column jitter on live updates (`number-tabular`
 * UX guideline).
 */
export function NumberFormatter({ value, compact = true, maximumFractionDigits, className }: NumberFormatterProps) {
  const formatted = compact
    ? formatCompactNumber(value, maximumFractionDigits ?? 1)
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: maximumFractionDigits ?? 0 }).format(value);

  return <span className={cn("tabular-nums", className)}>{formatted}</span>;
}
