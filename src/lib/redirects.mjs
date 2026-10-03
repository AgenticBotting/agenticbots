/**
 * Retired URLs → /services.
 *
 * Plain ESM on purpose: next.config.ts imports it to build redirects(),
 * and scripts/topic-gate.mjs imports the same array to assert none of
 * these sources is still a prerendered route. A redirect that shadows a
 * live page makes that page unreachable with no error anywhere.
 *
 * Order matters — Next matches in array order, first hit wins.
 *
 * Next emits 308 for `permanent: true`, which Google treats as 301 for
 * consolidation. Nothing here was ever indexed (see docs/SEO-ARCHITECTURE.md),
 * so these exist for link hygiene rather than equity transfer — but 308s
 * are hard-cached by browsers, so these slugs are burned for reuse.
 */

/** Old pillar-scoped category path → new flat service slug. */
const CATEGORY_MAP = {
  "/marketing/paid-media": "agentic-ppc-management",
  "/marketing/seo": "agentic-seo",
  "/marketing/content": "agentic-content-marketing",
  "/marketing/email": "agentic-email-marketing",
  "/marketing/cro": "agentic-cro",
  "/marketing/analytics": "agentic-analytics",
  "/sales/lead-generation": "agentic-lead-generation",
  "/sales/outbound": "agentic-outbound-sdr",
  "/sales/inbound": "agentic-speed-to-lead",
  "/sales/crm": "agentic-crm-automation",
  "/sales/enablement": "agentic-proposal-automation",
  "/sales/account-management": "agentic-customer-reactivation",
  "/sales/revops": "agentic-crm-automation",
};

/** Old /local slug → new flat service slug. These four carried the geo
 *  tree, so each needs a wildcard as well as a bare hub rule. */
const LOCAL_MAP = {
  ppc: "agentic-ppc-management",
  seo: "agentic-seo",
  crm: "agentic-crm-automation",
  "speed-to-lead": "agentic-speed-to-lead",
};

/** Retired /services slugs → replacement service. */
const RETIRED_SERVICES = {
  "agentic-account-management": "agentic-customer-reactivation",
  "agentic-revops": "agentic-crm-automation",
};

export const REDIRECTS = [
  ...Object.entries(CATEGORY_MAP).map(([source, slug]) => ({
    source,
    destination: `/services/${slug}`,
    permanent: true,
  })),

  ...Object.entries(LOCAL_MAP).flatMap(([localSlug, slug]) => [
    { source: `/local/${localSlug}`, destination: `/services/${slug}`, permanent: true },
    {
      source: `/local/${localSlug}/:path*`,
      destination: `/services/${slug}/:path*`,
      permanent: true,
    },
  ]),

  { source: "/local", destination: "/services", permanent: true },

  /* Oct 2026: Retention and RevOps retired for local-services fit.
     Each service and its geo tree go to the nearest replacement. */
  ...Object.entries(RETIRED_SERVICES).flatMap(([oldSlug, slug]) => [
    { source: `/services/${oldSlug}`, destination: `/services/${slug}`, permanent: true },
    { source: `/services/${oldSlug}/:path*`, destination: `/services/${slug}/:path*`, permanent: true },
  ]),
];

/** Sources with no path parameter — these must never also be real routes. */
export const STATIC_REDIRECT_SOURCES = REDIRECTS.filter(
  (r) => !r.source.includes(":")
).map((r) => r.source);
