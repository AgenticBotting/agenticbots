import "server-only";
import type { BuyerType, Company, CompanyPerson, ContactPoint, Person, ProspectingJob, Provenance, Signal } from "@/lib/prospecting/types";
import type { ProspectGraphStore } from "./store";
import { BudgetBlocked, budgetsFor, checkSpend, recordCost, type SpendContext } from "./costs";
import { configuredPricing, providers as defaultProviderSet, type Pricing } from "./providers/registry";
import { ProviderError, type AnyProvider, type DiscoveryPage, type DiscoveryQuery, type ProspectDataProvider, type ProviderCapability, type ProviderSet } from "./providers/types";
import { ingestPeople } from "./companies";
import { activeSignals, ingestSignals } from "./signals";
import { applyPattern, defaultResolver, getDomainMailIntelligence, isRoleAddress, isValidEmailSyntax, type MxResolver } from "./email";
import { expiresAt, isFresh } from "./freshness";
import { titleMatch } from "./ontology/titles";
import { stableId } from "./ontology/normalize";
import type { RoleFamily } from "@/lib/prospecting/types";

/**
 * EnrichmentRouter — the ONLY place provider calls are made.
 *
 * For every request it walks, in order:
 *   1. cache          a fresh fact already in the graph → return it, $0
 *   2. internal       free intelligence (email patterns, DNS)    → $0
 *   3. value gate     paid calls only for prospects worth it (fit ≥ minFit)
 *   4. providers      by priority within the capability; skipped when not
 *                     ready or not priced; budget-checked before each paid
 *                     call; retried on transient errors; falls back on failure
 * and writes a CostEvent for every provider call.
 *
 * It returns normalized results plus a `trace` the operator console shows.
 * Callers never see provider credentials or raw responses.
 */
export interface Gate {
  fit: number;
  minFit: number;
}

export interface TraceStep {
  step: "cache" | "internal" | "gated" | "skipped" | "called" | "failed" | "blocked";
  provider?: string;
  detail: string;
}

export interface RouterOptions {
  store: ProspectGraphStore;
  now: Date;
  spend: SpendContext;
  /** Mutable run counters — the job runner persists them. */
  job?: Pick<ProspectingJob, "limits" | "paidCalls" | "spendUsd">;
  providers?: ProviderSet;
  pricing?: Pricing;
  resolver?: MxResolver;
}

export class EnrichmentRouter {
  readonly trace: TraceStep[] = [];
  private readonly set: ProviderSet;
  private readonly pricing: Pricing;
  private readonly resolver: MxResolver;
  constructor(private readonly o: RouterOptions) {
    this.set = o.providers ?? defaultProviderSet();
    this.pricing = o.pricing ?? configuredPricing();
    this.resolver = o.resolver ?? defaultResolver();
  }

  /** Attribute subsequent costs to this prospect. */
  setProspect(prospectId: string | undefined): void {
    this.o.spend.prospectId = prospectId;
  }

  private log(s: TraceStep) {
    this.trace.push(s);
  }

  private provenance(p: AnyProvider, confidence: number): Provenance {
    const now = this.o.now.toISOString();
    return { provider: p.key, observedAt: now, fetchedAt: now, confidence, demo: p.demo };
  }

  /** Run one capability across providers with cache-miss semantics. */
  private async attempt<P extends AnyProvider, T>(
    cap: ProviderCapability,
    list: P[],
    op: "discovery" | "enrichment" | "verification" | "research",
    run: (p: P) => Promise<T & { units: number }>,
    gate?: Gate,
  ): Promise<{ provider: P; value: T & { units: number } } | null> {
    const candidates = [...list].filter((p) => p.capabilities.includes(cap)).sort((a, b) => a.priority - b.priority);
    const retries = (await budgetsFor(this.o.store, this.o.spend, "")).client?.maxProviderRetries ?? 1;
    for (const p of candidates) {
      const status = p.status();
      if (status !== "ready") {
        this.log({ step: "skipped", provider: p.key, detail: `${cap}: ${status.replace("_", " ")}` });
        continue;
      }
      const price = p.paid ? this.pricing[p.key]?.[cap] : 0;
      if (price === undefined) {
        this.log({ step: "skipped", provider: p.key, detail: `${cap}: no configured price — paid calls stay off` });
        continue;
      }
      if (p.paid && gate && gate.fit < gate.minFit) {
        this.log({ step: "gated", provider: p.key, detail: `${cap}: fit ${gate.fit} is below ${gate.minFit}; not worth a paid call` });
        continue;
      }
      // Throws BudgetBlocked — the caller stops; a budget is never "fallen through".
      await checkSpend(this.o.store, this.o.now, this.o.spend, p.key, price, this.o.job);
      for (let tryNo = 0; ; tryNo++) {
        try {
          const value = await run(p);
          const units = p.paid ? Math.max(1, value.units) : value.units;
          await this.cost(p, op, units, price, true);
          this.log({ step: "called", provider: p.key, detail: `${cap}: ok${price ? ` ($${(units * price).toFixed(4)})` : " ($0)"}` });
          return { provider: p, value };
        } catch (e) {
          if (e instanceof BudgetBlocked) throw e;
          const pe = e instanceof ProviderError ? e : new ProviderError(p.key, "bad_response", "Unexpected provider error.");
          if (pe.retryable && tryNo < retries) continue;
          await this.cost(p, op, 0, price, false);
          this.log({ step: "failed", provider: p.key, detail: `${cap}: ${pe.kind.replace("_", " ")}` });
          if (!pe.fallthrough) return null;
          break;
        }
      }
    }
    return null;
  }

