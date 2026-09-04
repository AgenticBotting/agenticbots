import { z } from "zod";

/**
 * pSEO dataset contracts (Phase 6). A row that fails parsing fails the
 * build — no page ever renders "Agentic PPC Company In undefined".
 *
 * DATA PROVENANCE: Tier-0 figures are order-of-magnitude estimates from
 * public sources, and every generated page carries an estimates
 * disclosure. Verify before any indexing push (see docs/SEO-ARCHITECTURE.md).
 */

export const CitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  stateSlug: z.string().regex(/^[a-z-]+$/),
  stateName: z.string().min(2),
  stateAbbr: z.string().length(2),
  metroPopulation: z.number().int().min(50_000),
  businessCount: z.number().int().min(1_000),
  /** Ordered, dominant first. Drives the scenario copy — this is the uniqueness lever. */
  industries: z.array(z.string().min(3)).min(3).max(6),
  /** Estimated Google Ads CPC band for local service verticals, USD. */
  cpcBand: z.tuple([z.number().min(1), z.number().min(1)]),
  /** How crowded the local agency market is. */
  competition: z.enum(["low", "moderate", "high", "saturated"]),
  timezone: z.string(),
  /** Slugs of nearby metros — powers internal linking, reduces cannibalization. */
  nearby: z.array(z.string()).min(1).max(5),
  /** One locally-true observation, hand-written per metro. The anti-doorway clause. */
  localNote: z.string().min(80),
  /** 3–5 named business districts/corridors — real places, woven into copy. */
  districts: z.array(z.string().min(3)).min(3).max(5),
  /** One specific sentence about the metro's commercial character. */
  character: z.string().min(60),
});
export type City = z.infer<typeof CitySchema>;

export const LocalServiceSchema = z.object({
  slug: z.string().regex(/^[a-z-]+$/),
  name: z.string(),
  /** Maps to the catalog category that fulfils it. */
  catalogPillar: z.enum(["marketing", "sales"]),
  catalogSlug: z.string(),
  botName: z.string(),
  headlinePattern: z.string().includes("{city}"),
  /** The flavor line that used to be the H1 — now the kicker under it. */
  hook: z.string().min(10),
  intro: z.string().min(120),
  implementationWeeks: z.number().int().min(1).max(8),
  baseline: z.array(z.object({ metric: z.string(), value: z.string() })).min(2),
});
export type LocalService = z.infer<typeof LocalServiceSchema>;
