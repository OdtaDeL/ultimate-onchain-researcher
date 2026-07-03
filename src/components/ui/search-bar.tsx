"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * The product's one text input — DESIGN_SYSTEM.md "Search Bar" (Active
 * variant): 44px height (driven naturally by the input's own padding/clear
 * button, not a forced container height), radius-md, leading search icon,
 * trailing clear action once typed. Reusable wherever a screen needs a
 * search entry point.
 */
export function SearchBar({ value, onChange, onClear, onSubmit, placeholder = "Search projects, funds or platforms...", autoFocus, className }: SearchBarProps) {
  return (
    <div className={cn("flex items-center gap-2 bg-surface-elevated px-4 focus-within:ring-2 focus-within:ring-accent/40", radius.md, className)}>
      <SearchIcon size={18} className="shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onSubmit) { e.currentTarget.blur(); onSubmit(); } }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search projects, funds or platforms"
        className="min-w-0 flex-1 bg-transparent py-3 text-[15px] leading-5 text-foreground outline-none placeholder:text-muted-foreground"
      />
      {value ? (
        <button type="button" onClick={onClear} aria-label="Clear search" className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
