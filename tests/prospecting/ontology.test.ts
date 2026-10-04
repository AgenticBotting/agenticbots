import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MemoryRepository } from "@/server/db/memory";
import { graphOf } from "@/server/prospecting/store";
import { parseCsv } from "@/server/prospecting/ontology/csv";
import { importBuyerTypes, importNiches, generateRelationships } from "@/server/prospecting/ontology/importer";
import { seedOntology, reviewRelationship } from "@/server/prospecting/ontology/service";
import { BUYER_TYPES_CSV, NICHES_CSV } from "@/server/prospecting/ontology/seed-data";
import { buyerKey, nicheKey, normalizeName, parseSellsTo, splitTitles, stableId } from "@/server/prospecting/ontology/normalize";
import { normalizeTitle, roleFamilyOf, seniorityOf, titleMatch } from "@/server/prospecting/ontology/titles";
import { scoreNiche, tierOf } from "@/server/prospecting/ontology/niche-scoring";
import { MAX_PER_NICHE, MAX_REFERRAL_PER_NICHE } from "@/server/prospecting/ontology/relationships";
import { coreName, normalizeDomain, normalizePhone, resolveIdentity } from "@/server/prospecting/identity";
import { asUser } from "@/server/prospecting/access";
import { world } from "../support/fixtures";
import type { Company } from "@/lib/prospecting/types";

const BY = { id: "t", name: "test" };
const store = () => graphOf(new MemoryRepository());

describe("CSV parsing", () => {
  it("handles BOM, quotes, embedded commas/newlines and CRLF", () => {
    const rows = parseCsv('﻿a,b\r\n"x, y","line1\nline2"\r\n"he said ""hi""",z\n');
    expect(rows.map((r) => r.fields)).toEqual([["a", "b"], ["x, y", "line1\nline2"], ['he said "hi"', "z"]]);
    expect(rows[2].line).toBe(4);
  });
});

describe("seed data", () => {
  it("embedded copy matches the CSV files exactly (run npm run prospecting:embed-seed after edits)", () => {
    expect(NICHES_CSV).toBe(readFileSync("data/prospecting/service_business_niches.csv", "utf8"));
    expect(BUYER_TYPES_CSV).toBe(readFileSync("data/prospecting/icp_customer_buyer_types.csv", "utf8"));
  });
});

describe("ontology import", () => {
  it("imports both seed files cleanly and is idempotent", async () => {
    const s = store();
    const first = await seedOntology(s);
    expect(first.niches.run).toMatchObject({ rowsRead: 341, inserted: 341, malformed: [], duplicates: [] });
    expect(first.buyers.run).toMatchObject({ rowsRead: 137, inserted: 137, malformed: [], duplicates: [] });
    expect(first.relationships.inserted).toBeGreaterThan(5000);
    const again = await seedOntology(s);
    expect(again.niches.run).toMatchObject({ inserted: 0, updated: 0, unchanged: 341 });
    expect(again.buyers.run).toMatchObject({ inserted: 0, updated: 0, unchanged: 137 });
    expect(again.relationships).toMatchObject({ inserted: 0, updated: 0, removedStale: 0 });
    expect((await s.list("pg_niches")).length).toBe(341);
    expect((await s.list("pg_import_runs")).length).toBe(4); // every run is recorded
  });

  it("reports duplicates and malformed rows instead of dropping them silently", async () => {
    const s = store();
    const csv = "Category,Niche,Sells To\nRoofing,Commercial Roofing,Commercial\nRoofing,Commercial  Roofing,Commercial\n,Missing,Commercial\nRoofing,Odd,Martian\nRoofing\n";
    const res = await importNiches(s, BY, { fileName: "t.csv", text: csv });
    expect(res.run.inserted).toBe(1);
    expect(res.run.duplicates).toHaveLength(1);
    expect(res.run.malformed.map((m) => m.reason).join(" ")).toMatch(/required[\s\S]*Unknown "Sells To"[\s\S]*Too few columns/);
  });

  it("refuses a file with missing columns", async () => {
    const res = await importBuyerTypes(store(), BY, { fileName: "bad.csv", text: "Segment,Name\nA,B\n" });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing required column/);
  });

  it("updates changed rows in place with stable ids", async () => {
    const s = store();
    await importNiches(s, BY, { fileName: "a.csv", text: "Category,Niche,Sells To\nRoofing,Commercial Roofing,Commercial\n" });
    const res = await importNiches(s, BY, { fileName: "a.csv", text: "Category,Niche,Sells To\nRoofing,Commercial Roofing,Mixed\n" });
    expect(res.run).toMatchObject({ inserted: 0, updated: 1 });
    const rows = await s.list("pg_niches");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(stableId(nicheKey("Roofing", "Commercial Roofing")));
    expect(rows[0].sellsTo).toBe("mixed");
  });
});

