/**
 * Phase A dataset validation (PROGRAMMATIC-SEO-PLAN.md §8):
 * counts, slug-collision check across states, surrounding-reference
 * resolution, tier sanity. Fails loudly; wired into CI alongside the
 * other gates.
 */
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync("src/data/cities-dataset.json", "utf8"));
const errs = [];
const warn = [];

if (d.states.length !== 51) errs.push(`states: ${d.states.length}, expected 51`);
if (d.cities.length !== 924) errs.push(`cities: ${d.cities.length}, expected 924`);
if (d.services.length !== 8) errs.push(`services: ${d.services.length}, expected 8`);

const stateSlugs = new Set(d.states.map((s) => s.slug));
const key = (c) => `${c.state_slug}/${c.city_slug}`;
const seen = new Map();
const byState = new Map();

for (const c of d.cities) {
  for (const f of ["city", "state", "state_abbr", "city_slug", "state_slug", "metro", "metro_slug", "tier"])
    if (c[f] === undefined || c[f] === "") errs.push(`${key(c)}: missing ${f}`);
  if (!stateSlugs.has(c.state_slug)) errs.push(`${key(c)}: unknown state_slug`);
  if (![1, 2, 3].includes(c.tier)) errs.push(`${key(c)}: bad tier ${c.tier}`);
  if (!/^[a-z0-9-]+$/.test(c.city_slug)) errs.push(`${key(c)}: non-canonical slug`);
  if (seen.has(key(c))) errs.push(`DUPLICATE: ${key(c)}`);
  seen.set(key(c), c);
  if (!byState.has(c.state_slug)) byState.set(c.state_slug, new Set());
  byState.get(c.state_slug).add(c.city_slug);
}

// surrounding refs: must resolve to a real city (same state preferred).
let surrTotal = 0, surrCross = 0;
for (const c of d.cities) {
  if (!Array.isArray(c.surrounding)) { errs.push(`${key(c)}: no surrounding[]`); continue; }
  if (c.surrounding.length < 1) warn.push(`${key(c)}: empty surrounding`);
  if (c.surrounding.length > 6) warn.push(`${key(c)}: ${c.surrounding.length} surrounding (cap is 6)`);
  for (const s of c.surrounding) {
    surrTotal++;
    if (byState.get(c.state_slug)?.has(s.slug)) continue;
    const anywhere = d.cities.some((x) => x.city_slug === s.slug);
    if (anywhere) surrCross++;
    else errs.push(`${key(c)}: surrounding "${s.slug}" resolves nowhere`);
  }
}

// duplicate city names across states (expected, informational)
const nameCount = new Map();
for (const c of d.cities) nameCount.set(c.city_slug, (nameCount.get(c.city_slug) || 0) + 1);
const dupes = [...nameCount.entries()].filter(([, n]) => n > 1).length;

const tiers = { 1: 0, 2: 0, 3: 0 };
for (const c of d.cities) tiers[c.tier]++;

console.log(`states ${d.states.length} · cities ${d.cities.length} · services ${d.services.length}`);
console.log(`tiers: T1=${tiers[1]} T2=${tiers[2]} T3=${tiers[3]} (plan says 481/248/195)`);
console.log(`surrounding refs: ${surrTotal} total, ${surrCross} cross-state, all resolve: ${errs.filter(e => e.includes("resolves nowhere")).length === 0}`);
console.log(`city slugs shared across states (handled by /{state}/ segment): ${dupes}`);
if (warn.length) { console.log(`\nwarnings (${warn.length}):`); warn.slice(0, 10).forEach((w) => console.log("  " + w)); }
if (errs.length) {
  console.error(`\nvalidate-cities FAIL (${errs.length}):`);
  errs.slice(0, 25).forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("\nvalidate-cities PASS");
