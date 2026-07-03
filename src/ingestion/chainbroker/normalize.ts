// Normalization layer: collapses collections of drafts down to one row
// per upsert-conflict key. This isn't just tidiness — Postgres rejects an
// `INSERT ... ON CONFLICT DO UPDATE` batch that contains the same conflict
// key twice ("ON CONFLICT DO UPDATE command cannot affect row a second
// time"), and ChainBroker data legitimately repeats keys across a batch
// (e.g. the same fund backing several rounds, the same project appearing
// in both the per-project and global feeds).

import type { FundDraft, FundingRoundDraft, ProjectDraft, TokenUnlockEventDraft } from "./types";

/** Merge two drafts sharing a key: prefer non-null/non-empty values, later draft wins ties. */
function mergeProject(a: ProjectDraft, b: ProjectDraft): ProjectDraft {
  return {
    slug: a.slug,
    name: b.name || a.name,
    ticker: b.ticker ?? a.ticker,
    logoUrl: b.logoUrl ?? a.logoUrl,
  };
}

export function normalizeProjectDrafts(drafts: ProjectDraft[]): ProjectDraft[] {
  const bySlug = new Map<string, ProjectDraft>();
  for (const draft of drafts) {
    const existing = bySlug.get(draft.slug);
    bySlug.set(draft.slug, existing ? mergeProject(existing, draft) : draft);
  }
  return [...bySlug.values()];
}

function mergeFund(a: FundDraft, b: FundDraft): FundDraft {
  return { slug: a.slug, name: b.name || a.name, logoUrl: b.logoUrl ?? a.logoUrl };
}

/**
 * Dedupes by `name` — the real DB conflict key — not by ChainBroker's
 * `slug`. Two different ChainBroker slugs that happen to share a display
 * name would collide in the `funds` table regardless of what this
 * function does (that's the schema's unique constraint, not a bug here);
 * this just makes sure *we* don't hand Postgres the same name twice.
 */
export function normalizeFundDrafts(drafts: FundDraft[]): FundDraft[] {
  const byName = new Map<string, FundDraft>();
  for (const draft of drafts) {
    const existing = byName.get(draft.name);
    byName.set(draft.name, existing ? mergeFund(existing, draft) : draft);
  }
  return [...byName.values()];
}

/**
 * Funding rounds have no natural unique key in the schema (see
 * upsert-service.ts find-or-create note), so this only dedupes *exact*
 * duplicates within a single batch — same project, date, and amount —
 * rather than resolving against the database. Cross-run idempotency is
 * the upsert service's job, not this layer's.
 */
export function normalizeFundingRoundDrafts(drafts: FundingRoundDraft[]): FundingRoundDraft[] {
  const seen = new Map<string, FundingRoundDraft>();
  for (const draft of drafts) {
    const key = `${draft.projectSlug}|${draft.announcedDate}|${draft.amountRaisedUsd}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, draft);
      continue;
    }
    seen.set(key, {
      ...existing,
      investorFundSlugs: [
        ...new Set([...existing.investorFundSlugs, ...draft.investorFundSlugs]),
      ],
    });
  }
  return [...seen.values()];
}

/** Same caveat as funding rounds — exact-duplicate collapse within a batch only. */
export function normalizeUnlockEventDrafts(
  drafts: TokenUnlockEventDraft[],
): TokenUnlockEventDraft[] {
  const seen = new Map<string, TokenUnlockEventDraft>();
  for (const draft of drafts) {
    const key = `${draft.projectSlug}|${draft.unlockDate}|${draft.amountTokens}|${draft.unlockType}`;
    seen.set(key, draft);
  }
  return [...seen.values()];
}

export interface FundingInvestorPair {
  fundingRoundId: string;
  fundId: string;
}

export function normalizeFundingInvestorPairs(
  pairs: FundingInvestorPair[],
): FundingInvestorPair[] {
  const seen = new Map<string, FundingInvestorPair>();
  for (const pair of pairs) {
    seen.set(`${pair.fundingRoundId}|${pair.fundId}`, pair);
  }
  return [...seen.values()];
}
