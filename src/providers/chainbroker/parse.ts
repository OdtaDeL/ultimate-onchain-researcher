// ChainBroker returns money/percent/token-amount fields as pre-formatted
// display strings ("$25M", "+5.23%", "88.9M XPL") rather than raw numbers
// — see SOURCE.md. These helpers convert them into numbers for the
// Normalized* types. Returns null for anything that doesn't parse rather
// than throwing: a single unparseable field shouldn't fail the whole
// response, since the API contract for these is informal to begin with.

const SUFFIX_MULTIPLIER: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
};

/** "$25M" -> 25_000_000, "$1.4B" -> 1_400_000_000, "-7.12%"-style handled by parsePercent. */
export function parseAbbreviatedNumber(input: string | null | undefined): number | null {
  if (input == null) return null;
  const match = input
    .trim()
    .match(/^[+-]?\$?\s*([0-9][0-9,]*\.?[0-9]*)\s*([KMBT])?/i);
  if (!match) return null;
  const [, digits, suffix] = match;
  const base = Number(digits.replace(/,/g, ""));
  if (Number.isNaN(base)) return null;
  const sign = input.trim().startsWith("-") ? -1 : 1;
  const multiplier = suffix ? SUFFIX_MULTIPLIER[suffix.toUpperCase()] ?? 1 : 1;
  return sign * base * multiplier;
}

/** "+5.23%" -> 5.23, "26.0%" -> 26.0 */
export function parsePercentString(input: string | null | undefined): number | null {
  if (input == null) return null;
  const match = input.trim().match(/^([+-]?[0-9][0-9,]*\.?[0-9]*)\s*%?$/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isNaN(value) ? null : value;
}

/** "88.9M XPL" -> 88_900_000 (unit suffix, e.g. ticker, is ignored). */
export function parseTokenAmountString(input: string | null | undefined): number | null {
  return parseAbbreviatedNumber(input);
}

/** "YYYY-MM-DD" passthrough validator — returns the input if it looks like an ISO date, else null. */
export function parseIsoDate(input: string | null | undefined): string | null {
  if (input == null) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : null;
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "Jun 25, 2026" -> "2026-06-25" (avoids Date-parsing timezone surprises). */
export function parseDisplayDate(input: string | null | undefined): string | null {
  if (input == null) return null;
  const match = input.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) return null;
  const [, monthAbbr, day, year] = match;
  const monthIndex = MONTH_ABBREVIATIONS.findIndex(
    (m) => m.toLowerCase() === monthAbbr.toLowerCase(),
  );
  if (monthIndex === -1) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}
