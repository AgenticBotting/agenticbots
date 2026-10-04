import type { SellsTo } from "@/lib/prospecting/types";

/** Collapse internal whitespace and trim, preserving the original casing. */
export const tidy = (s: string): string => s.replace(/\s+/g, " ").trim();

/** Lowercase comparison form: "&" → "and", punctuation removed. */
export function normalizeName(s: string): string {
  return tidy(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(s: string): string {
  return normalizeName(s).replace(/\s+/g, "-");
}

const SELLS_TO: Record<string, SellsTo> = {
  residential: "residential",
  commercial: "commercial",
  industrial: "industrial",
  government: "government",
  mixed: "mixed",
  utility: "utility",
  agricultural: "agricultural",
};

export function parseSellsTo(raw: string): SellsTo | null {
  return SELLS_TO[normalizeName(raw)] ?? null;
}

/** Split "Board President; Treasurer; Board Member" → trimmed, de-duplicated titles. */
export function splitTitles(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.split(/[;|]/).map(tidy)) {
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Stable keys — the same CSV row always produces the same key. */
export const nicheKey = (category: string, niche: string) => `niche_${slugify(category)}__${slugify(niche)}`;
export const buyerKey = (segment: string, customerType: string) => `buyer_${slugify(segment)}__${slugify(customerType)}`;

/** Deterministic record id from a key, so reruns update instead of duplicating. */
export function stableId(key: string): string {
  // FNV-1a 64-bit → 16 hex chars, prefixed for readability.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
  }
  return `${key.split("_")[0]}_${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}
