"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { radius, shadow, motionPreset } from "@/lib/theme";

export type CardVariant = "standard" | "compact";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: CardVariant;
  /** Renders as a pressable surface (scale 0.97 on tap) — DESIGN_SYSTEM Section 10 "Card Tap". Only set this when the card is itself the tap target (e.g. wraps an onClick). */
  pressable?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * The base content container — every other card-type component in the
 * product is a specialization of this. DESIGN_SYSTEM.md Section 9 "Card":
 * never nest a Card inside another Card.
 */
export function Card({ variant = "standard", pressable = false, className, ref, ...props }: CardProps) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "bg-surface",
        shadow.flat,
        variant === "standard" ? cn(radius.lg, "p-4") : cn(radius.md, "p-3"),
        pressable && "cursor-pointer",
        className,
      )}
      {...(pressable ? motionPreset.press : {})}
      {...props}
    />
  );
}
