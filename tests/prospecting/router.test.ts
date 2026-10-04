import { describe, expect, it, vi } from "vitest";
import { prospectWorld, acmeMarket, demoSet, FakePaid, NOW } from "./helpers";
import { EnrichmentRouter } from "@/server/prospecting/router";
import { BudgetBlocked, setBudget } from "@/server/prospecting/costs";
import { enqueueJob, runJob, approveJobSpend } from "@/server/prospecting/jobs";
import { defaultProviders, providerCatalog } from "@/server/prospecting/providers/registry";
import { DemoDataProvider } from "@/server/prospecting/providers/demo";
import { getDomainMailIntelligence, inferPattern, applyPattern, isValidEmailSyntax, demoResolver } from "@/server/prospecting/email";
import type { Company, ProspectingJob } from "@/lib/prospecting/types";
import type { ProviderSet } from "@/server/prospecting/providers/types";

const DAY = 86_400_000;

async function seedCompany(pw: Awaited<ReturnType<typeof prospectWorld>>, domain = "harbor-test.com"): Promise<Company> {
  const tx = pw.ops.store.tx();
  const c = tx.insert("pg_companies", { canonicalName: "Harbor Test Co", normalizedName: "harbor test co", domain, locations: [{ city: "Fort Lauderdale", county: "Broward County", state: "FL" }], buyerTypeIds: [], aliases: [], identityConfidence: 0.9, firstSeenAt: NOW.toISOString(), lastSeenAt: NOW.toISOString(), demo: false });
  await tx.commit();
  return c;
}

const paidSet = (...ps: FakePaid[]): ProviderSet => ({ discovery: [], contacts: ps, verification: ps, outbound: [] });
const job = (calls = 10, usd = 10): Pick<ProspectingJob, "limits" | "paidCalls" | "spendUsd"> => ({ limits: { maxPaidCalls: calls, maxCompanies: 10, maxSpendUsd: usd }, paidCalls: 0, spendUsd: 0 });
const wanted = { titles: ["Facilities Director"], families: ["facilities" as const] };
const gate = { fit: 80, minFit: 35 };

