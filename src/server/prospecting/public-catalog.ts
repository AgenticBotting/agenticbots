import "server-only";
import type { PublicNicheCatalog } from "@/lib/public-niche-types";
import { assertAllowed, type Principal } from "./access";
import type { ProspectGraphStore } from "./store";
import { slugify } from "./ontology/normalize";
import { recipesForBuyer } from "./ontology/discovery-recipes";
import { invalid } from "@/server/errors";

/** Operator-only, read-only projection. Copy allowed vocabulary; never spread records. */
export async function publicNicheCatalog(store: ProspectGraphStore, principal: Principal): Promise<PublicNicheCatalog> {
  assertAllowed(principal, "review_ontology");
  const [niches, buyers, relationships] = await Promise.all([
    store.list("pg_niches"), store.list("pg_buyer_types"), store.list("pg_relationships"),
  ]);
  const buyerSlugs = new Map(buyers.map(buyer => [buyer.id, slugify(buyer.name)]));
  const nicheSlugs = niches.map(niche => slugify(niche.name));
  if (new Set(buyerSlugs.values()).size !== buyers.length || new Set(nicheSlugs).size !== niches.length) {
    throw invalid("Catalog names need distinct public URLs before export.");
  }
  const rank = { approved: 0, auto_approved: 1, needs_review: 2, rejected: 3 };
  return {
    niches: niches.map(niche => ({
      slug: slugify(niche.name), name: niche.name, category: niche.category, audience: niche.sellsTo,
      buyers: relationships.filter(rel => rel.nicheId === niche.id && (rel.status === "approved" || rel.status === "auto_approved") && buyerSlugs.has(rel.buyerTypeId))
        .sort((a, b) => rank[a.status] - rank[b.status] || a.priority - b.priority || b.confidence - a.confidence || buyerSlugs.get(a.buyerTypeId)!.localeCompare(buyerSlugs.get(b.buyerTypeId)!))
        .map(rel => ({
          buyer: buyerSlugs.get(rel.buyerTypeId)!, roles: [...rel.relevantDecisionMakerTitles],
          relationship: rel.relationshipType, motion: rel.buyingMotion,
          validation: rel.status === "approved" ? "reviewed" as const : "modeled" as const,
        })),
    })).sort((a, b) => a.name.localeCompare(b.name)),
    buyers: buyers.map(buyer => ({
      slug: buyerSlugs.get(buyer.id)!, name: buyer.name, segment: buyer.segment,
      roles: [...buyer.decisionMakerTitles],
      kind: buyer.buyerKind === "consumer" ? "household" as const : buyer.buyerKind === "referral" ? "referral" as const : "organization" as const,
      research: recipesForBuyer(buyer).map(recipe => recipe.label),
    })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
