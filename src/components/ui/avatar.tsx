"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  alt: string;
  /** Initials shown when `src` is absent or fails to load — never a broken-image icon. */
  fallback: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-7 text-[11px]", // 28px — list rows
  md: "size-8 text-[12px]", // 32px — compact cards
  lg: "size-14 text-[18px]", // 56px — Project Detail Hero
  xl: "size-16 text-[20px]", // 64px — Profile header
};

// Pixel dimensions matched to sizeClass — used as next/image width/height so
// the optimizer generates an appropriately-sized srcset for each avatar slot.
const sizePx: Record<AvatarSize, number> = {
  sm: 28,
  md: 32,
  lg: 56,
  xl: 64,
};

/**
 * Circular avatar for a person (Telegram user) or entity fallback shape.
 * DESIGN_SYSTEM.md Section 8/Anti-pattern 7: always circular, never square.
 * Uses next/image for automatic optimization and WebP conversion; allowed
 * domains are registered in next.config.ts's images.remotePatterns.
 */
export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated font-medium text-muted-foreground",
        sizeClass[size],
        className,
      )}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={alt}
          width={sizePx[size]}
          height={sizePx[size]}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={alt}>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
