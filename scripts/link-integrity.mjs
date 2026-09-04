/**
 * Link & data integrity gate.
 *
 * The three checks here exist because a real defect slipped past every
 * other gate: `data.ts` declared the enriched New York metro as
 * `new-york` while the dataset row was `new-york-city`. Pages build from
 * the dataset, so the page was never generated — yet the sitemap (built
 * from the enriched list) advertised it, and three pages linked to it.
 * Five 404s on a fresh domain, invisible to lint, typecheck, the pSEO
 * gate and seo-checks, because each of those validates one source
 * against itself.
 *
 *   1. enriched ⟕ dataset — every hand-written metro must exist in the
 *      dataset, or its pages silently never build.
 *   2. sitemap ⊆ prerendered — never advertise a URL that 404s.
 *   3. internal hrefs ⊆ prerendered — never ship a broken internal link.
 *
 * Runs against .next after a build, so what ships is what is checked.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".next/server/app";
const errors = [];

if (!existsSync(ROOT)) {
  console.error("link-integrity: no build found — run `npm run build` first.");
  process.exit(1);
}

/* ── Every prerendered route ── */
const routes = new Set();
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) {
      const r = p.slice(ROOT.length, -5);
      routes.add(r === "/index" ? "/" : r);
    }
  }
})(ROOT);

/* ── 1. enriched ⟕ dataset ── */
const dataSrc = readFileSync("src/lib/geo/data.ts", "utf8");
const dataset = JSON.parse(readFileSync("src/data/cities-dataset.json", "utf8"));
const datasetCities = new Set(
  (dataset.cities ?? dataset).map((c) => `${c.state_slug}/${c.city_slug}`)
);

for (const m of dataSrc.matchAll(/\{\s*slug:\s*"([a-z0-9-]+)",\s*name:\s*"[^"]*",\s*stateSlug:\s*"([a-z-]+)"/g)) {
  const [, slug, stateSlug] = m;
  if (!datasetCities.has(`${stateSlug}/${slug}`)) {
    errors.push(
      `enriched metro ${stateSlug}/${slug} (src/lib/geo/data.ts) has no row in cities-dataset.json — ` +
      `its pages will never be generated`
    );
  }
}

/* Hand-picked `nearby` slugs must resolve too — they render as links. */
const enrichedSlugs = new Set(
  [...dataSrc.matchAll(/\{\s*slug:\s*"([a-z0-9-]+)",\s*name:/g)].map((m) => m[1])
);
for (const m of dataSrc.matchAll(/nearby:\s*\[([^\]]*)\]/g)) {
  for (const raw of m[1].split(",")) {
    const slug = raw.trim().replace(/^"|"$/g, "");
    if (slug && !enrichedSlugs.has(slug)) {
      errors.push(`nearby slug "${slug}" (src/lib/geo/data.ts) matches no enriched metro`);
    }
  }
}

/* ── 2. sitemap ⊆ prerendered ── */
const SITEMAP_DIR = join(ROOT, "sitemap");
if (existsSync(SITEMAP_DIR)) {
  for (const f of readdirSync(SITEMAP_DIR)) {
    if (!f.endsWith(".body")) continue;
    const xml = readFileSync(join(SITEMAP_DIR, f), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = m[1].replace(/^https?:\/\/[^/]+/, "") || "/";
      if (!routes.has(path)) {
        errors.push(`sitemap ${f} advertises ${path} but no page was prerendered (404)`);
      }
    }
  }
}

/* ── 3. internal hrefs ⊆ prerendered ── */
/* Anchors only — <link> preloads and asset URLs are not page routes. */
const ANCHOR = /<a\b[^>]*\shref="(\/[^"#?]*)"/g;
const IGNORE = /^(\/_next\/|\/api\/|\/sitemap|\/robots|\/manifest)/;
const broken = new Map();

for (const r of routes) {
  const file = join(ROOT, (r === "/" ? "/index" : r) + ".html");
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(ANCHOR)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (IGNORE.test(href) || routes.has(href)) continue;
    if (!broken.has(href)) broken.set(href, new Set());
    broken.get(href).add(r);
  }
}
for (const [href, sources] of broken) {
  const from = [...sources].slice(0, 3).join(", ");
  const more = sources.size > 3 ? ` (+${sources.size - 3} more)` : "";
  errors.push(`broken internal link ${href} — linked from ${from}${more}`);
}

if (errors.length) {
  console.error(`link-integrity FAIL (${errors.length}):`);
  for (const e of errors.slice(0, 40)) console.error("  " + e);
  if (errors.length > 40) console.error(`  …and ${errors.length - 40} more`);
  process.exit(1);
}
console.log(
  `link-integrity PASS: ${routes.size} prerendered routes — every enriched metro joins the dataset, ` +
  `every sitemap URL resolves, every internal link resolves.`
);
