import "server-only";
import type { NicheBuyerRelationship } from "@/lib/prospecting/types";
import type { Repository } from "@/server/db/repository";
import { audit } from "@/server/services/common";
import { correlationId, nowIso } from "@/server/ids";
import { invalid, notFound } from "@/server/errors";
import { isDemo } from "@/server/env";
import { graphOf, type ProspectGraphStore } from "../store";
import { assertAllowed, principalRef, type Principal } from "../access";
import { generateRelationships, importBuyerTypes, importNiches, type ImportSummary, type RelationshipSummary } from "./importer";
import { BUYER_TYPES_CSV, BUYER_TYPES_CSV_FILE, NICHES_CSV, NICHES_CSV_FILE } from "./seed-data";

export interface SeedResult {
  niches: ImportSummary;
  buyers: ImportSummary;
  relationships: RelationshipSummary;
}

const SEEDER = { id: "system", name: "Ontology seed" };

/**
 * Import the bundled seed CSVs and (re)generate relationships.
 * Idempotent: a rerun inserts nothing and preserves every operator review.
 */
export async function seedOntology(store: ProspectGraphStore, by = SEEDER): Promise<SeedResult> {
  const niches = await importNiches(store, by, { fileName: NICHES_CSV_FILE, text: NICHES_CSV });
  const buyers = await importBuyerTypes(store, by, { fileName: BUYER_TYPES_CSV_FILE, text: BUYER_TYPES_CSV });
  const relationships = await generateRelationships(store);
  return { niches, buyers, relationships };
}

const g = globalThis as unknown as { __abOntology?: Promise<void> };

/**
 * Demo and tests: make sure the ontology exists before a prospecting page
 * or tool reads it. Cheap after the first call (one list of niches).
 * In staging/production the ontology is loaded with `npm run prospecting:seed`.
 */
export async function ensureOntology(r: Repository): Promise<void> {
  // Staging/production load the ontology deliberately (npm run prospecting:seed).
  if (!isDemo()) return;
  const store = graphOf(r);
  if ((await store.list("pg_niches", { limit: 1 })).length > 0) return;
  g.__abOntology ??= seedOntology(store).then(() => undefined).finally(() => {
    g.__abOntology = undefined;
  });
  await g.__abOntology;
}

export type RelationshipDecision =
  | { decision: "approve"; note?: string }
  | { decision: "reject"; note?: string }
  | { decision: "edit"; note?: string; priority?: number; confidence?: number; relevantDecisionMakerTitles?: string[]; relationshipType?: NicheBuyerRelationship["relationshipType"] };

/**
 * Operator review. Approved/rejected/edited rows become source "operator"
 * and are never regenerated or re-sent to an LLM.
 */
export async function reviewRelationship(r: Repository, p: Principal, relId: string, d: RelationshipDecision): Promise<NicheBuyerRelationship> {
  assertAllowed(p, "review_ontology");
  const store = graphOf(r);
  const rel = await store.get("pg_relationships", relId);
  if (!rel) throw notFound("Relationship");
  const who = principalRef(p);
  const base = { reviewedBy: who.id, reviewedAt: nowIso(), reviewNote: d.note?.slice(0, 500), source: "operator" as const };
  let changes: Partial<NicheBuyerRelationship>;
  if (d.decision === "approve") changes = { ...base, status: "approved" };
  else if (d.decision === "reject") changes = { ...base, status: "rejected" };
  else {
    if (d.priority !== undefined && (d.priority < 1 || d.priority > 5)) throw invalid("Priority must be 1–5.");
    if (d.confidence !== undefined && (d.confidence < 0 || d.confidence > 1)) throw invalid("Confidence must be 0–1.");
    changes = {
      ...base,
      status: "approved",
      ...(d.priority !== undefined ? { priority: Math.round(d.priority) } : {}),
      ...(d.confidence !== undefined ? { confidence: d.confidence } : {}),
      ...(d.relevantDecisionMakerTitles ? { relevantDecisionMakerTitles: d.relevantDecisionMakerTitles.map((t) => t.trim()).filter(Boolean) } : {}),
      ...(d.relationshipType ? { relationshipType: d.relationshipType } : {}),
    };
  }
  const tx = store.tx();
  const next = tx.patch("pg_relationships", rel, changes);
  audit(tx.audit, who, { action: `prospecting.relationship.${d.decision}`, targetType: "relationship", targetId: rel.id, correlationId: correlationId(), detail: d.note });
  await tx.commit();
  return next;
}

export interface OntologyOverview {
  niches: number;
  buyers: number;
  relationships: number;
  byStatus: Record<string, number>;
  tiers: Record<"A" | "B" | "C", number>;
  unmappedBuyers: { id: string; name: string; segment: string }[];
  lastImports: { kind: string; at: string; inserted: number; updated: number; unchanged: number; malformed: number; duplicates: number }[];
}

export async function ontologyOverview(r: Repository, p: Principal): Promise<OntologyOverview> {
  assertAllowed(p, "read_shared");
  const store = graphOf(r);
  const [niches, buyers, rels, runs] = await Promise.all([
    store.list("pg_niches"), store.list("pg_buyer_types"), store.list("pg_relationships"), store.list("pg_import_runs", { limit: 10 }),
  ]);
  const byStatus: Record<string, number> = {};
  for (const x of rels) byStatus[x.status] = (byStatus[x.status] ?? 0) + 1;
  const tiers = { A: 0, B: 0, C: 0 };
  for (const n of niches) tiers[n.tier]++;
  const mapped = new Set(rels.filter((x) => x.status !== "rejected").map((x) => x.buyerTypeId));
  return {
    niches: niches.length,
    buyers: buyers.length,
    relationships: rels.length,
    byStatus,
    tiers,
    unmappedBuyers: buyers.filter((b) => !mapped.has(b.id)).map((b) => ({ id: b.id, name: b.name, segment: b.segment })),
    lastImports: runs.map((x) => ({ kind: x.kind, at: x.createdAt, inserted: x.inserted, updated: x.updated, unchanged: x.unchanged, malformed: x.malformed.length, duplicates: x.duplicates.length })),
  };
}
