import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Standard shadcn/ui class-merging helper: clsx for conditional classes, tailwind-merge to resolve conflicting utility classes deterministically. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a display name to a URL-safe slug (lowercase, non-alphanumeric runs → single dash, leading/trailing dashes stripped). Used as a fallback when a backend slug is unavailable (e.g. mock data). */
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