  private async cost(p: AnyProvider, op: "discovery" | "enrichment" | "verification" | "research", units: number, unitCostUsd: number, success: boolean) {
    const tx = this.o.store.tx();
    const ev = recordCost(tx, {
      orgId: this.o.spend.orgId, marketId: this.o.spend.marketId, jobId: this.o.spend.jobId, prospectId: this.o.spend.prospectId,
      provider: p.key, operation: op, units, unitCostUsd, pricingSource: p.paid ? "configured" : "free", success, demo: p.demo,
    });
    await tx.commit();
    if (this.o.job && ev.costUsd > 0) {
      this.o.job.paidCalls += 1;
      this.o.job.spendUsd = Math.round((this.o.job.spendUsd + ev.costUsd) * 10000) / 10000;
    }
  }

  /* ── discoverCompanies ── */

  /**
   * One page of discovery. Exhausted sources are skipped; each source
   * keeps its own cursor so a later run continues where it stopped.
   */
  async discoverCompanies(q: Omit<DiscoveryQuery, "cursor">, state: { cursorFor(provider: string): string | undefined; exhausted(provider: string): boolean }): Promise<{ provider: ProspectDataProvider; page: DiscoveryPage } | null> {
    const list = this.set.discovery.filter((p) => !state.exhausted(p.key));
    const hit = await this.attempt("company_discovery", list, "discovery", (p) => p.discoverCompanies({ ...q, cursor: state.cursorFor(p.key) }));
    return hit ? { provider: hit.provider, page: hit.value } : null;
  }

  /** Providers that could serve discovery right now (for exhaustion reporting). */
  readyDiscoveryProviders(): string[] {
    return this.set.discovery.filter((p) => p.status() === "ready").map((p) => p.key);
  }

  /* ── researchCompany ── */

  async researchCompany(company: Company, buyer?: BuyerType): Promise<{ signals: Signal[]; source: "cache" | "provider" | "none" }> {
    const store = this.o.store;
    if (isFresh("research", company.lastResearchedAt, this.o.now)) {
      this.log({ step: "cache", detail: "research: fresh" });
      return { signals: await activeSignals(store, company.id, this.o.now), source: "cache" };
    }
    const hit = await this.attempt("company_research", this.set.discovery.filter((p) => !!p.researchCompany), "research", (p) =>
      p.researchCompany!({ name: company.canonicalName, domain: company.domain, city: company.locations[0]?.city, state: company.locations[0]?.state, buyerTags: buyer?.tags }),
    );
    if (!hit) return { signals: await activeSignals(store, company.id, this.o.now), source: "none" };
    const tx = store.tx();
    const existing = await store.list("pg_signals", { where: { companyId: company.id } });
    const base = this.provenance(hit.provider, 0.8);
    ingestSignals(tx, existing, company.id, hit.value.signals, { provider: base.provider, fetchedAt: base.fetchedAt, demo: base.demo });
    const fresh = (await store.get("pg_companies", company.id)) ?? company;
    tx.patch("pg_companies", fresh, { lastResearchedAt: this.o.now.toISOString() });
    await tx.commit();
    return { signals: await activeSignals(store, company.id, this.o.now), source: "provider" };
  }

  /* ── findDecisionMakers ── */

  async findDecisionMakers(company: Company, wanted: { titles: string[]; families: RoleFamily[] }, gate: Gate, limit = 3): Promise<{ people: { person: Person; role: CompanyPerson; match: number }[]; source: "cache" | "provider" | "none" }> {
    const store = this.o.store;
    const roles = await store.list("pg_company_people", { where: { companyId: company.id } });
    const fresh = roles.filter((r) => isFresh("people", r.provenance.fetchedAt, this.o.now));
    const ranked = async (rs: CompanyPerson[]) => {
      const out: { person: Person; role: CompanyPerson; match: number }[] = [];
      for (const role of rs) {
        const person = await store.get("pg_people", role.personId);
        const match = titleMatch(role.title, wanted.families);
        if (person && match > 0) out.push({ person, role, match });
      }
      return out.sort((a, b) => b.match - a.match || b.role.employmentConfidence - a.role.employmentConfidence).slice(0, limit);
    };
    const cached = await ranked(fresh);
    if (cached.length > 0) {
      this.log({ step: "cache", detail: `decision makers: ${cached.length} fresh` });
      return { people: cached, source: "cache" };
    }
    const hit = await this.attempt("people_search", this.set.contacts, "enrichment", (p) =>
      p.findPeople({ name: company.canonicalName, domain: company.domain, city: company.locations[0]?.city, state: company.locations[0]?.state }, wanted.titles, limit), gate);
    if (!hit) return { people: [], source: "none" };
    const tx = store.tx();
    const rows = await ingestPeople(store, tx, company.id, hit.value.people, this.provenance(hit.provider, 0.75));
    await tx.commit();
    return { people: await ranked(rows.map((r) => r.role)), source: "provider" };
  }

