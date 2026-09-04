import { statSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";
import { CATALOG, categoryHref } from "@/lib/catalog";
import { SORTED_POSTS } from "@/lib/posts";
import { CITIES, LOCAL_SERVICES, STATES } from "@/lib/geo/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

/* Local pages are generated from the geo dataset, so their content only
   moves when that file does. Read once at module load. */
const CONTENT_MTIME = (() => {
  try {
    return statSync(join(process.cwd(), "src/lib/geo/data.ts")).mtime;
  } catch {
    return new Date();
  }
})();

/**
 * Segmented sitemaps (Phase 7): 0 = core site, 1 = local tier-0 pages.
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
  const now = CONTENT_MTIME;

  const id = segmentId(await (props as { id: Promise<{ __metadata_id__?: string }> | number }).id);
  if (id === 1) {
    const hubs: MetadataRoute.Sitemap = LOCAL_SERVICES.map((s) => ({
      url: `${BASE}/local/${s.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7,
    }));
    const states: MetadataRoute.Sitemap = LOCAL_SERVICES.flatMap((s) =>
      STATES.map((st) => ({
        url: `${BASE}/local/${s.slug}/${st.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6,
      }))
    );
    const cities: MetadataRoute.Sitemap = LOCAL_SERVICES.flatMap((s) =>
      CITIES.map((c) => ({
        url: `${BASE}/local/${s.slug}/${c.stateSlug}/${c.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.65,
      }))
    );
    const marketHubs: MetadataRoute.Sitemap = [
      { url: `${BASE}/markets`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
      ...STATES.map((st) => ({
        url: `${BASE}/markets/${st.slug}`, lastModified: now,
        changeFrequency: "monthly" as const, priority: 0.65,
      })),
      ...CITIES.map((c) => ({
        url: `${BASE}/markets/${c.stateSlug}/${c.slug}`, lastModified: now,
        changeFrequency: "monthly" as const, priority: 0.7,
      })),
    ];
    return [...hubs, ...states, ...cities, ...marketHubs];
  }

  const statics = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/plan`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/site-map`, changeFrequency: "monthly", priority: 0.3 },
  ].map((e) => ({ ...e, lastModified: now })) as MetadataRoute.Sitemap;

  const pillars: MetadataRoute.Sitemap = CATALOG.map((p) => ({
    url: `${BASE}/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9,
  }));
  const categories: MetadataRoute.Sitemap = CATALOG.flatMap((p) => p.categories).map((c) => ({
    url: `${BASE}${categoryHref(c)}`, lastModified: now, changeFrequency: "monthly", priority: 0.85,
  }));
  const posts: MetadataRoute.Sitemap = SORTED_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "monthly", priority: 0.6,
  }));

  return [...statics, ...pillars, ...categories, ...posts];
}
