import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface PriceFormatterProps {
  value: number;
  currency?: string;
  className?: string;
}

/**
 * Renders a currency value with adaptive decimal precision so sub-dollar
 * token prices (e.g. $0.0003) stay meaningful instead of rounding to
 * "$0.00". Tabular figures per the `number-tabular` UX guideline.
 */
export function PriceFormatter({ value, currency = "USD", className }: PriceFormatterProps) {
  return <span className={cn("tabular-nums", className)}>{formatPrice(value, currency)}</span>;
}
