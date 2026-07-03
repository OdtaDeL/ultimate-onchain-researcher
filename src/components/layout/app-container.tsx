"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTelegramWebApp } from "@/lib/telegram";
import { useAuthActions, useThemePreference, useUiActions } from "@/store";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * The Telegram Mini App shell. COMPONENT_SPEC.md Section 2: exists exactly
 * once — owns the safe-area/viewport boundary every Page renders inside.
 * Caps width at the product's mobile-only reference range (LAYOUT_SPEC.md
 * Section 1) so desktop Telegram clients don't stretch the layout into a
 * desktop-web shape; centers the app within any wider host viewport.
 *
 * Dark is the default/primary theme (DESIGN_SYSTEM.md Section 5) — sourced
 * from settings-store (defaults to "dark", matching the previously
 * hardcoded class exactly) rather than hardcoded here, so the dark/light
 * toggle on the Settings screen calls `setTheme()` with no change to this
 * component. Telegram WebApp access (viewport/safe-area/colorScheme) is
 * also read exactly once here, at the single point every Page already
 * mounts inside, and pushed into ui-store — other screens (e.g. Profile)
 * read `useTelegramViewport()` from the store instead of each re-running
 * `useTelegramWebApp()`'s own SDK event listeners.
 *
 * `MotionConfig reducedMotion="user"` applies the a11y "Motion Reduction"
 * guideline app-wide, exactly once, rather than threading a check into every
 * individual `motion.*` usage: verified against Motion's own docs
 * (https://motion.dev/docs/react-motion-config) — "user" reads the OS
 * `prefers-reduced-motion` setting and disables transform/layout animations
 * while leaving opacity/color transitions intact, so loading-state fades
 * still read as "something happened" without any motion-sickness-triggering
 * movement.
 */
export function AppContainer({ children, className }: AppContainerProps) {
  const theme = useThemePreference();
  const { setTelegramViewport } = useUiActions();
  const { setIdentity } = useAuthActions();
  const telegram = useTelegramWebApp();

  useEffect(() => {
    setTelegramViewport(telegram);
    if (telegram.user) {
      setIdentity({ id: telegram.user.id, firstName: telegram.user.first_name, username: telegram.user.username });
    }
  }, [telegram, setTelegramViewport, setIdentity]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn(theme === "dark" ? "dark" : undefined, "flex min-h-dvh w-full justify-center bg-bg")}>
        <div className={cn("relative flex min-h-dvh w-full max-w-[480px] flex-col overflow-x-hidden bg-bg text-foreground", className)}>
          {children}
        </div>
      </div>
    </MotionConfig>
  );
}
