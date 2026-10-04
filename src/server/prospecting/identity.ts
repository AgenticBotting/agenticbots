/**
 * Company identity resolution.
 *
 *   "ABC Roofing LLC" · "ABC Roofing" · "abcroofing.com"  →  one company
 *
 * Matching order, strongest first:
 *   1. same registrable domain                     confidence 0.95
 *   2. same normalized phone                        0.85
 *   3. same core name AND same city/zip             0.8
 *   4. very similar core name AND same city/zip     0.65 (below MERGE_MIN → new record + alias)
 *
 * We never merge below MERGE_MIN: a wrong merge corrupts two companies,
 * a missed merge only costs a duplicate an operator can fold later.
 * Every source record is kept (CompanySourceRecord) whatever happens.
 */
import type { Company, CompanyLocation } from "@/lib/prospecting/types";

export const MERGE_MIN = 0.75;
export const IDENTITY_VERSION = "identity/1.0.0";

const LEGAL_SUFFIX = /\b(llc|l l c|inc|incorporated|corp|corporation|co|company|ltd|limited|lp|llp|pllc|pc|pa|group|holdings|enterprises|services|service|the)\b/g;
const CONNECTORS = /\b(and|of|&)\b/g;

export function coreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’'`.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(LEGAL_SUFFIX, " ")
    .replace(CONNECTORS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDomain(input?: string | null): string | undefined {
  if (!input) return undefined;
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "");
  d = d.split(/[/?#:]/)[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return undefined;
  return d;
}

export function normalizePhone(input?: string | null): string | undefined {
  if (!input) return undefined;
  const digits = input.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? ten : undefined;
}

/** Dice coefficient over character bigrams of the core names (0–1). */
export function nameSimilarity(a: string, b: string): number {
  const x = coreName(a).replace(/\s/g, "");
  const y = coreName(b).replace(/\s/g, "");
  if (!x || !y) return 0;
  if (x === y) return 1;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1);
    return m;
  };
  const gx = grams(x);
  const gy = grams(y);
  let inter = 0;
  for (const [g, n] of gx) inter += Math.min(n, gy.get(g) ?? 0);
  return (2 * inter) / (x.length - 1 + (y.length - 1));
}

function sameLocality(a: CompanyLocation[], b: CompanyLocation[]): boolean {
  return a.some((x) => b.some((y) => (x.zip && x.zip === y.zip) || (x.city && y.city && x.city.toLowerCase() === y.city.toLowerCase() && x.state === y.state)));
}

export interface IdentityCandidate {
  name: string;
  domain?: string;
  phone?: string;
  locations: CompanyLocation[];
}

export interface IdentityMatch {
  company: Company | null;
  method: "domain" | "phone" | "name_address" | "new";
  confidence: number;
}

/** Pure function: pick the best existing company for a candidate. */
export function resolveIdentity(candidate: IdentityCandidate, existing: Company[]): IdentityMatch {
  const domain = normalizeDomain(candidate.domain);
  const phone = normalizePhone(candidate.phone);
  if (domain) {
    const hit = existing.find((c) => c.domain === domain);
    if (hit) return { company: hit, method: "domain", confidence: 0.95 };
  }
  if (phone) {
    const hit = existing.find((c) => c.phone === phone);
    if (hit) return { company: hit, method: "phone", confidence: 0.85 };
  }
  let best: IdentityMatch = { company: null, method: "new", confidence: 0 };
  for (const c of existing) {
    if (!sameLocality(candidate.locations, c.locations)) continue;
    const names = [c.canonicalName, ...c.aliases];
    const sim = Math.max(...names.map((n) => nameSimilarity(candidate.name, n)));
    const conf = sim === 1 ? 0.8 : sim >= 0.9 ? 0.65 : 0;
    if (conf > best.confidence) best = { company: c, method: "name_address", confidence: conf };
  }
  return best.confidence >= MERGE_MIN ? best : { company: null, method: "new", confidence: best.confidence };
}
