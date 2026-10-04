import "server-only";
import type { ProspectStatus } from "@/lib/prospecting/types";
import type { Repository } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { asUser, ctxOf } from "./access";
import { listProspects } from "./prospects";

/**
 * CLIENT projection of prospects.
 *
 * What a client sees: the company, why it is a fit / why now, who the
 * decision maker is, and where it stands. What a client NEVER sees: data
 * vendor names, provenance, costs, score internals, other clients' data,
 * or the email address itself before it is handed to their outbound Bot.
 */
export interface ClientProspect {
  id: string;
  company: string;
  location: string;
  buyerType: string;
  market: string;
  contact?: { name: string; title: string };
  status: string;
  priority?: number;
  why: string[];
  demo: boolean;
}

const LABEL: Record<ProspectStatus, string> = {
  new: "New", researching: "Researching", review: "In review", qualified: "Ready for outreach", rejected: "Not a fit",
  sent_to_outbound: "In outreach", contacted: "Contacted", replied: "Replied", meeting: "Meeting booked",
  opportunity: "Opportunity", won: "Won", lost: "Closed — lost", exhausted: "Exhausted",
};

/** Client-safe text: drop internal record-quality lines. */
const CLIENT_SAFE = (line: string) => !/^Identity \d+%/.test(line);

export async function clientProspects(r: Repository, actor: Actor, orgId: string): Promise<ClientProspect[]> {
  const ctx = ctxOf(r, asUser(actor));
  const rows = (await listProspects(ctx, orgId)).filter((p) => p.status !== "new" && p.status !== "researching" && p.status !== "rejected");
  const out: ClientProspect[] = [];
  for (const p of rows) {
    const [company, market, buyer] = await Promise.all([
      ctx.store.get("pg_companies", p.companyId),
      ctx.store.get("pg_markets", p.marketId),
      p.buyerTypeId ? ctx.store.get("pg_buyer_types", p.buyerTypeId) : null,
    ]);
    if (!company || !market) continue;
    const role = p.decisionMakerIds[0] ? await ctx.store.get("pg_company_people", p.decisionMakerIds[0]) : null;
    const person = role ? await ctx.store.get("pg_people", role.personId) : null;
    const loc = company.locations[0];
    out.push({
      id: p.id,
      company: company.canonicalName,
      location: [loc?.city, loc?.state].filter(Boolean).join(", "),
      buyerType: buyer?.name ?? "Unclassified",
      market: market.name,
      contact: person && role ? { name: person.fullName, title: role.title } : undefined,
      status: LABEL[p.status],
      priority: p.score?.priority,
      why: p.whyNow.filter(CLIENT_SAFE).map((w) => w.replace(/ \(\d+% relationship confidence[^)]*\)/, "")).slice(0, 4),
      demo: company.demo,
    });
  }
  return out;
}
