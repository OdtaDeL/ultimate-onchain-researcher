import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SafeAreaEdge = "top" | "bottom" | "left" | "right";

interface SafeAreaProps {
  children: ReactNode;
  /** Defaults to all four edges. */
  edges?: SafeAreaEdge[];
  className?: string;
}

const ALL_EDGES: SafeAreaEdge[] = ["top", "bottom", "left", "right"];

/**
 * Reserves space for Telegram's own chrome (status bar, gesture/home
 * indicator) using the documented CSS variables the Telegram WebApp script
 * sets on load — `--tg-safe-area-inset-{top,bottom,left,right}` (verified:
 * https://core.telegram.org/bots/webapps). Pure CSS, so it applies
 * immediately on first paint with no JS hydration delay, with a 0px
 * fallback for non-Telegram environments (plain browser preview).
 */
export function SafeArea({ children, edges = ALL_EDGES, className }: SafeAreaProps) {
  const style: CSSProperties = {};
  if (edges.includes("top")) style.paddingTop = "var(--tg-safe-area-inset-top, 0px)";
  if (edges.includes("bottom")) style.paddingBottom = "var(--tg-safe-area-inset-bottom, 0px)";
  if (edges.includes("left")) style.paddingLeft = "var(--tg-safe-area-inset-left, 0px)";
  if (edges.includes("right")) style.paddingRight = "var(--tg-safe-area-inset-right, 0px)";

  return (
    <div style={style} className={cn(className)}>
      {children}
    </div>
  );
}
