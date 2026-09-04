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

const VALUE_PROPS: Record<string, string[]> = {
  ppc: [
    "Search terms read daily, junk negatived before it burns a second day of budget",
    "Budget follows booked work, not last quarter's assumptions",
    "Creative variants rotate continuously instead of decaying for months",
    "Every campaign tied to cost per booked job, not impressions",
    "Bids move within hours of the data moving",
  ],
  seo: [
    "The crawl runs weekly, so what breaks gets fixed while it is still cheap",
    "Competitor coverage gaps mapped and closed in priority order",
    "Local pages built to answer real searches, never to pad a count",
    "Rankings tracked daily against the terms that actually book work",
    "Technical debt caught on a schedule instead of at the annual audit",
  ],
  crm: [
    "Every call, email and meeting logs itself against the right record",
    "Stages advance on evidence — a proposal sent, a meeting held",
    "Duplicates merge on a schedule with rules, not on a rainy Friday",
    "Stalled deals surface before they quietly die",
    "The forecast finally matches what the pipeline actually holds",
  ],
  "speed-to-lead": [
    "Every inbound answered in under a minute, at 2pm or 2am",
    "Missed calls get a text back before the caller dials a competitor",
    "Qualified leads land on the calendar, not in a callback queue",
    "Every lead scored on fit and urgency before a human touches it",
    "Nights, weekends and holidays covered without an answering service",
  ],
};

export function rotatedValueProp(serviceSlug: string, citySlug: string): string {
  const bank = VALUE_PROPS[serviceSlug] ?? VALUE_PROPS.ppc;
  return pick(bank, `${serviceSlug}:${citySlug}`);
}

export function rotatedCta(serviceSlug: string, citySlug: string): string {
  // Offset so the CTA never keys to the same index as the value prop.
  return pick(CTA_BANK, `${serviceSlug}:${citySlug}`, 3);
}
