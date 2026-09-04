import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: [`${BASE}/sitemap/0.xml`, `${BASE}/sitemap/1.xml`],
  };
}
