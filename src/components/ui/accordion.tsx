"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { duration, easing } from "@/lib/theme";

interface AccordionProps {
  title: string;
  /** Rendered next to the title even while collapsed — e.g. an Overall score Pill, so the headline number is visible before expanding. */
  trailing?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * DESIGN_SYSTEM.md "Accordion": expand/collapse supplementary detail in
 * place. Used here so the Scoring Breakdown's per-category sub-scores stay
 * collapsed by default — DESIGN_SYSTEM Anti-pattern 2 warns that showing
 * all sub-scores inline overwhelms scanability; they belong "behind Why
 * this score," which an expand/collapse trigger satisfies without leaving
 * the screen (the alternative, a Bottom Sheet, would also be valid, but
 * this keeps the score's own context on-screen while expanded).
 */
export function Accordion({ title, trailing, defaultExpanded = false, children, className }: AccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 py-3"
      >
        <span className="flex items-center gap-2">
          <span className="text-[17px] font-semibold leading-[22px] text-foreground">{title}</span>
          {trailing}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: duration.quick.s, ease: easing.easeOut }}
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.standard.s, ease: easing.easeInOut }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
