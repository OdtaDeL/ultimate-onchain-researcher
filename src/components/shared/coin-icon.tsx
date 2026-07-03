import { Avatar, type AvatarSize } from "@/components/ui";

interface CoinIconProps {
  src?: string | null;
  /** Ticker symbol, e.g. "BTC" — used as the initials fallback and the alt text. */
  symbol: string;
  size?: AvatarSize;
  className?: string;
}

/**
 * Circular project/coin logo. DESIGN_SYSTEM.md Section 8 "Crypto logo
 * usage" / COMPONENT_SPEC.md "Token Logo": identical spec to Avatar,
 * kept as its own component so callers reach for the entity-logo meaning
 * explicitly rather than the person-avatar meaning — prevents a future
 * screen from accidentally rendering a project logo where Avatar's
 * person-photo semantics were implied.
 */
export function CoinIcon({ src, symbol, size = "md", className }: CoinIconProps) {
  return <Avatar src={src} alt={symbol} fallback={symbol} size={size} className={className} />;
}
