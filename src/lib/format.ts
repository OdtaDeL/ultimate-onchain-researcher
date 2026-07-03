// Pure number-formatting helpers shared by NumberFormatter/PriceFormatter/
// Percentage. No I/O, no business rules — only presentation per
// DESIGN_SYSTEM.md Anti-pattern 10 ("never show raw unformatted numbers").

/** Compact large numbers ("$1.2B", "2.34T") via Intl.NumberFormat's built-in compact notation. */
export function formatCompactNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}

/**
 * Adaptive-precision currency formatting: whole-dollar assets show 2
 * decimals; sub-dollar tokens show enough decimals to remain meaningful
 * (crypto prices commonly sit at $0.0003, where 2 decimals would render
 * "$0.00" and lose all signal).
 */
export function formatPrice(value: number, currency = "USD"): string {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

/** Signed percentage with a fixed decimal count, e.g. "+1.24%" / "-0.40%". */
export function formatPercentage(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
