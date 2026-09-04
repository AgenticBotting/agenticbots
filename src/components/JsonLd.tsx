/**
 * JSON-LD structured data (Phase 7). Hand-typed rather than schema-dts:
 * the dep is types-only and our schema surface is six shapes — a strict
 * local type covers it without another package to pin.
 */

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

export const orgLd: Json = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE}/#org`,
  name: "AgenticBots",
  url: BASE,
  logo: `${BASE}/logo.png`,
  email: "hello@agenticbots.dev",
  description:
    "Agentic AI infrastructure implementation — marketing and sales bots built, connected and run continuously.",
};

export const webSiteLd: Json = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  url: BASE,
  name: "AgenticBots",
  publisher: { "@id": `${BASE}/#org` },
};

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE}${it.path}`,
    })),
  };
}

export function serviceLd(opts: { name: string; description: string; path: string; areaServed?: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: `${BASE}${opts.path}`,
    provider: { "@id": `${BASE}/#org` },
    serviceType: "Agentic AI marketing and sales automation",
    ...(opts.areaServed ? { areaServed: opts.areaServed } : {}),
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleLd(opts: {
  title: string; description: string; slug: string; date: string; updated?: string;
}): Json {
  const url = `${BASE}/blog/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    /* Google treats a missing dateModified as "never updated"; with no
       edit history to draw on, publication date is the honest value. */
    dateModified: opts.updated ?? opts.date,
    /* The per-post OG route already renders this image. */
    image: [`${url}/opengraph-image`],
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "AgenticBots", url: BASE },
    publisher: { "@id": `${BASE}/#org` },
  };
}
