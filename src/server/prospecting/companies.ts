import "server-only";
import type { BuyerType, Company, CompanyPerson, Person, Provenance } from "@/lib/prospecting/types";
import type { GraphTx, ProspectGraphStore } from "./store";
import { audit } from "@/server/services/common";
import { correlationId } from "@/server/ids";
import type { DiscoveredCompany, FoundPerson } from "./providers/types";
import { coreName, normalizeDomain, normalizePhone, resolveIdentity } from "./identity";
import { normalizeName, stableId } from "./ontology/normalize";
import { normalizeTitle, roleFamilyOf, seniorityOf } from "./ontology/titles";
import { PUBLIC_FACT_POLICY, recordFactClaims } from "./data-policy";
import { assertAllowed, principalRef, type Ctx } from "./access";

/**
 * Company identity graph writes.
 *
 * Every discovered record is kept as a CompanySourceRecord (one per
 * provider + external id) with its provenance. The canonical Company is
 * resolved with identity.ts; facts already on the company are only filled
 * in, never overwritten by a weaker source.
 */
export interface IngestResult {
  company: Company;
  created: boolean;
  matchMethod: "domain" | "phone" | "name_address" | "new";
}

export async function candidatesFor(store: ProspectGraphStore, d: Pick<DiscoveredCompany, "name" | "domain" | "phone" | "location">): Promise<Company[]> {
  const out = new Map<string, Company>();
  const byDomain = d.domain ? await store.findCompanyByDomain(d.domain) : null;
  if (byDomain) out.set(byDomain.id, byDomain);
  const byPhone = d.phone ? await store.findCompanyByPhone(d.phone) : null;
  if (byPhone) out.set(byPhone.id, byPhone);
  for (const c of await store.findCompaniesByName(normalizeName(d.name))) out.set(c.id, c);
  for (const c of await store.list("pg_companies")) {
    if (c.locations.some((l) => l.state === d.location.state && (l.zip === d.location.zip || (!!l.city && l.city === d.location.city)))) out.set(c.id, c);
  }
  return [...out.values()];
}

/**
 * Upsert one discovered company. `pending` holds companies created earlier
 * in the same (uncommitted) transaction so a batch never duplicates itself.
 */
