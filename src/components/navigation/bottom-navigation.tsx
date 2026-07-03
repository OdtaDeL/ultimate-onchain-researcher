"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Search, Star, User } from "lucide-react";
import { motion } from "framer-motion";
import { SafeArea } from "@/components/layout";
import { cn } from "@/lib/utils";
import { duration, easing } from "@/lib/theme";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Below this much viewport shrinkage, assume the on-screen keyboard opened rather than a benign browser-chrome resize. */
const KEYBOARD_HEIGHT_THRESHOLD_PX = 150;

/**
 * True while the on-screen keyboard is covering part of the viewport.
 * Compares `visualViewport.height` (the visible area above the keyboard)
 * against `window.innerHeight` — the documented technique for keyboard
 * detection on the mobile web, since no `keyboardWillShow`-style DOM event
 * exists. `visualViewport` is a standard browser API (MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), not a
 * Telegram-specific one, so this degrades safely to "never hidden" in any
 * environment that lacks it.
 */
function useKeyboardVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      setIsVisible(window.innerHeight - viewport.height > KEYBOARD_HEIGHT_THRESHOLD_PX);
    };

    handleResize();
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  return isVisible;
}

/**
 * The app's one Bottom Navigation — rendered exactly once, from the
 * `(tabs)` route group's shared layout, never per-page. Icons only (no
 * labels) per this pass's explicit brief — DESIGN_SYSTEM.md's own Bottom
 * Navigation spec documents icon+label together; this intentionally
 * diverges for a lighter, icon-only bar, flagged in the implementation
 * report rather than silently following one source over the other.
 *
 * Active tab is derived from the current route via `usePathname` (App
 * Router's documented client hook — https://nextjs.org/docs/app/api-reference/functions/use-pathname)
 * rather than a prop, so this component needs zero per-page wiring.
 *
 * Hides itself while the keyboard is focused (e.g. Search's auto-focused
 * input) per DESIGN_SYSTEM.md Rule 39 — "the bottom navigation hides only
 * while a keyboard is focused... never on any of the 5 primary tabs
 * otherwise" — a rule that had no implementation anywhere until now.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboardVisible();

  return (
    <motion.div
      animate={{ y: isKeyboardVisible ? "100%" : 0 }}
      transition={{ duration: duration.quick.s, ease: easing.easeOut }}
      aria-hidden={isKeyboardVisible}
      inert={isKeyboardVisible ? true : undefined}
    >
      <SafeArea edges={["bottom"]}>
        <nav aria-label="Primary" className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center"
              >
                {isActive ? (
                  <motion.span
                    layoutId="bottom-nav-active-indicator"
                    className="absolute top-1.5 size-1.5 rounded-full bg-accent"
                    transition={{ duration: duration.quick.s, ease: easing.easeOut }}
                  />
                ) : null}
                <Icon size={24} className={cn(isActive ? "text-accent" : "text-muted-foreground")} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 0 : 2} />
              </Link>
            );
          })}
        </nav>
      </SafeArea>
    </motion.div>
  );
}
