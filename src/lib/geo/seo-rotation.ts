/**
 * Deterministic content rotation (ported from the Lot Sealers pattern).
 * djb2-hash picks give each city×service page a stable but distinct
 * value proposition and CTA line — no two pages share the exact framing,
 * and nothing changes between builds.
 */

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

function pick<T>(items: T[], seed: string, offset = 0): T {
  return items[(djb2(seed) + offset) % items.length];
}

const CTA_BANK = [
  "Get your bot plan for this market — free, one business day.",
  "Request the free bot plan. No call required to get it.",
  "Map your leaks in this market — the plan is free.",
  "Start with the free plan; the audit numbers are yours to keep.",
  "One business day to a written plan for this market.",
];

/* The bank lives on the service record. There is deliberately no
   fallback: a service shipping without value props used to silently
   inherit PPC's, which would have rendered ad-account copy on 8,316
   pages for services that do not touch an ad account. Throw instead. */
export function rotatedValueProp(
  service: { slug: string; valueProps: string[] },
  citySlug: string,
): string {
  if (!service.valueProps?.length) {
    throw new Error(`seo-rotation: "${service.slug}" has no valueProps`);
  }
  return pick(service.valueProps, `${service.slug}:${citySlug}`);
}

export function rotatedCta(serviceSlug: string, citySlug: string): string {
  // Offset so the CTA never keys to the same index as the value prop.
  return pick(CTA_BANK, `${serviceSlug}:${citySlug}`, 3);
}