describe("EnrichmentRouter — cost, cache, fallback", () => {
  it("never calls a paid provider without configured pricing (fail closed)", async () => {
    const pw = await prospectWorld();
    const c = await seedCompany(pw);
    const p = new FakePaid("vendor-a");
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing: {} });
    const res = await r.findDecisionMakers(c, wanted, gate);
    expect(res.people).toHaveLength(0);
    expect(p.calls).toBe(0);
    expect(r.trace.some((t) => t.step === "skipped" && /no configured price/.test(t.detail))).toBe(true);
  });

  it("blocks paid calls when the client has no budget", async () => {
    const pw = await prospectWorld();
    const c = await seedCompany(pw);
    const p = new FakePaid("vendor-a");
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing: { "vendor-a": { people_search: 0.1 } } });
    await expect(r.findDecisionMakers(c, wanted, gate)).rejects.toBeInstanceOf(BudgetBlocked);
    expect(p.calls).toBe(0);
  });

  it("charges configured prices, records cost events, and serves the second request from cache", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 5 });
    const c = await seedCompany(pw);
    const p = new FakePaid("vendor-a");
    const counters = job();
    const opts = { store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing: { "vendor-a": { people_search: 0.1 } }, job: counters };
    const first = await new EnrichmentRouter(opts).findDecisionMakers(c, wanted, gate);
    expect(first.source).toBe("provider");
    expect(first.people[0].role.roleFamily).toBe("facilities");
    expect(counters).toMatchObject({ paidCalls: 1, spendUsd: 0.1 });
    const events = await pw.ops.store.list("pg_cost_events");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ provider: "vendor-a", costUsd: 0.1, pricingSource: "configured", success: true, orgId: pw.acme.id });
    const second = await new EnrichmentRouter(opts).findDecisionMakers(c, wanted, gate);
    expect(second.source).toBe("cache");
    expect(p.calls).toBe(1);
    // Stale after the TTL: refreshed (paid again).
    const later = await new EnrichmentRouter({ ...opts, now: new Date(NOW.getTime() + 61 * DAY) }).findDecisionMakers(c, wanted, gate);
    expect(later.source).toBe("provider");
    expect(p.calls).toBe(2);
  });

  it("value-gates paid calls for low-fit prospects", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 5 });
    const c = await seedCompany(pw);
    const p = new FakePaid("vendor-a");
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing: { "vendor-a": { people_search: 0.1 } } });
    await r.findDecisionMakers(c, wanted, { fit: 10, minFit: 35 });
    expect(p.calls).toBe(0);
    expect(r.trace.some((t) => t.step === "gated")).toBe(true);
  });

  it("enforces monthly and run limits", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 0.15 });
    const p = new FakePaid("vendor-a");
    const pricing = { "vendor-a": { people_search: 0.1 } };
    const c1 = await seedCompany(pw, "one.com");
    const c2 = await seedCompany(pw, "two.com");
    await new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing }).findDecisionMakers(c1, wanted, gate);
    await expect(new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing }).findDecisionMakers(c2, wanted, gate)).rejects.toMatchObject({ scope: "client" });
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 100 });
    await expect(new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing, job: job(0, 10) }).findDecisionMakers(c2, wanted, gate)).rejects.toMatchObject({ scope: "run", onLimit: "approval" });
  });

  it("falls back to the next provider on failure and records the failure", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 5, maxProviderRetries: 0 });
    const c = await seedCompany(pw);
    const bad = new FakePaid("vendor-a", 1);
    bad.fail = "auth_failed"; // invalid credentials
    const down = new FakePaid("vendor-b", 2);
    down.fail = "unavailable";
    const good = new FakePaid("vendor-c", 3);
    const pricing = { "vendor-a": { people_search: 0.1 }, "vendor-b": { people_search: 0.1 }, "vendor-c": { people_search: 0.2 } };
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(bad, down, good), pricing });
    const res = await r.findDecisionMakers(c, wanted, gate);
    expect(res.people).toHaveLength(1);
    expect([bad.calls, down.calls, good.calls]).toEqual([1, 1, 1]);
    const ev = await pw.ops.store.list("pg_cost_events", { order: "asc" });
    expect(ev.map((e) => [e.provider, e.success, e.costUsd])).toEqual([["vendor-a", false, 0], ["vendor-b", false, 0], ["vendor-c", true, 0.2]]);
  });

  it("retries transient errors within the budget's retry allowance", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 5, maxProviderRetries: 1 });
    const c = await seedCompany(pw);
    const flaky = new FakePaid("vendor-a");
    flaky.fail = "rate_limited";
    flaky.failTimes = 1;
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(flaky), pricing: { "vendor-a": { people_search: 0.1 } } });
    expect((await r.findDecisionMakers(c, wanted, gate)).people).toHaveLength(1);
    expect(flaky.calls).toBe(2);
  });

  it("third-party adapters are stubs: not configured, no network, never called", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const set = defaultProviders();
    const vendors = providerCatalog(set, {}).filter((p) => !p.demo);
    expect(vendors.map((v) => v.key).sort()).toEqual(["hunter", "leadmagic", "lemlist", "prospeo", "rocketreach"]);
    for (const v of vendors) expect(v.status).toBe("not_configured");
    const pw = await prospectWorld();
    const c = await seedCompany(pw);
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: set, pricing: {} });
    await r.findDecisionMakers(c, wanted, gate);
    expect(fetchSpy).not.toHaveBeenCalled();
    // With a credential present the stub still refuses (not implemented), and still makes no call.
    process.env.HUNTER_API_KEY = "test-only";
    try {
      const hunter = defaultProviders().verification.find((p) => p.key === "hunter")!;
      expect(hunter.status()).toBe("not_implemented");
      await expect(hunter.verify("a@b.com")).rejects.toMatchObject({ kind: "not_implemented" });
    } finally {
      delete process.env.HUNTER_API_KEY;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("email intelligence", () => {
  it("validates syntax, infers and applies patterns", () => {
    expect(isValidEmailSyntax("pat.example@acme.com")).toBe(true);
    expect(isValidEmailSyntax("not an email")).toBe(false);
    expect(applyPattern("{f}{last}", "Pat", "O'Neil", "x.com")).toBe("poneil@x.com");
    const p = inferPattern([
      { first: "Ann", last: "Lee", email: "ann.lee@x.com" },
      { first: "Bo", last: "Diaz", email: "bo.diaz@x.com" },
      { first: "Cy", last: "Fox", email: "cfox@x.com" },
    ]);
    expect(p?.pattern).toBe("{first}.{last}");
    expect(p!.confidence).toBeGreaterThan(0.4);
  });

  it("uses a learned domain pattern before any provider (free)", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 5 });
    const c = await seedCompany(pw, "pattern.example");
    const tx = pw.ops.store.tx();
    for (const [f, l] of [["Ann", "Lee"], ["Bo", "Diaz"], ["Cy", "Fox"]]) {
      const per = tx.insert("pg_people", { fullName: `${f} ${l}`, firstName: f, lastName: l, demo: false });
      tx.insert("pg_contact_points", { personId: per.id, companyId: c.id, kind: "work_email", value: `${f}.${l}@pattern.example`.toLowerCase(), status: "VERIFIED", confidence: 0.95, method: "provider", provenance: { provider: "t", observedAt: "", fetchedAt: NOW.toISOString(), confidence: 1, demo: false } });
    }
    const target = tx.insert("pg_people", { fullName: "Dee Park", firstName: "Dee", lastName: "Park", demo: false });
    await tx.commit();
    const intel = await getDomainMailIntelligence(pw.ops.store, "pattern.example", NOW, demoResolver);
    expect(intel).toMatchObject({ hasMx: true, pattern: "{first}.{last}" });
    const p = new FakePaid("vendor-a");
    const r = new EnrichmentRouter({ store: pw.ops.store, now: NOW, spend: { orgId: pw.acme.id }, providers: paidSet(p), pricing: { "vendor-a": { email_finding: 0.1 } }, resolver: demoResolver });
    const res = await r.resolveWorkEmail(target, c, gate);
    expect(res).toMatchObject({ source: "internal", contact: { value: "dee.park@pattern.example", status: "LIKELY_VALID", method: "pattern" } });
    expect(p.calls).toBe(0);
  });
});

