import { world } from "../support/fixtures";
import { ensureOntology } from "@/server/prospecting/ontology/service";
import { asUser, ctxOf, type Principal } from "@/server/prospecting/access";
import { createMarket } from "@/server/prospecting/markets";
import { Tx } from "@/server/db/repository";
import { DemoContactProvider, DemoDataProvider, DemoOutboundProvider, DemoVerificationProvider } from "@/server/prospecting/providers/demo";
import {
  ProviderError, type ContactEnrichmentProvider, type EmailVerificationProvider, type OutboundProvider, type ProspectDataProvider,
  type ProviderErrorKind, type ProviderSet,
} from "@/server/prospecting/providers/types";
import type { Bot } from "@/lib/platform/types";

export const NOW = new Date("2026-10-04T12:00:00.000Z");
export const BROWARD = { kind: "county" as const, name: "Broward County", state: "FL" };

export async function prospectWorld() {
  const w = await world();
  await ensureOntology(w.r);
  const ops = ctxOf(w.r, asUser(w.operator), NOW);
  const admin = ctxOf(w.r, asUser(w.admin), NOW);
  const niches = await ops.store.list("pg_niches");
  const roofing = niches.find((n) => n.name === "Commercial Roofing")!;
  const paving = niches.find((n) => /asphalt paving/i.test(n.name)) ?? niches.find((n) => n.tags.includes("paving_parking"))!;
  const bots = await w.r.list("bots");
  const acmeBot = bots.find((b) => b.orgId === w.acme.id && b.typeKey === "prospecting")!;
  return { ...w, ops, admin, roofing, paving, acmeBot, ctx: (p: Principal) => ctxOf(w.r, p, NOW) };
}

export async function acmeMarket(pw: Awaited<ReturnType<typeof prospectWorld>>) {
  return createMarket(pw.ops, pw.acme.id, { nicheId: pw.roofing.id, geography: BROWARD });
}

/** Insert a Bot for tests (copy of an existing one with changes). */
export async function addBot(pw: Awaited<ReturnType<typeof prospectWorld>>, changes: Partial<Bot>): Promise<Bot> {
  const rest: Partial<Bot> = { ...pw.acmeBot };
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  delete rest.version;
  const tx = new Tx(pw.r);
  const b = tx.insert("bots", { ...rest, ...changes } as never) as Bot;
  await tx.commit();
  return b;
}

export const demoSet = (): ProviderSet => ({
  discovery: [new DemoDataProvider(() => NOW)],
  contacts: [new DemoContactProvider()],
  verification: [new DemoVerificationProvider()],
  outbound: [new DemoOutboundProvider()],
});

/** A scripted paid provider for router tests. Never touches the network. */
export class FakePaid implements ContactEnrichmentProvider, EmailVerificationProvider, ProspectDataProvider, OutboundProvider {
  readonly paid = true;
  readonly demo = false;
  readonly label: string;
  readonly capabilities = ["people_search", "email_finding", "email_verification", "company_discovery", "outbound"] as const;
  calls = 0;
  fail?: ProviderErrorKind;
  failTimes = Infinity;
  ready = true;
  constructor(readonly key: string, readonly priority = 10) {
    this.label = key;
  }
  status() {
    return this.ready ? ("ready" as const) : ("not_configured" as const);
  }
  private tick() {
    this.calls++;
    if (this.fail && this.calls <= this.failTimes) throw new ProviderError(this.key, this.fail, "scripted failure");
  }
  async discoverCompanies() {
    this.tick();
    return { companies: [], units: 1 };
  }
  async findPeople(c: { name: string; domain?: string }) {
    this.tick();
    return { people: [{ externalId: `${this.key}:${c.domain}`, fullName: "Pat Example", firstName: "Pat", lastName: "Example", title: "Facilities Director", employmentConfidence: 0.9 }], units: 1 };
  }
  async findEmail(_p: unknown, domain: string) {
    this.tick();
    return { email: `pat.example@${domain}`, status: "LIKELY_VALID" as const, confidence: 0.8, units: 1 };
  }
  async verify() {
    this.tick();
    return { status: "VERIFIED" as const, units: 1 };
  }
  async handoff() {
    this.tick();
    return { accepted: true, externalRef: `${this.key}-ref` };
  }
}
