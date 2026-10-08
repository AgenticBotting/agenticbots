import type { MetadataRoute } from "next";
import { CATALOG } from "@/lib/catalog";
import { ALL_LESSONS } from "@/lib/course";
import { SORTED_POSTS } from "@/lib/posts";
import { SEARCH_PUBLICATION } from "@/lib/search-publication";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

// Editorial revision, deliberately independent of file mtimes and deployment time.
const CORE_CONTENT_UPDATED = "2026-10-08";

/**
 * Segmented sitemaps (Phase 7): 0 = core site, 1 = approved acquisition pages.
 * Served at /sitemap/0.xml and /sitemap/1.xml; robots.ts references both,
 * so Search Console coverage stays readable per segment.
 */
export function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }];
}

/**
 * Next 16 hands `id` over as a Promise that resolves to either the raw
 * segment number or `{ __metadata_id__ }`. Both shapes are handled, and
 * anything else throws rather than coercing to NaN — a silent fallthrough
 * would emit the core sitemap for segment 1 and drop 200 local URLs with
 * no error anywhere.
 */
function segmentId(resolved: unknown): number {
  const raw =
    typeof resolved === "object" && resolved !== null && "__metadata_id__" in resolved
      ? (resolved as { __metadata_id__?: string }).__metadata_id__
      : resolved;
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    throw new Error(`[sitemap] could not resolve segment id from ${JSON.stringify(resolved)}`);
  }
  return n;
}

export default async function sitemap(props: { id: number | Promise<{ __metadata_id__?: string }> }): Promise<MetadataRoute.Sitemap> {
  /* lastmod reflects when the content last changed, not when we last
     deployed — a build-time stamp on every URL teaches crawlers the
     field is meaningless. */
  const now = CORE_CONTENT_UPDATED;

  const id = segmentId(await (props as { id: Promise<{ __metadata_id__?: string }> | number }).id);
  if (id === 1) {
    return Object.entries(SEARCH_PUBLICATION).map(([path, publication]) => ({
      url: `${BASE}${path}`, lastModified: publication.updated,
      changeFrequency: "monthly", priority: path.split("/").length <= 3 ? 0.8 : 0.65,
    }));
  }

  const statics = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/plan`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    /* The course landing page and its free lessons. The portal, checkout
       and login are noindex — they have nothing to rank for and would
       outrank the page that actually sells it. */
    { url: `${BASE}/course`, changeFrequency: "weekly", priority: 0.8 },
    ...ALL_LESSONS.filter((l) => l.free).map((l) => ({
      url: `${BASE}/course/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/site-map`, changeFrequency: "monthly", priority: 0.3 },
  ].map((e) => ({ ...e, lastModified: now })) as MetadataRoute.Sitemap;

  const pillars: MetadataRoute.Sitemap = CATALOG.map((p) => ({
    url: `${BASE}/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9,
  }));
  const servicesIndex: MetadataRoute.Sitemap = [
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
  const posts: MetadataRoute.Sitemap = SORTED_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "monthly", priority: 0.6,
  }));

  return [...statics, ...pillars, ...servicesIndex, ...posts];
}
