/**
 * Cannibalization gate.
 *
 * docs/SERVICE-CONTENT-BLUEPRINT.md §1 specifies an owns[]/excludes[] term
 * budget and says: "Without this gate the restructure is a diagram, not a
 * defense." This is that gate.
 *
 * Term disjointness itself is enforced at module load in src/lib/catalog.ts
 * (a service cannot ship owning a term another service owns). What can only
 * be checked against the rendered corpus lives here:
 *
 *   A  exactly one indexable page per (topic, scope)
 *   B  a page uses another service's owned terms at most twice
 *   C  a page actually uses its own terms (so B cannot pass by being empty)
 *   E  no retired URL is still a real page, and no redirect shadows one
 *   F  a page's canonical stays inside its own topic
 *
 * Run after `next build`.
 */

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REDIRECTS, STATIC_REDIRECT_SOURCES } from "../src/lib/redirects.mjs";

const ROOT = ".next/server/app";
const EXCLUDE_BUDGET = 2;
const OWNS_FLOOR = 1;

/* Blog posts are allowed to share a topic with a service page, but only in
   the informational scope — never the commercial one. */
const BLOG_TOPIC_MAP = {
  "speed-to-lead-is-the-whole-game": "agentic-speed-to-lead",
};

/* A regex capture out of a 300 KB page is a V8 sliced string that pins the
   whole parent. Retaining thousands of them OOMs the gate. */
const flat = (s) => Buffer.from(s, "utf8").toString("utf8");

/* ── Read the contract straight out of catalog.ts, the same way pseo-gate
   reads localNotes. The count assertion is load-bearing: a formatting
   change that broke the regex would otherwise pass zero records. ── */
const src = readFileSync("src/lib/catalog.ts", "utf8");
const services = [];
for (const m of src.matchAll(/serviceSlug:\s*"([a-z0-9-]+)"/g)) {
  const after = src.slice(m.index, m.index + 4000);
  const owns = [...(after.match(/owns:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const excludes = [...(after.match(/excludes:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  services.push({ slug: m[1], owns, excludes });
}
if (services.length !== 13) {
  console.error(`topic-gate: expected 13 service records in catalog.ts, parsed ${services.length}. Regex is stale.`);
  process.exit(1);
}
const BY_SLUG = new Map(services.map((s) => [s.slug, s]));

/* ── Walk the corpus ── */
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) pages.push(p);
  }
})(ROOT);

const errors = [];
const seen = new Map(); // "topic|scope" -> route
const coverage = new Map(); // topic -> [hits, total]

/* Hyphens and spaces are the same token here: the copy writes
   "speed-to-lead" and "after-hours" where the term list says "speed to
   lead" and "after-hours coverage". Normalise both sides so the gate
   measures meaning rather than punctuation. */
const norm = (s) => s.replace(/[\u2010-\u2015-]+/g, " ").replace(/\s+/g, " ");
const word = (t) =>
  new RegExp(`\\b${norm(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s-]+")}\\b`, "gi");
const ownsRe = new Map(services.map((s) => [s.slug, s.owns.map((t) => [t, word(t)])]));
const exclRe = new Map(services.map((s) => [s.slug, s.excludes.map((t) => [t, word(t)])]));

for (const p of pages) {
  const route = flat(p.slice(ROOT.length, -5));
  if (route.includes("_not-found") || route.includes("_global-error") || route.includes("/design")) continue;

  const html = readFileSync(p, "utf8");
  const indexable = !/<meta name="robots"[^>]*content="[^"]*noindex/i.test(html);
  const canonical = flat(html.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? "");

  /* Classify */
  let topic = null;
  let scope = null;
  const svcMatch = route.match(/^\/services\/([a-z0-9-]+)(\/([a-z-]+))?(\/([a-z0-9-]+))?$/);
  const blogMatch = route.match(/^\/blog\/([a-z0-9-]+)$/);
  if (svcMatch && BY_SLUG.has(svcMatch[1])) {
    topic = svcMatch[1];
    scope = svcMatch[5] ? `city:${svcMatch[3]}/${svcMatch[5]}` : svcMatch[3] ? `state:${svcMatch[3]}` : "national";
  } else if (blogMatch && BLOG_TOPIC_MAP[blogMatch[1]]) {
    topic = BLOG_TOPIC_MAP[blogMatch[1]];
    scope = "informational";
  }
  if (!topic) continue;

  /* A — one indexable page per topic+scope */
  if (indexable) {
    const key = `${topic}|${scope}`;
    if (seen.has(key)) {
      errors.push(`${route}: second indexable page for ${key} (first: ${seen.get(key)})`);
    } else {
      seen.set(key, route);
    }
  }

  /* F — canonical stays inside its own topic */
  if (scope !== "informational" && canonical && !canonical.includes(`/services/${topic}`)) {
    errors.push(`${route}: canonical "${canonical}" points outside its topic`);
  }

  if (scope === "informational") continue;

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase();

  /* B — excludes budget */
  for (const [term, re] of exclRe.get(topic)) {
    const n = (body.match(re) || []).length;
    if (n > EXCLUDE_BUDGET) {
      errors.push(`${route}: uses excluded term "${term}" ${n}x (budget ${EXCLUDE_BUDGET})`);
    }
  }

  /* C — owns floor, national scope only.
     The hub is where a service stakes its topical claim, so an empty one
     would pass B trivially. State and city pages are deliberately local
     content — a directory of metros carries almost none of the service
     vocabulary — and holding them to the same floor would reward keyword
     stuffing, which is the behaviour this gate exists to prevent. They are
     still bound by A, B and F. */
  if (scope === "national") {
    const hits = ownsRe.get(topic).filter(([, re]) => re.test(body)).length;
    coverage.set(topic, [hits, BY_SLUG.get(topic).owns.length]);
    if (hits < Math.min(OWNS_FLOOR, BY_SLUG.get(topic).owns.length)) {
      errors.push(`${route}: contains none of its own claimed terms — topically empty`);
    }
  }
}

/* E — retired URLs must not exist, and no redirect may shadow a real page */
const routeSet = new Set(pages.map((p) => p.slice(ROOT.length, -5)));
for (const dead of ["/local", "/marketing/paid-media", "/sales/crm", "/sales/inbound"]) {
  if (routeSet.has(dead)) errors.push(`retired URL ${dead} is still prerendered`);
}
for (const source of STATIC_REDIRECT_SOURCES) {
  if (routeSet.has(source)) {
    errors.push(`${source} is both a redirect source and a real page — the page is unreachable`);
  }
}

if (errors.length) {
  console.error(`topic-gate FAIL (${errors.length}):`);
  for (const e of errors.slice(0, 40)) console.error("  " + e);
  if (errors.length > 40) console.error(`  ... and ${errors.length - 40} more`);
  process.exit(1);
}
console.log(
  `topic-gate PASS: ${services.length} services, ${seen.size} indexable topic+scope pages, ` +
    `${REDIRECTS.length} redirects — one page per topic, no exclusion breaches.`
);

/* Not a failure: the owns[] list is the entity set a hub is *aiming* at, and
   copy catches up to it over time. Printed every run so the gap stays
   visible rather than quietly becoming permanent. */
const thin = [...coverage.entries()].filter(([, [h, t]]) => h < Math.ceil(t / 2));
if (thin.length) {
  console.log(`\ntopic-gate NOTE: ${thin.length} hubs cover under half their target entities —`);
  for (const [slug, [h, t]] of thin.sort((a, b) => a[1][0] - b[1][0])) {
    console.log(`  ${String(h).padStart(2)}/${t}  /services/${slug}`);
  }
}
