import type { MetadataRoute } from "next";
import { CATALOG, categoryHref } from "@/lib/catalog";
import { SORTED_POSTS } from "@/lib/posts";
import { CITIES, LOCAL_SERVICES, STATES } from "@/lib/geo/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

/**
 * Segmented sitemaps (Phase 7): 0 = core site, 1 = local tier-0 pages.
 * Served at /sitemap/0.xml and /sitemap/1.xml; robots.ts references both,
 * so Search Console coverage stays readable per segment.
 */
export function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }];
}

export default async function sitemap(props: { id: number | Promise<{ __metadata_id__?: string }> }): Promise<MetadataRoute.Sitemap> {
  console.log('[sitemap] raw props =', props, 'resolved =', await (props as {id: unknown}).id);
  const now = new Date();

  const id = await (props as { id: Promise<{ __metadata_id__?: string }> | number }).id;
  if (Number(id) === 1) {
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
    return [...hubs, ...states, ...cities];
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
