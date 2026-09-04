/**
 * CI SEO gate (Phase 10): title length + uniqueness, meta-description
 * length + uniqueness, exactly-one-H1 — validated against the actual
 * prerendered HTML in .next, so what ships is what's checked.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".next/server/app";
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) pages.push(p);
  }
})(ROOT);

const errors = [];
const titles = new Map();
const descs = new Map();

for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const route = p.slice(ROOT.length, -5);
  if (route.includes("_not-found") || route.includes("_global-error") || route.includes("/design")) continue;

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  const h1s = (html.match(/<h1[\s>]/g) || []).length;

  if (!title) errors.push(`${route}: missing <title>`);
  else {
    if (title.length > 70) errors.push(`${route}: title ${title.length} chars (>70): "${title}"`);
    if (titles.has(title)) errors.push(`${route}: duplicate title with ${titles.get(title)}: "${title}"`);
    titles.set(title, route);
  }
  if (!desc) errors.push(`${route}: missing meta description`);
  else {
    if (desc.length > 170) errors.push(`${route}: description ${desc.length} chars (>170)`);
    if (descs.has(desc)) errors.push(`${route}: duplicate description with ${descs.get(desc)}`);
    descs.set(desc, route);
  }
  if (h1s !== 1) errors.push(`${route}: ${h1s} <h1> elements (want exactly 1)`);
}

if (errors.length) {
  console.error(`seo-checks FAIL (${errors.length}):`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`seo-checks PASS: ${pages.length} prerendered pages — titles unique ≤70, descriptions unique ≤170, one H1 each.`);