  /* ── resolveWorkEmail ── */

  async resolveWorkEmail(person: Person, company: Company, gate: Gate): Promise<{ contact?: ContactPoint; source: "cache" | "internal" | "provider" | "none"; reason?: string }> {
    const store = this.o.store;
    const id = stableId(`email_${company.id}_${person.id}`);
    const prior = await store.get("pg_contact_points", id);
    if (prior && prior.status !== "INVALID" && isFresh("email_found", prior.provenance.fetchedAt, this.o.now)) {
      this.log({ step: "cache", detail: `email: ${prior.status}` });
      return { contact: prior, source: "cache" };
    }
    if (!company.domain) return { source: "none", reason: "Company has no known domain." };
    const intel = await getDomainMailIntelligence(store, company.domain, this.o.now, this.resolver);
    if (intel.hasMx === false) {
      this.log({ step: "internal", detail: "email: domain has no mail server" });
      return { source: "none", reason: "The company domain does not receive email." };
    }
    const save = async (value: string, status: ContactPoint["status"], confidence: number, method: ContactPoint["method"], prov: Provenance) => {
      const tx = store.tx();
      const doc = { personId: person.id, companyId: company.id, kind: "work_email" as const, value: value.toLowerCase(), status, confidence, method, provenance: { ...prov, expiresAt: expiresAt("email_found", this.o.now) } };
      const row = prior ? tx.patch("pg_contact_points", prior, doc) : tx.insert("pg_contact_points", { ...doc, id });
      await tx.commit();
      return row;
    };
    if (intel.pattern && (intel.patternConfidence ?? 0) >= 0.7 && person.firstName && person.lastName) {
      const guess = applyPattern(intel.pattern, person.firstName, person.lastName, company.domain);
      if (guess) {
        this.log({ step: "internal", detail: `email: built from known pattern ${intel.pattern}` });
        const now = this.o.now.toISOString();
        return { contact: await save(guess, "LIKELY_VALID", intel.patternConfidence ?? 0.7, "pattern", { provider: "native", observedAt: now, fetchedAt: now, confidence: intel.patternConfidence ?? 0.7, demo: person.demo }), source: "internal" };
      }
    }
    const hit = await this.attempt("email_finding", this.set.contacts, "enrichment", (p) => p.findEmail(person, company.domain!), gate);
    if (!hit || !hit.value.email || !isValidEmailSyntax(hit.value.email)) return { source: "none", reason: "No provider returned a usable address." };
    return { contact: await save(hit.value.email, hit.value.status, hit.value.confidence, "provider", this.provenance(hit.provider, hit.value.confidence)), source: "provider" };
  }

  /* ── verifyContact ── */

  async verifyContact(cp: ContactPoint, gate: Gate): Promise<{ contact: ContactPoint; source: "cache" | "internal" | "provider" | "none" }> {
    const store = this.o.store;
    if (cp.verifiedAt && isFresh("email_verified", cp.verifiedAt, this.o.now)) {
      this.log({ step: "cache", detail: `verify: ${cp.status}` });
      return { contact: cp, source: "cache" };
    }
    const patchWith = async (changes: Partial<ContactPoint>) => {
      const cur = (await store.get("pg_contact_points", cp.id)) ?? cp;
      const tx = store.tx();
      const row = tx.patch("pg_contact_points", cur, changes);
      await tx.commit();
      return row;
    };
    if (!isValidEmailSyntax(cp.value)) {
      this.log({ step: "internal", detail: "verify: invalid syntax" });
      return { contact: await patchWith({ status: "INVALID", verifiedAt: this.o.now.toISOString() }), source: "internal" };
    }
    if (isRoleAddress(cp.value)) {
      this.log({ step: "internal", detail: "verify: role address" });
      return { contact: await patchWith({ status: "RISKY" }), source: "internal" };
    }
    const hit = await this.attempt("email_verification", this.set.verification, "verification", (p) => p.verify(cp.value), gate);
    if (!hit) return { contact: cp, source: "none" };
    const contact = await patchWith({ status: hit.value.status, verifiedAt: this.o.now.toISOString(), confidence: hit.value.status === "VERIFIED" ? 0.95 : cp.confidence });
    if (hit.value.catchAll) {
      const domain = cp.value.split("@")[1];
      const intel = await store.get("pg_domain_intel", stableId(`dmi_${domain}`));
      if (intel) {
        const tx = store.tx();
        tx.patch("pg_domain_intel", intel, { catchAll: true });
        await tx.commit();
      }
    }
    return { contact, source: "provider" };
  }
}
