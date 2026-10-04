import "server-only";
import { createHash } from "node:crypto";
import type { BuyerType, ImportRun, NicheBuyerRelationship, ServiceNiche } from "@/lib/prospecting/types";
import type { ProspectGraphStore } from "../store";
import { parseCsv } from "./csv";
import { buyerKey, nicheKey, normalizeName, parseSellsTo, slugify, splitTitles, stableId, tidy } from "./normalize";
import { buyerKindOf, buyerTags, nicheTags } from "./taxonomy";
import { roleFamilyOf } from "./titles";
import { scoreNiche, tierOf } from "./niche-scoring";
import { proposeForNiche, RELATIONSHIP_VERSION } from "./relationships";

/**
 * Idempotent ontology import.
 *
 *  - validates required columns, reports malformed rows (never silently drops)
 *  - stable ids from normalized keys → reruns update, never duplicate
 *  - display names preserved; original values kept verbatim on the record
 *  - duplicates inside a file reported (first occurrence wins)
 *  - an ImportRun row is written for every run (append-only)
 *  - unchanged rows are not rewritten
 */
export const IMPORTER_VERSION = "ontology-import/1.0.0";

const NICHE_COLUMNS = ["category", "niche", "sells to"];
const BUYER_COLUMNS = ["segment", "customer type", "typical decision maker titles"];

export interface ImportInput {
  fileName: string;
  text: string;
}

export interface ImportSummary {
  run: ImportRun;
  ok: boolean;
  /** Set when the file could not be imported at all (e.g. missing columns). */
  error?: string;
}