describe("normalization", () => {
  it("normalizes names, keys, sells-to and titles", () => {
    expect(normalizeName("  HOA/Community   Management & Co. ")).toBe("hoa community management and co");
    expect(nicheKey("Roofing & Exterior", "Commercial Roofing")).toBe(nicheKey("roofing and exterior", "commercial  roofing"));
    expect(buyerKey("A", "B")).not.toBe(buyerKey("A", "C"));
    expect(parseSellsTo(" Utility ")).toBe("utility");
    expect(parseSellsTo("??")).toBeNull();
    expect(splitTitles("Board President; Treasurer;  board president ;")).toEqual(["Board President", "Treasurer"]);
    expect(normalizeTitle("Sr. Dir. of Fac. Ops")).toBe("senior director of facilities operations");
    expect(roleFamilyOf("Dir. of Facilities")).toBe("facilities");
    expect(roleFamilyOf("Chief Engineer")).toBe("engineering_maintenance");
    expect(roleFamilyOf("Property Manager")).toBe("property_management");
    expect(seniorityOf("VP Facilities")).toBe("vp");
    expect(seniorityOf("Owner")).toBe("owner_c_level");
    expect(titleMatch("Facilities Manager", ["facilities"])).toBe(1);
    expect(titleMatch("Chief Engineer", ["facilities"])).toBe(0.6);
    expect(titleMatch("Marketing Director", ["facilities"])).toBe(0);
  });

  it("resolves company identity without false merges", () => {
    const base: Company = { id: "c1", canonicalName: "ABC Roofing LLC", normalizedName: "abc roofing llc", domain: "abcroofing.com", phone: "5551234567", locations: [{ city: "Miami", state: "FL", zip: "33101" }], buyerTypeIds: [], aliases: [], identityConfidence: 0.9, firstSeenAt: "", lastSeenAt: "", demo: false, createdAt: "", updatedAt: "", version: 1 };
    expect(coreName("ABC Roofing, LLC")).toBe("abc roofing");
    expect(normalizeDomain("https://www.ABCRoofing.com/about")).toBe("abcroofing.com");
    expect(normalizePhone("+1 (555) 123-4567")).toBe("5551234567");
    expect(resolveIdentity({ name: "Different", domain: "abcroofing.com", locations: [] }, [base]).method).toBe("domain");
    expect(resolveIdentity({ name: "Whatever", phone: "555-123-4567", locations: [] }, [base]).method).toBe("phone");
    expect(resolveIdentity({ name: "ABC Roofing", locations: [{ city: "Miami", state: "FL" }] }, [base]).method).toBe("name_address");
    // Same name, different city: not merged.
    expect(resolveIdentity({ name: "ABC Roofing", locations: [{ city: "Tampa", state: "FL" }] }, [base]).company).toBeNull();
  });
});

describe("niche scoring", () => {
  it("is deterministic, bounded and tiers the right niches", async () => {
    const a = scoreNiche(["roofing", "building_envelope", "field_service"], "commercial");
    expect(scoreNiche(["roofing", "building_envelope", "field_service"], "commercial")).toEqual(a);
    expect(a.total).toBeGreaterThanOrEqual(0);
    expect(a.total).toBeLessThanOrEqual(100);
    expect(Object.values(a.weights).reduce((x, y) => x + y, 0)).toBe(100);
    expect(tierOf(65)).toBe("A");
    expect(tierOf(50)).toBe("B");
    expect(tierOf(49.9)).toBe("C");
    const s = store();
    await seedOntology(s);
    const niches = await s.list("pg_niches");
    const tier = (name: string) => niches.find((n) => n.name === name)?.tier;
    expect(tier("Commercial Roofing")).toBe("A");
    for (const n of niches) expect(n.attractiveness.reasoning.length).toBeGreaterThan(0);
  });
});

describe("niche ↔ buyer relationships", () => {
  it("is not a Cartesian product and respects caps", async () => {
    const s = store();
    await seedOntology(s);
    const [niches, buyers, rels] = await Promise.all([s.list("pg_niches"), s.list("pg_buyer_types"), s.list("pg_relationships")]);
    expect(rels.length).toBeLessThan((niches.length * buyers.length) / 3);
    const byNiche = new Map<string, typeof rels>();
    for (const r of rels) byNiche.set(r.nicheId, [...(byNiche.get(r.nicheId) ?? []), r]);
    for (const list of byNiche.values()) {
      expect(list.filter((r) => r.relationshipType !== "referral").length).toBeLessThanOrEqual(MAX_PER_NICHE);
      expect(list.filter((r) => r.relationshipType === "referral").length).toBeLessThanOrEqual(MAX_REFERRAL_PER_NICHE);
    }
    // Referral sources are never auto-approved.
    expect(rels.filter((r) => r.relationshipType === "referral" && r.status === "auto_approved")).toHaveLength(0);
    // Every row explains itself.
    expect(rels.every((r) => r.reasoning.length > 0 && r.generatorVersion)).toBe(true);
  });

  it("never overwrites an operator's review when rules are re-run", async () => {
    const w = await world();
    const s = graphOf(w.r);
    await seedOntology(s);
    const rels = await s.list("pg_relationships", { where: { status: "needs_review" } });
    const [a, b] = rels;
    await reviewRelationship(w.r, asUser(w.operator), a.id, { decision: "approve" });
    await reviewRelationship(w.r, asUser(w.operator), b.id, { decision: "reject", note: "not a fit" });
    const res = await generateRelationships(s);
    expect(res.preservedReviewed).toBe(2);
    expect((await s.get("pg_relationships", a.id))?.status).toBe("approved");
    expect((await s.get("pg_relationships", b.id))).toMatchObject({ status: "rejected", source: "operator", reviewNote: "not a fit" });
    // Clients and members cannot review.
    await expect(reviewRelationship(w.r, asUser(w.owner), a.id, { decision: "reject" })).rejects.toThrow();
  });
});
