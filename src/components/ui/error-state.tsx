import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErrorStateVariant = "full" | "inline";

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Explains failure and offers recovery. DESIGN_SYSTEM.md Rule 19/24: every
 * section-level error must be contained to that section — one failed data
 * source must never blank an entire screen. `full` = centered icon +
 * headline + body + retry. `inline` = single-line caption + small retry
 * icon-button, contained within the affected section only.
 */
export function ErrorState({
  variant = "inline",
  title = "Couldn't load",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex h-11 items-center gap-2 px-4", className)}>
        <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{title}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry"
            className="flex size-11 items-center justify-center text-accent"
          >
            <RotateCw size={20} />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
      <TriangleAlert size={64} className="mb-2 text-muted-foreground" />
      <p className="text-[15px] font-medium leading-5 text-foreground">{title}</p>
      <p className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-[12px] bg-accent px-4 text-[15px] font-semibold leading-5 text-accent-foreground"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
