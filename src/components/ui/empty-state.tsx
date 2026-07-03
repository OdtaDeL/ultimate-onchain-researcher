import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export type EmptyStateVariant = "full" | "section";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  title?: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Explains absence of content and suggests a next action. DESIGN_SYSTEM.md
 * Rule 18: every Empty State except the section-level inline one must
 * include a suggested next action, not just an explanation of absence.
 * `full` = centered illustration + headline + helper + CTA. `section` = a
 * single muted caption line, no illustration (e.g. "No new fundraises this week").
 *
 * No standalone Button component exists in this UI Foundation pass (out of
 * the requested scope) — the action renders as a plain semantic `<button>`
 * styled inline rather than introducing an unrequested primitive.
 */
export function EmptyState({ variant = "full", icon, title, description, action, className }: EmptyStateProps) {
  if (variant === "section") {
    return <p className={cn("text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground", className)}>{description}</p>;
  }

  return (
    <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
      {icon ? <div className="mb-2 text-muted-foreground">{icon}</div> : null}
      {title ? <p className="text-[15px] font-medium leading-5 text-foreground">{title}</p> : null}
      <p className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-[12px] bg-accent px-4 text-[15px] font-semibold leading-5 text-accent-foreground"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
