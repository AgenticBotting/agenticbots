import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prospectWorld } from "./helpers";
import { publicNicheCatalog } from "@/server/prospecting/public-catalog";
import { asUser } from "@/server/prospecting/access";
import { reviewRelationship } from "@/server/prospecting/ontology/service";
import { slugify } from "@/server/prospecting/ontology/normalize";

describe("public niche catalog boundary", () => {
  let w: Awaited<ReturnType<typeof prospectWorld>>;
  beforeAll(async () => { w = await prospectWorld(); });
  afterEach(() => vi.restoreAllMocks());

  it("denies client users and BOTS before reading any table", async () => {
    const list = vi.spyOn(w.ops.store, "list");
    for (const p of [asUser(w.owner), asUser(w.member), { kind: "bot" as const, botId: w.acmeBot.id, orgId: w.acme.id, name: "BOT" }]) {
      await expect(publicNicheCatalog(w.ops.store, p)).rejects.toMatchObject({ code: "forbidden" });
    }
    expect(list).not.toHaveBeenCalled();
    list.mockRestore();
  });

  it("exports only allowed vocabulary from the three shared ontology tables without writing", async () => {
    const list = vi.spyOn(w.ops.store, "list");
    const tx = vi.spyOn(w.ops.store, "tx");
    const catalog = await publicNicheCatalog(w.ops.store, w.ops.p);
    expect(list.mock.calls.map(call => call[0]).sort()).toEqual(["pg_buyer_types", "pg_niches", "pg_relationships"]);
    expect(tx).not.toHaveBeenCalled();
    expect(catalog.niches).toHaveLength(341);
    expect(catalog.buyers).toHaveLength(137);
    for (const niche of catalog.niches) {
      expect(Object.keys(niche).sort()).toEqual(["audience", "buyers", "category", "name", "slug"]);
      for (const relationship of niche.buyers) expect(Object.keys(relationship).sort()).toEqual(["buyer", "motion", "relationship", "roles", "validation"]);
    }
    for (const buyer of catalog.buyers) expect(Object.keys(buyer).sort()).toEqual(["kind", "name", "research", "roles", "segment", "slug"]);
    const serialized = JSON.stringify(catalog);
    for (const forbidden of [w.acme.id, w.acme.name, w.owner.user.email, '"confidence":', '"rationale":', '"orgId":', '"externalId":', '"provider":', '"costUsd":']) expect(serialized.includes(forbidden), `public output contains ${forbidden}`).toBe(false);
    list.mockRestore(); tx.mockRestore();
  });

  it("excludes pending and rejected matches, preserves approvals and separates modeled fit from reviewed fit", async () => {
    const relationships = await w.ops.store.list("pg_relationships");
    const niches = await w.ops.store.list("pg_niches");
    const buyers = await w.ops.store.list("pg_buyer_types");
    const chosen = relationships.find(rel => rel.status === "auto_approved")!;
    const pending = relationships.find(rel => rel.status === "needs_review")!;
    const publicRel = (catalog: Awaited<ReturnType<typeof publicNicheCatalog>>, rel: typeof chosen) => catalog.niches.find(niche => niche.slug === slugify(niches.find(item => item.id === rel.nicheId)!.name))!.buyers.find(buyer => buyer.buyer === slugify(buyers.find(item => item.id === rel.buyerTypeId)!.name));
    const initial = await publicNicheCatalog(w.ops.store, w.ops.p);
    expect(publicRel(initial, chosen)?.validation).toBe("modeled");
    expect(publicRel(initial, pending)).toBeUndefined();
    await reviewRelationship(w.r, w.ops.p, pending.id, { decision: "approve" });
    await reviewRelationship(w.r, w.ops.p, chosen.id, { decision: "reject" });
    const changed = await publicNicheCatalog(w.ops.store, w.ops.p);
    expect(publicRel(changed, pending)?.validation).toBe("reviewed");
    expect(publicRel(changed, chosen)).toBeUndefined();
    expect(changed.buyers).toHaveLength(137);
    expect(changed.niches).toHaveLength(341);
  });
});