export interface Actorish {
  id: string;
  name: string;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function headerIndex(header: string[], required: string[]): { idx: number[]; missing: string[] } {
  const norm = header.map((h) => normalizeName(h));
  const idx = required.map((r) => norm.indexOf(normalizeName(r)));
  return { idx, missing: required.filter((_, i) => idx[i] < 0) };
}

/** Fields whose change should rewrite a stored record. */
const nicheShape = (n: Omit<ServiceNiche, "id" | "createdAt" | "updatedAt" | "version" | "importRunId">) =>
  JSON.stringify([n.category, n.name, n.sellsTo, n.tags, n.attractiveness, n.tier, n.original]);
const buyerShape = (b: Omit<BuyerType, "id" | "createdAt" | "updatedAt" | "version" | "importRunId">) =>
  JSON.stringify([b.segment, b.name, b.decisionMakerTitles, b.roleFamilies, b.tags, b.buyerKind, b.original]);

export async function importNiches(store: ProspectGraphStore, by: Actorish, input: ImportInput): Promise<ImportSummary> {
  const records = parseCsv(input.text);
  const runBase = { kind: "niches" as const, fileName: input.fileName, contentHash: sha(input.text), importerVersion: IMPORTER_VERSION, importedBy: by.name };
  const tx = store.tx();
  if (records.length === 0) {
    const run = tx.insert("pg_import_runs", { ...runBase, rowsRead: 0, inserted: 0, updated: 0, unchanged: 0, duplicates: [], malformed: [{ row: 0, reason: "File is empty.", raw: "" }] });
    await tx.commit();
    return { run, ok: false, error: "File is empty." };
  }
  const { idx, missing } = headerIndex(records[0].fields, NICHE_COLUMNS);
  if (missing.length) {
    const reason = `Missing required column(s): ${missing.join(", ")}.`;
    const run = tx.insert("pg_import_runs", { ...runBase, rowsRead: records.length - 1, inserted: 0, updated: 0, unchanged: 0, duplicates: [], malformed: [{ row: 1, reason, raw: records[0].raw }] });
    await tx.commit();
    return { run, ok: false, error: reason };
  }

  const existing = new Map((await store.list("pg_niches")).map((n) => [n.key, n]));
  const seen = new Map<string, number>();
  const malformed: ImportRun["malformed"] = [];
  const duplicates: ImportRun["duplicates"] = [];
  let inserted = 0, updated = 0, unchanged = 0;
  const runId = stableId(`run_niches_${sha(input.text)}_${Date.now()}`);

  for (const rec of records.slice(1)) {
    const [category, niche, sellsRaw] = idx.map((i) => tidy(rec.fields[i] ?? ""));
    if (rec.fields.length < NICHE_COLUMNS.length) { malformed.push({ row: rec.line, reason: "Too few columns.", raw: rec.raw }); continue; }
    if (!category || !niche) { malformed.push({ row: rec.line, reason: "Category and Niche are required.", raw: rec.raw }); continue; }
    const sellsTo = parseSellsTo(sellsRaw);
    if (!sellsTo) { malformed.push({ row: rec.line, reason: `Unknown "Sells To" value "${sellsRaw}".`, raw: rec.raw }); continue; }
    const key = nicheKey(category, niche);
    if (seen.has(key)) { duplicates.push({ row: rec.line, key, firstRow: seen.get(key)! }); continue; }
    seen.set(key, rec.line);

    const tags = nicheTags(category, niche, sellsTo);
    const attractiveness = scoreNiche(tags, sellsTo);
    const doc = {
      key,
      category,
      categoryKey: slugify(category),
      name: niche,
      normalizedName: normalizeName(niche),
      sellsTo,
      original: { category: rec.fields[idx[0]] ?? "", niche: rec.fields[idx[1]] ?? "", sellsTo: rec.fields[idx[2]] ?? "" },
      tags,
      attractiveness,
      tier: tierOf(attractiveness.total),
    };
    const prior = existing.get(key);
    if (!prior) {
      tx.insert("pg_niches", { ...doc, id: stableId(key), importRunId: runId });
      inserted++;
    } else if (nicheShape(prior) !== nicheShape(doc)) {
      tx.patch("pg_niches", prior, { ...doc, importRunId: runId });
      updated++;
    } else unchanged++;
  }
  const run = tx.insert("pg_import_runs", { ...runBase, id: runId, rowsRead: records.length - 1, inserted, updated, unchanged, duplicates, malformed });
  await tx.commit();
  return { run, ok: true };
}

export async function importBuyerTypes(store: ProspectGraphStore, by: Actorish, input: ImportInput): Promise<ImportSummary> {
  const records = parseCsv(input.text);
  const runBase = { kind: "buyer_types" as const, fileName: input.fileName, contentHash: sha(input.text), importerVersion: IMPORTER_VERSION, importedBy: by.name };
  const tx = store.tx();
  if (records.length === 0) {
    const run = tx.insert("pg_import_runs", { ...runBase, rowsRead: 0, inserted: 0, updated: 0, unchanged: 0, duplicates: [], malformed: [{ row: 0, reason: "File is empty.", raw: "" }] });
    await tx.commit();
    return { run, ok: false, error: "File is empty." };
  }
  const { idx, missing } = headerIndex(records[0].fields, BUYER_COLUMNS);
  if (missing.length) {
    const reason = `Missing required column(s): ${missing.join(", ")}.`;
    const run = tx.insert("pg_import_runs", { ...runBase, rowsRead: records.length - 1, inserted: 0, updated: 0, unchanged: 0, duplicates: [], malformed: [{ row: 1, reason, raw: records[0].raw }] });
    await tx.commit();
    return { run, ok: false, error: reason };
  }
  const existing = new Map((await store.list("pg_buyer_types")).map((b) => [b.key, b]));
  const seen = new Map<string, number>();
  const malformed: ImportRun["malformed"] = [];
  const duplicates: ImportRun["duplicates"] = [];
  let inserted = 0, updated = 0, unchanged = 0;
  const runId = stableId(`run_buyers_${sha(input.text)}_${Date.now()}`);

  for (const rec of records.slice(1)) {
    const [segment, customerType, titlesRaw] = idx.map((i) => tidy(rec.fields[i] ?? ""));
    if (rec.fields.length < BUYER_COLUMNS.length) { malformed.push({ row: rec.line, reason: "Too few columns.", raw: rec.raw }); continue; }
    if (!segment || !customerType) { malformed.push({ row: rec.line, reason: "Segment and Customer Type are required.", raw: rec.raw }); continue; }
    const titles = splitTitles(titlesRaw);
    if (titles.length === 0) { malformed.push({ row: rec.line, reason: "No decision-maker titles.", raw: rec.raw }); continue; }
    const key = buyerKey(segment, customerType);
    if (seen.has(key)) { duplicates.push({ row: rec.line, key, firstRow: seen.get(key)! }); continue; }
    seen.set(key, rec.line);
    const doc = {
      key,
      segment,
      segmentKey: slugify(segment),
      name: customerType,
      normalizedName: normalizeName(customerType),
      decisionMakerTitles: titles,
      roleFamilies: [...new Set(titles.map(roleFamilyOf))],
      tags: buyerTags(segment, customerType),
      buyerKind: buyerKindOf(segment, customerType),
      original: { segment: rec.fields[idx[0]] ?? "", customerType: rec.fields[idx[1]] ?? "", titles: rec.fields[idx[2]] ?? "" },
    };
    const prior = existing.get(key);
    if (!prior) {
      tx.insert("pg_buyer_types", { ...doc, id: stableId(key), importRunId: runId });
      inserted++;
    } else if (buyerShape(prior) !== buyerShape(doc)) {
      tx.patch("pg_buyer_types", prior, { ...doc, importRunId: runId });
      updated++;
    } else unchanged++;
  }
  const run = tx.insert("pg_import_runs", { ...runBase, id: runId, rowsRead: records.length - 1, inserted, updated, unchanged, duplicates, malformed });
  await tx.commit();
  return { run, ok: true };
}

const relShape = (r: Pick<NicheBuyerRelationship, "confidence" | "status" | "relationshipType" | "relevantDecisionMakerTitles" | "reasoning" | "generatorVersion" | "priority">) =>
  JSON.stringify([r.confidence, r.status, r.relationshipType, r.relevantDecisionMakerTitles, r.reasoning, r.generatorVersion, r.priority]);

export interface RelationshipSummary {
  proposed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  /** Operator-reviewed rows left exactly as they were. */
  preservedReviewed: number;
  removedStale: number;
  autoApproved: number;
  needsReview: number;
}

/**
 * Regenerate rule-based relationships. Rows an operator approved, rejected
 * or edited are never touched; unreviewed rule rows that the current rules
 * no longer propose are removed.
 */
export async function generateRelationships(store: ProspectGraphStore): Promise<RelationshipSummary> {
  const [niches, buyers, existingRows] = await Promise.all([
    store.list("pg_niches"), store.list("pg_buyer_types"), store.list("pg_relationships"),
  ]);
  const existing = new Map(existingRows.map((r) => [`${r.nicheId}|${r.buyerTypeId}`, r]));
  const tx = store.tx();
  const proposedKeys = new Set<string>();
  const s: RelationshipSummary = { proposed: 0, inserted: 0, updated: 0, unchanged: 0, preservedReviewed: 0, removedStale: 0, autoApproved: 0, needsReview: 0 };

  for (const niche of niches) {
    for (const p of proposeForNiche(niche, buyers)) {
      s.proposed++;
      const k = `${p.nicheId}|${p.buyerTypeId}`;
      proposedKeys.add(k);
      const prior = existing.get(k);
      const doc = { ...p, source: "rules" as const };
      if (!prior) {
        tx.insert("pg_relationships", { ...doc, id: stableId(`rel_${k}`) });
        s.inserted++;
      } else if (prior.source === "operator" || prior.status === "approved" || prior.status === "rejected") {
        s.preservedReviewed++;
      } else if (relShape(prior) !== relShape(doc)) {
        tx.patch("pg_relationships", prior, doc);
        s.updated++;
      } else s.unchanged++;
      if (p.status === "auto_approved") s.autoApproved++; else s.needsReview++;
    }
  }
  for (const [k, row] of existing) {
    if (proposedKeys.has(k)) continue;
    if (row.source === "rules" && (row.status === "auto_approved" || row.status === "needs_review")) {
      tx.delete("pg_relationships", row.id);
      s.removedStale++;
    }
  }
  await tx.commit();
  return s;
}

export { RELATIONSHIP_VERSION };
