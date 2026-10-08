/** Explicit acquisition publication coverage, separate from city enrichment. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = ".next/server/app";
const registry = JSON.parse(readFileSync("src/data/search-publication.json", "utf8"));
const errors = [];
const intents = new Set();
const seen = new Set();
const sitemaps = [0, 1].map(id => readFileSync(`${root}/sitemap/${id}.xml.body`, "utf8")).join("");
const locations = new Set([...sitemaps.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname));
const own = (path) => Object.hasOwn(registry, path);
const acquisition = (path) => /^\/(?:markets|industries)(?:\/|$)/.test(path) || /^\/services\/.+/.test(path);

for (const [path, entry] of Object.entries(registry)) {
  if (!acquisition(path) || !/^\/[a-z0-9/-]+$/.test(path)) errors.push(`${path}: invalid acquisition route`);
  if (!entry.intent || intents.has(entry.intent)) errors.push(`${path}: missing or duplicate intent owner`);
  intents.add(entry.intent);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updated) || !Number.isFinite(Date.parse(entry.updated))) errors.push(`${path}: invalid editorial date`);
  if (!["retained-indexability", "editorial-content"].includes(entry.basis)) errors.push(`${path}: missing publication basis`);
  if (!existsSync(`${root}${path}.html`)) errors.push(`${path}: missing rendered page`);
  if (!locations.has(path)) errors.push(`${path}: approved route missing from sitemap`);
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!entry.name.endsWith(".html")) continue;
    const path = file.slice(root.length, -5);
    if (!acquisition(path)) continue;
    const html = readFileSync(file, "utf8");
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
    const noindex = /\bnoindex\b/.test(robots);
    seen.add(path);
    if (noindex === own(path)) errors.push(`${path}: robots disagrees with explicit publication registry`);
    if (!own(path) && locations.has(path)) errors.push(`${path}: unapproved route in sitemap`);
    if (own(path)) {
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? "";
      if ((main.match(/<h1[\s>]/g) ?? []).length !== 1) errors.push(`${path}: missing main heading`);
      if (!main.includes('id="audit"') || !main.includes("$499")) errors.push(`${path}: missing paid-audit destination or price`);
      if (!main.includes('href="/')) errors.push(`${path}: missing contextual crawl path`);
      const sitemapEntry = [...sitemaps.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(match => {
        const loc = match[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
        return loc && new URL(loc).pathname === path;
      });
      if (!sitemapEntry?.[1].includes(`<lastmod>${registry[path].updated}`)) errors.push(`${path}: sitemap date differs from editorial revision`);
    }
  }
}
walk(root);
for (const path of locations) if (acquisition(path) && !own(path)) errors.push(`${path}: sitemap route has no publication record`);
if (errors.length) { console.error(`search-publication FAIL (${errors.length}):\n${errors.join("\n")}`); process.exit(1); }
console.log(`search-publication PASS: ${seen.size} acquisition pages; ${Object.keys(registry).length} explicit indexable routes with unique intent owners and matching sitemap dates. Editorial review remains required.`);
