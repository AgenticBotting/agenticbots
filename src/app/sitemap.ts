import type { MetadataRoute } from "next";
import { CATALOG, categoryHref } from "@/lib/catalog";
import { SORTED_POSTS } from "@/lib/posts";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    url: `${BASE}/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const categories: MetadataRoute.Sitemap = CATALOG.flatMap((p) => p.categories).map((c) => ({
    url: `${BASE}${categoryHref(c)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const posts: MetadataRoute.Sitemap = SORTED_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...statics, ...pillars, ...categories, ...posts];
}