export async function ingestCompany(
  store: ProspectGraphStore,
  tx: GraphTx,
  d: DiscoveredCompany,
  provenance: Provenance,
  buyerType: BuyerType | undefined,
  pending: Map<string, Company>,
  policy = PUBLIC_FACT_POLICY,
): Promise<IngestResult> {
  const now = provenance.fetchedAt;
  const candidates = [...(await candidatesFor(store, d)), ...pending.values()];
  const match = resolveIdentity({ name: d.name, domain: d.domain, phone: d.phone, locations: [d.location] }, candidates);
  const domain = normalizeDomain(d.domain ?? d.website);
  const phone = normalizePhone(d.phone);
  let company: Company;
  let created = false;

  const newId = stableId(`co_${domain ?? `${coreName(d.name)}|${d.location.zip ?? d.location.city ?? ""}|${d.location.state ?? ""}`}`);
  // Same stable id already stored (e.g. a re-run) → treat as a domain/name match, never a duplicate.
  const sameId = !match.company ? (pending.get(newId) ?? (await store.get("pg_companies", newId))) : null;
  const target = match.company ?? sameId;

  if (!target) {
    company = tx.insert("pg_companies", {
      id: newId,
      canonicalName: d.name,
      normalizedName: normalizeName(d.name),
      domain,
      website: d.website,
      phone,
      locations: [d.location],
      industry: d.category,
      employeeRange: d.employeeRange,
      locationCount: d.locationCount,
      portfolioSize: d.portfolioSize,
      buyerTypeIds: buyerType ? [buyerType.id] : [],
      buyerClassification: buyerType ? { buyerTypeId: buyerType.id, confidence: 0.8, method: "source_category", classifiedAt: now } : undefined,
      aliases: [],
      identityConfidence: d.confidence,
      firstSeenAt: now,
      lastSeenAt: now,
      demo: provenance.demo,
    });
    created = true;
  } else {
    const c = pending.get(target.id) ?? target;
    const aliases = c.canonicalName === d.name || c.aliases.includes(d.name) ? c.aliases : [...c.aliases, d.name].slice(0, 20);
    const sameLoc = c.locations.some((l) => l.zip === d.location.zip && l.city === d.location.city);
    company = pending.has(c.id)
      ? { ...c, aliases }
      : tx.patch("pg_companies", c, {
          aliases,
          lastSeenAt: now,
          domain: c.domain ?? domain,
          phone: c.phone ?? phone,
          website: c.website ?? d.website,
          employeeRange: c.employeeRange ?? d.employeeRange,
          locationCount: c.locationCount ?? d.locationCount,
          portfolioSize: c.portfolioSize ?? d.portfolioSize,
          locations: sameLoc ? c.locations : [...c.locations, d.location].slice(0, 50),
          buyerTypeIds: buyerType && !c.buyerTypeIds.includes(buyerType.id) ? [...c.buyerTypeIds, buyerType.id] : c.buyerTypeIds,
          identityConfidence: Math.max(c.identityConfidence, match.company ? match.confidence : c.identityConfidence),
        });
  }
  pending.set(company.id, company);

  const srcId = stableId(`src_${provenance.provider}_${d.externalId}`);
  if (!(await store.get("pg_company_sources", srcId))) {
    const source = tx.insert("pg_company_sources", {
      id: srcId,
      companyId: company.id,
      provenance: { ...provenance, externalId: d.externalId, sourceUrl: d.sourceUrl },
      policy,
      facts: { name: d.name, domain: d.domain ?? null, phone: d.phone ?? null, city: d.location.city ?? null, state: d.location.state ?? null, zip: d.location.zip ?? null, category: d.category ?? null, ...d.facts },
      matchMethod: match.method,
      matchConfidence: match.company ? match.confidence : 1,
    });
    recordFactClaims(tx, {
      entityType: "company",
      entityId: company.id,
      facts: source.facts,
      provenance: source.provenance,
      policy,
    });
    if (!match.company && candidates.length > 0) {
      const nearest = candidates.sort((a, b) => normalizeName(a.canonicalName).localeCompare(normalizeName(b.canonicalName)))[0];
      const reviewConfidence = Math.max(match.confidence, 0.5);
      tx.insert("pg_company_merge_reviews", {
        id: stableId(`merge_${source.id}_${nearest?.id ?? "none"}`),
        candidateCompanyId: nearest?.id,
        sourceRecordId: source.id,
        canonicalCompanyId: company.id,
        proposedName: d.name,
        confidence: reviewConfidence,
        status: "needs_review",
        reason: "Near company identity match below the automatic merge threshold.",
        evidence: [
          { kind: "name", value: d.name, confidence: reviewConfidence },
          ...(d.domain ? [{ kind: "domain" as const, value: d.domain, confidence: 0.95 }] : []),
          ...(d.phone ? [{ kind: "phone" as const, value: d.phone, confidence: 0.85 }] : []),
          ...(d.location.city || d.location.zip ? [{ kind: "address" as const, value: `${d.location.city ?? ""} ${d.location.state ?? ""} ${d.location.zip ?? ""}`.trim(), confidence: 0.6 }] : []),
        ],
      });
    }
  }
  return { company, created, matchMethod: match.method };
}

/**
 * Rule-based buyer-type classification for a company with no source category.
 * Exact or contained buyer-type names in the company's industry/name only;
 * anything weaker is left unclassified for an operator.
 */
