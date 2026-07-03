// Runtime validation for every shape the client receives, mirroring
// types.ts. Deliberately not `.strict()` — ChainBroker is an undocumented
// internal API (see SOURCE.md) that can add fields without notice, and
// unknown extra fields are not an error. Missing/mistyped *known* fields
// are, which is what we actually want to catch.

import { z } from "zod";

export const rawRoiSchema = z.object({
  percent: z.number().nullable(),
  x: z.number().nullable(),
});

export const rawBackerSchema = z.object({
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
  logo_alt: z.string().nullable().optional(),
  logo_title: z.string().nullable().optional(),
  current_roi: rawRoiSchema.nullable().optional(),
  investment_count: z.number().nullable().optional(),
});

export const rawFundraiseSchema = z.object({
  name: z.string(),
  announce_date: z.string().nullable(),
  raise_amount: z.string().nullable(),
  valuation: z.string().nullable(),
  source: z.string().nullable(),
  backers: z.array(rawBackerSchema),
  lead_backers: z.array(rawBackerSchema),
});

export const rawGlobalFundraiseListItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  ticker: z.string().nullable(),
  logo: z.string().nullable(),
  raise_amount: z.string().nullable(),
  raise_date: z.string().nullable(),
  category: z.array(z.object({ name: z.string(), slug: z.string() })),
  funds: z.array(
    z.object({ name: z.string(), slug: z.string(), logo: z.string().nullable() }),
  ),
});

export const rawUnlockListItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  ticker: z.string().nullable(),
  next_unlock: z.string().nullable(),
  unlock_amount: z.string().nullable(),
  unlock_value: z.string().nullable(),
  round_name: z.string().nullable(),
  circulation: z.string().nullable(),
  price_change_24h: z.string().nullable(),
  price_change_7d: z.string().nullable(),
  price_change_30d: z.string().nullable(),
  price_change_1y: z.string().nullable(),
  volume_24h: z.string().nullable(),
  percent: z.string().nullable(),
});

export const rawProjectUnlockEventSchema = z.object({
  tokenomics_round: z.string().nullable(),
  is_daily: z.boolean(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  days: z.string().nullable(),
  percent: z.number().nullable(),
  token_value: z.string().nullable(),
  tokens: z.string().nullable(),
});

export const rawSimpleListItemSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const rawProjectListItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  ticker: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
});

// Generic envelope/page wrappers as functions, since zod has no native
// generics — each call site supplies the inner item schema.

export const rawEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    status: z.number(),
    data,
    message: z.string().nullable().optional(),
  });

export const rawPageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    total_pages: z.number(),
    page_number: z.number(),
    results: z.array(item),
  });

export const rawSimplePageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  });

// Concrete envelopes for each of the 7 client capabilities.

export const fundraisesListEnvelopeSchema = rawEnvelopeSchema(
  z.object({ list: rawPageSchema(rawGlobalFundraiseListItemSchema) }),
);

export const unlocksListEnvelopeSchema = rawEnvelopeSchema(
  z.object({ list: rawPageSchema(rawUnlockListItemSchema) }),
);

export const projectsListEnvelopeSchema = rawEnvelopeSchema(
  z.object({ list: rawPageSchema(rawProjectListItemSchema) }),
);

export const projectFundraisesEnvelopeSchema = rawEnvelopeSchema(
  z.array(rawFundraiseSchema),
);

export const projectBackersEnvelopeSchema = rawEnvelopeSchema(
  z.object({ backers: z.array(rawBackerSchema) }),
);

export const projectUnlocksEnvelopeSchema = rawEnvelopeSchema(
  // Confirmed: this is `null` (not an empty page) when a project has no
  // unlock data at all (e.g. aave, where hasCards.unlocks === false).
  rawSimplePageSchema(rawProjectUnlockEventSchema).nullable(),
);

export const fundsSimpleListEnvelopeSchema = rawEnvelopeSchema(
  z.array(rawSimpleListItemSchema),
);
