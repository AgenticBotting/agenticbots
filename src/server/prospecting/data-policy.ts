import "server-only";
import type { FactClaim, Provenance, UsagePolicy } from "@/lib/prospecting/types";
import { invalid } from "@/server/errors";
import type { GraphTx } from "./store";
import type { AnyProvider } from "./providers/types";
import { stableId } from "./ontology/normalize";

export const PUBLIC_FACT_POLICY: UsagePolicy = {
  scope: "public_shared",
  cacheAllowed: true,
  cacheTtlDays: 90,
  crossTenantReuseAllowed: true,
  rawDisplayAllowed: true,
  attributionRequired: false,
  derivedInsightAllowed: true,
  policyRef: "public-observed",
};

export const TENANT_PRIVATE_POLICY: UsagePolicy = {
  scope: "tenant_private",
  cacheAllowed: true,
  crossTenantReuseAllowed: false,
  rawDisplayAllowed: false,
  attributionRequired: false,
  derivedInsightAllowed: false,
  policyRef: "tenant-private",
};

export function policyForProvider(p: Pick<AnyProvider, "key" | "paid" | "demo" | "policy">): UsagePolicy {
  if (p.policy) return p.policy;
  if (p.demo || p.key === "native") return PUBLIC_FACT_POLICY;
  throw invalid(`Provider ${p.key} has no data usage policy; data storage is blocked, including free sources.`);
}

export function assertReusable(policy: UsagePolicy, orgId?: string): void {
  if (policy.scope === "restricted") throw invalid("Restricted data cannot be reused.");
  if (orgId && !policy.crossTenantReuseAllowed && policy.scope !== "tenant_private") throw invalid("This provider policy does not allow cross-tenant reuse.");
}

export function recordFactClaims(
  tx: GraphTx,
  input: {
    entityType: string;
    entityId: string;
    orgId?: string;
    facts: Record<string, string | number | boolean | null | undefined>;
    provenance: Provenance;
    policy: UsagePolicy;
  },
): FactClaim[] {
  const out: FactClaim[] = [];
  for (const [field, value] of Object.entries(input.facts)) {
    if (value === undefined) continue;
    out.push(tx.insert("pg_fact_claims", {
      id: stableId(`claim_${input.entityType}|${input.entityId}|${field}|${input.provenance.provider}|${input.provenance.externalId ?? ""}|${input.provenance.fetchedAt}`),
      entityType: input.entityType,
      entityId: input.entityId,
      field,
      value,
      orgId: input.orgId,
      provenance: input.provenance,
      policy: input.policy,
      confidence: input.provenance.confidence,
      observedAt: input.provenance.observedAt,
      fetchedAt: input.provenance.fetchedAt,
      expiresAt: input.provenance.expiresAt,
    }));
  }
  return out;
}