export function classifyBuyerType(company: Pick<Company, "canonicalName" | "industry">, buyers: BuyerType[]): { buyerTypeId: string; confidence: number } | undefined {
  const hay = normalizeName(`${company.industry ?? ""} ${company.canonicalName}`);
  let best: { buyerTypeId: string; confidence: number } | undefined;
  for (const b of buyers) {
    const name = b.normalizedName;
    const conf = normalizeName(company.industry ?? "") === name ? 0.85 : hay.includes(name) ? 0.65 : 0;
    if (conf > (best?.confidence ?? 0)) best = { buyerTypeId: b.id, confidence: conf };
  }
  return best;
}

export async function approveCompanyMerge(ctx: Ctx, reviewId: string): Promise<void> {
  assertAllowed(ctx.p, "review_ontology");
  const review = await ctx.store.get("pg_company_merge_reviews", reviewId);
  if (!review || !review.candidateCompanyId || !review.canonicalCompanyId || !review.sourceRecordId) return;
  const source = await ctx.store.get("pg_company_sources", review.sourceRecordId);
  if (!source) return;
  const tx = ctx.store.tx();
  tx.patch("pg_company_sources", source, { companyId: review.candidateCompanyId });
  tx.patch("pg_company_merge_reviews", review, { status: "merged", reviewedBy: principalRef(ctx.p).id, reviewedAt: ctx.now.toISOString() });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.company.merge", targetType: "company_merge_review", targetId: review.id, correlationId: correlationId(), detail: `${review.canonicalCompanyId} → ${review.candidateCompanyId}` });
  await tx.commit();
}

export async function unmergeCompanySource(ctx: Ctx, reviewId: string): Promise<void> {
  assertAllowed(ctx.p, "review_ontology");
  const review = await ctx.store.get("pg_company_merge_reviews", reviewId);
  if (!review || !review.canonicalCompanyId || !review.sourceRecordId) return;
  const source = await ctx.store.get("pg_company_sources", review.sourceRecordId);
  if (!source) return;
  const tx = ctx.store.tx();
  tx.patch("pg_company_sources", source, { companyId: review.canonicalCompanyId });
  tx.patch("pg_company_merge_reviews", review, { status: "unmerged", reviewedBy: principalRef(ctx.p).id, reviewedAt: ctx.now.toISOString() });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.company.unmerge", targetType: "company_merge_review", targetId: review.id, correlationId: correlationId(), detail: `${review.candidateCompanyId ?? "unknown"} → ${review.canonicalCompanyId}` });
  await tx.commit();
}

/** Upsert people found at a company, de-duplicated by company + normalized name. */
export async function ingestPeople(
  store: ProspectGraphStore,
  tx: GraphTx,
  companyId: string,
  found: FoundPerson[],
  provenance: Provenance,
): Promise<{ person: Person; role: CompanyPerson }[]> {
  const out: { person: Person; role: CompanyPerson }[] = [];
  for (const f of found) {
    if (!f.fullName.trim() || !f.title.trim()) continue;
    const personId = stableId(`per_${companyId}_${normalizeName(f.fullName)}`);
    const person = (await store.get("pg_people", personId)) ?? tx.insert("pg_people", {
      id: personId,
      fullName: f.fullName.trim(),
      firstName: f.firstName ?? f.fullName.trim().split(/\s+/)[0],
      lastName: f.lastName ?? f.fullName.trim().split(/\s+/).slice(-1)[0],
      location: f.location,
      demo: provenance.demo,
    });
    const roleId = stableId(`cp_${companyId}_${personId}`);
    const prior = await store.get("pg_company_people", roleId);
    const doc = {
      companyId,
      personId,
      title: f.title.trim(),
      normalizedTitle: normalizeTitle(f.title),
      roleFamily: roleFamilyOf(f.title),
      seniority: seniorityOf(f.title),
      employmentConfidence: Math.max(0, Math.min(1, f.employmentConfidence)),
      provenance: { ...provenance, externalId: f.externalId, sourceUrl: f.sourceUrl },
    };
    const role = prior ? tx.patch("pg_company_people", prior, doc) : tx.insert("pg_company_people", { ...doc, id: roleId });
    out.push({ person, role });
  }
  return out;
}
