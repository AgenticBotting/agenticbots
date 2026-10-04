import "server-only";
import type { Repository } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { isDemo } from "@/server/env";
import { ctxOf } from "./access";
import { ensureOntology } from "./ontology/service";
import { createIcp, createMarket } from "./markets";
import { enqueueJob, runJob } from "./jobs";

/**
 * Demo mode only: give Acme Roofing (fictional) one market with a finished
 * discovery run, so the operator console and client portal have something
 * to show. Every company, person and signal it creates is flagged demo and
 * named "[Demo] …". Never runs outside demo mode.
 */
const SEED_ACTOR: Actor = {
  user: { id: "demo-seed", email: "demo-seed@agenticbots.demo", name: "Demo seed", status: "active", platformRole: "superadmin" },
  platformRole: "superadmin",
  memberships: [],
};

const g = globalThis as unknown as { __abDemoMarket?: Promise<void> };

export async function ensureDemoMarket(r: Repository): Promise<void> {
  if (!isDemo()) return;
  await ensureOntology(r);
  const orgs = await r.list("organizations");
  const acme = orgs.find((o) => o.slug === "acme-roofing");
  if (!acme) return;
  const ctx = ctxOf(r, { kind: "user", actor: SEED_ACTOR });
  if ((await ctx.store.list("pg_markets", { orgId: acme.id, limit: 1 })).length > 0) return;
  g.__abDemoMarket ??= (async () => {
    const roof = (await ctx.store.list("pg_niches")).find((n) => n.key === "niche_roofing-and-exterior__commercial-roofing") ?? (await ctx.store.list("pg_niches")).find((n) => n.name === "Commercial Roofing");
    if (!roof) return;
    const geography = { kind: "county" as const, name: "Broward County", state: "FL" };
    const icp = await createIcp(ctx, acme.id, { name: "Commercial re-roofs — South Florida", nicheIds: [roof.id], geographies: [geography], services: ["TPO re-roof", "Roof coatings", "Leak repair"] });
    const market = await createMarket(ctx, acme.id, { nicheId: roof.id, icpId: icp.id, geography });
    const job = await enqueueJob(ctx, acme.id, "DISCOVER_MARKET", { marketId: market.id, limits: { maxCompanies: 20 } });
    await runJob(r, job.id);
  })().finally(() => {
    g.__abDemoMarket = undefined;
  });
  await g.__abDemoMarket;
}
