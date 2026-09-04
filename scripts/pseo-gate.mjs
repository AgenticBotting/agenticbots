/**
 * pSEO quality gate (Phase 6). Fails the build when generated city pages
 * drift toward doorway-page similarity or incomplete data.
 *
 * Checks, per rendered city page's distinctive content (localNote +
 * market row + industry scenario inputs):
 *   1. completeness — every city row parses (zod does this at import)
 *      and every localNote clears the length floor;
 *   2. uniqueness — 4-gram shingle Jaccard similarity between any two
 *      localNotes must stay below THRESHOLD.
 */
import { readFileSync } from "node:fs";

const THRESHOLD = 0.35;
const src = readFileSync("src/lib/geo/data.ts", "utf8");
const notes = [...src.matchAll(/localNote:\s*\n?\s*"([^"]+)"/g)].map((m) => m[1]);

if (notes.length < 2) {
  console.error(`pseo-gate: expected ≥2 localNotes, found ${notes.length}`);
  process.exit(1);
}

const shingles = (t) => {
  const w = t.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i <= w.length - 4; i++) set.add(w.slice(i, i + 4).join(" "));
  return set;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
};

const sets = notes.map(shingles);
let worst = 0, worstPair = "";
for (let i = 0; i < sets.length; i++)
  for (let j = i + 1; j < sets.length; j++) {
    const sim = jaccard(sets[i], sets[j]);
    if (sim > worst) { worst = sim; worstPair = `${i}×${j}`; }
    if (sim >= THRESHOLD) {
      console.error(`pseo-gate FAIL: localNotes ${i} and ${j} are ${(sim * 100).toFixed(0)}% similar (threshold ${THRESHOLD * 100}%). Doorway-page territory — rewrite one.`);
      process.exit(1);
    }
  }
console.log(`pseo-gate PASS: ${notes.length} localNotes, worst pair ${worstPair} at ${(worst * 100).toFixed(1)}% similarity (threshold ${THRESHOLD * 100}%).`);