describe("jobs", () => {
  it("discovery runs end to end with the demo provider at $0 and is reproducible", async () => {
    const pw = await prospectWorld();
    const m = await acmeMarket(pw);
    const j = await enqueueJob(pw.ops, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id });
    const done = await runJob(pw.r, j.id, { now: NOW, providers: demoSet() });
    expect(done.status).toBe("completed");
    expect(Number(done.result?.created)).toBeGreaterThan(0);
    expect(done.spendUsd).toBe(0);
    const companies = await pw.ops.store.list("pg_companies");
    expect(companies.every((c) => c.demo && c.canonicalName.startsWith("[Demo]") && c.domain?.endsWith(".example"))).toBe(true);
    const sources = await pw.ops.store.list("pg_company_sources");
    expect(sources.length).toBe(companies.length);
    expect(sources.every((s) => s.provenance.provider === "demo" && s.provenance.demo)).toBe(true);
    const prospects = await pw.ops.store.list("pg_prospects");
    expect(prospects.every((p) => p.score && p.score.version)).toBe(true);
    // The same query yields the same companies.
    const page = await new DemoDataProvider(() => NOW).discoverCompanies({ nicheTags: [], buyerType: { id: "x", key: "buyer_k", name: "Apartments", tags: [], segmentKey: "s" }, geography: { kind: "county", name: "X", state: "FL" }, limit: 5 });
    const again = await new DemoDataProvider(() => NOW).discoverCompanies({ nicheTags: [], buyerType: { id: "x", key: "buyer_k", name: "Apartments", tags: [], segmentKey: "s" }, geography: { kind: "county", name: "X", state: "FL" }, limit: 5 });
    expect(again).toEqual(page);
    // Rerunning discovery continues from cursors; no duplicate companies.
    const j2 = await enqueueJob(pw.ops, pw.acme.id, "REFRESH_MARKET", { marketId: m.id });
    await runJob(pw.r, j2.id, { now: NOW, providers: demoSet() });
    const all = await pw.ops.store.list("pg_companies");
    expect(new Set(all.map((c) => c.domain)).size).toBe(all.length);
  });

  it("pauses at a budget limit, needs a person to approve, then continues", async () => {
    const pw = await prospectWorld();
    await setBudget(pw.ops, { scope: "client", orgId: pw.acme.id, monthlyLimitUsd: 10, maxPaidCallsPerRun: 0 });
    const m = await acmeMarket(pw);
    const p = new FakePaid("vendor-a");
    const set: ProviderSet = { ...demoSet(), contacts: [p] };
    const pricing = { "vendor-a": { people_search: 0.1, email_finding: 0.1 } };
    const j = await enqueueJob(pw.ops, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id, limits: { maxCompanies: 3 } });
    const paused = await runJob(pw.r, j.id, { now: NOW, providers: set, pricing });
    expect(paused.status).toBe("paused");
    expect(paused.pausedReason).toMatch(/paid calls/);
    expect(p.calls).toBe(0);
    // A Bot cannot approve spend.
    const bot = pw.ctx({ kind: "bot", botId: pw.acmeBot.id, orgId: pw.acme.id, name: "Prospecting Bot" });
    await expect(approveJobSpend(bot, j.id, { usd: 1, calls: 10 })).rejects.toThrow();
    const approved = await approveJobSpend(pw.ops, j.id, { usd: 1, calls: 10 });
    expect(approved.status).toBe("queued");
    const done = await runJob(pw.r, j.id, { now: NOW, providers: set, pricing });
    expect(done.status).toBe("completed");
    expect(done.paidCalls).toBeGreaterThan(0);
    expect(done.spendUsd).toBeLessThanOrEqual(done.limits.maxSpendUsd);
  });

  it("cancels and refuses duplicate active jobs", async () => {
    const pw = await prospectWorld();
    const m = await acmeMarket(pw);
    const j = await enqueueJob(pw.ops, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id });
    await expect(enqueueJob(pw.ops, pw.acme.id, "DISCOVER_MARKET", { marketId: m.id })).rejects.toThrow(/already/);
    const { cancelJob } = await import("@/server/prospecting/jobs");
    await cancelJob(pw.ops, j.id);
    expect((await runJob(pw.r, j.id, { now: NOW, providers: demoSet() })).status).toBe("cancelled");
  });
});
