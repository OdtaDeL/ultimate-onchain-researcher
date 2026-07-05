"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { radius, shadow } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useOnboardingDone, useCompleteOnboarding } from "@/store";

const SLIDES = [
  {
    icon: "🔍",
    title: "Welcome to Onchain Researcher",
    body: "Your crypto research companion — projects, funds, and scores, all in one place.",
  },
  {
    icon: "📊",
    title: "Score Every Project",
    body: "Transparent 0–100 scores across funding quality, TVL, momentum, and unlock risk.",
  },
  {
    icon: "🚀",
    title: "You're All Set",
    body: "Browse top-ranked projects, track your watchlist, and never miss an unlock.",
  },
] as const;

// Modal, not full-screen takeover: a bounded card floating over a dimmed +
// blurred backdrop, so the app underneath stays visible and the overlay
// reads as a dismissible dialog rather than a wall blocking the app.
// "Skip" is permanent — it writes onboardingDone: true to the persisted
// settings store, so this card never appears again on any future visit.
export function OnboardingOverlay() {
  const onboardingDone = useOnboardingDone();
  const completeOnboarding = useCompleteOnboarding();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  if (onboardingDone) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function advance() {
    if (isLast) {
      completeOnboarding();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm">
      <div
        className={cn(radius.xl, shadow.overlay, "relative w-full max-w-sm bg-surface-elevated p-6")}
      >
        {/* Skip — permanent dismissal, not just "next time" */}
        <button
          type="button"
          onClick={completeOnboarding}
          aria-label="Skip onboarding — won't show again"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground"
        >
          <X size={18} />
        </button>

        {/* Slide content */}
        <div className="flex flex-col items-center overflow-hidden px-2 pt-4 text-center">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-5 text-[52px] leading-none" aria-hidden>
                {slide.icon}
              </div>
              <h2 className="mb-2 text-[19px] font-bold leading-[24px] tracking-[-0.1px] text-foreground">
                {slide.title}
              </h2>
              <p className="text-[15px] font-normal leading-[22px] text-muted-foreground">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + CTA */}
        <div className="flex flex-col items-center gap-5 pt-6">
          <div className="flex gap-2" role="tablist" aria-label="Onboarding step">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={`Step ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={advance}
            className="h-12 w-full rounded-xl bg-primary text-[15px] font-semibold leading-5 text-primary-foreground transition-opacity active:opacity-80"
          >
            {isLast ? "Let's Go" : "Next"}
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={completeOnboarding}
              className="text-[13px] font-normal leading-[18px] text-muted-foreground"
            >
              Skip
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
