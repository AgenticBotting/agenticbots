import "server-only";
import type { DomainMailIntel, EmailStatus, Provenance } from "@/lib/prospecting/types";
import { isDemo } from "@/server/env";
import type { ProspectGraphStore } from "./store";
import { isFresh } from "./freshness";
import { stableId } from "./ontology/normalize";

/**
 * Email intelligence — the free, internal layer the router tries BEFORE any
 * paid provider.
 *
 *   isValidEmailSyntax       syntax only
 *   inferPattern             learn "{first}.{last}" from verified addresses at a domain
 *   applyPattern             build a candidate address from a pattern
 *   getDomainMailIntelligence MX lookup (DNS, free) + cached pattern; NO SMTP probing
 *   getCompanyEmailPattern   the best-known pattern for a domain
 *
 * Status meanings (shared by every provider adapter):
 *   VERIFIED      a verifier confirmed the mailbox
 *   LIKELY_VALID  built from a confirmed domain pattern / provider guess, not verified
 *   CATCH_ALL     the domain accepts everything; cannot be confirmed
 *   RISKY         verifier could not confirm (role account, temporary error, low score)
 *   INVALID       verifier or syntax says it will bounce
 *   UNKNOWN       no evidence either way
 * Only VERIFIED and LIKELY_VALID may reach outbound automatically.
 */
export const OUTBOUND_OK: ReadonlySet<EmailStatus> = new Set<EmailStatus>(["VERIFIED", "LIKELY_VALID"]);

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const ROLE = /^(info|sales|admin|office|contact|support|hello|team|billing|service|noreply|no-reply)@/i;

export function isValidEmailSyntax(email: string): boolean {
  return email.length <= 254 && EMAIL.test(email);
}

export function isRoleAddress(email: string): boolean {
  return ROLE.test(email);
}

export const PATTERNS = ["{first}.{last}", "{first}{last}", "{f}{last}", "{first}", "{first}_{last}", "{f}.{last}", "{first}{l}", "{last}"] as const;
export type EmailPattern = (typeof PATTERNS)[number];

const clean = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");

export function applyPattern(pattern: string, first: string, last: string, domain: string): string | undefined {
  const f = clean(first);
  const l = clean(last);
  if (!f || !l) return undefined;
  const local = pattern.replace("{first}", f).replace("{last}", l).replace("{f}", f[0]).replace("{l}", l[0]);
  const email = `${local}@${domain.toLowerCase()}`;
  return isValidEmailSyntax(email) ? email : undefined;
}

/** Learn the most common pattern from known (name, email) pairs at one domain. */
export function inferPattern(examples: { first: string; last: string; email: string }[]): { pattern: EmailPattern; confidence: number; evidence: number } | undefined {
  const counts = new Map<EmailPattern, number>();
  let usable = 0;
  for (const ex of examples) {
    const domain = ex.email.split("@")[1];
    if (!domain) continue;
    let hit = false;
    for (const p of PATTERNS) {
      if (applyPattern(p, ex.first, ex.last, domain) === ex.email.toLowerCase()) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
        hit = true;
        break;
      }
    }
    if (hit) usable++;
  }
  if (usable === 0) return undefined;
  const [pattern, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  // One example is a hint; three agreeing examples is a pattern.
  const confidence = Math.min(0.95, 0.5 + 0.15 * n) * (n / usable);
  return { pattern, confidence: Math.round(confidence * 100) / 100, evidence: n };
}

/** DNS resolver seam. The default uses DNS (free); demo/tests inject a fake. */
export interface MxResolver {
  hasMx(domain: string): Promise<boolean | undefined>;
}

export const demoResolver: MxResolver = {
  async hasMx(domain) {
    // Reserved demo domains behave as if they had mail servers.
    return domain.endsWith(".example") ? true : undefined;
  },
};

export const dnsResolver: MxResolver = {
  async hasMx(domain) {
    try {
      const { resolveMx } = await import("node:dns/promises");
      const mx = await resolveMx(domain);
      return mx.length > 0;
    } catch (e) {
      const code = (e as { code?: string }).code;
      return code === "ENOTFOUND" || code === "ENODATA" ? false : undefined;
    }
  },
};

export const defaultResolver = (): MxResolver => (isDemo() ? demoResolver : dnsResolver);

const nativeProvenance = (now: Date, demo: boolean, confidence: number): Provenance => ({
  provider: "native", observedAt: now.toISOString(), fetchedAt: now.toISOString(), confidence, demo,
});

/**
 * Domain mail intelligence: MX presence + the best-known pattern.
 * Cached for TTL_DAYS.domain_intel; DNS only, never a mailbox probe.
 */
export async function getDomainMailIntelligence(store: ProspectGraphStore, domain: string, now: Date, resolver: MxResolver = defaultResolver()): Promise<DomainMailIntel> {
  const d = domain.toLowerCase();
  const id = stableId(`dmi_${d}`);
  const prior = await store.get("pg_domain_intel", id);
  if (prior && isFresh("domain_intel", prior.checkedAt, now)) return prior;
  const hasMx = await resolver.hasMx(d);
  const learned = await learnPattern(store, d);
  const doc = {
    domain: d,
    hasMx,
    catchAll: prior?.catchAll,
    pattern: learned?.pattern ?? prior?.pattern,
    patternConfidence: learned?.confidence ?? prior?.patternConfidence,
    patternEvidenceCount: learned?.evidence ?? prior?.patternEvidenceCount ?? 0,
    checkedAt: now.toISOString(),
    provenance: nativeProvenance(now, d.endsWith(".example"), hasMx === undefined ? 0.3 : 0.9),
  };
  const tx = store.tx();
  const row = prior ? tx.patch("pg_domain_intel", prior, doc) : tx.insert("pg_domain_intel", { ...doc, id });
  await tx.commit();
  return row;
}

async function learnPattern(store: ProspectGraphStore, domain: string) {
  const points = (await store.list("pg_contact_points")).filter((c) => c.kind === "work_email" && c.status === "VERIFIED" && c.value.endsWith(`@${domain}`));
  if (points.length === 0) return undefined;
  const people = await Promise.all(points.map((c) => store.get("pg_people", c.personId)));
  const examples = points
    .map((c, i) => ({ email: c.value, first: people[i]?.firstName ?? "", last: people[i]?.lastName ?? "" }))
    .filter((x) => x.first && x.last);
  return inferPattern(examples);
}

export async function getCompanyEmailPattern(store: ProspectGraphStore, domain: string): Promise<{ pattern: string; confidence: number; evidence: number } | undefined> {
  const learned = await learnPattern(store, domain.toLowerCase());
  if (learned) return learned;
  const intel = await store.get("pg_domain_intel", stableId(`dmi_${domain.toLowerCase()}`));
  return intel?.pattern ? { pattern: intel.pattern, confidence: intel.patternConfidence ?? 0, evidence: intel.patternEvidenceCount } : undefined;
}
