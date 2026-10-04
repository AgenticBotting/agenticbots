import "server-only";
import type { BuyerType, Company, JobKind, Market, MarketBuild, MarketSourceState, Prospect, ProspectingJob } from "@/lib/prospecting/types";
import type { Repository } from "@/server/db/repository";
import { assertExecutable, audit } from "@/server/services/common";
import { correlationId } from "@/server/ids";
import { conflict, invalid, notFound } from "@/server/errors";
import { graphOf, type ProspectGraphStore } from "./store";
import { allowed, assertAllowed, getPrivate, principalRef, type Ctx } from "./access";
import { BudgetBlocked, runLimitsFor } from "./costs";
import { EnrichmentRouter, type Gate } from "./router";
import { ingestCompany } from "./companies";
import { policyForProvider } from "./data-policy";
import { autoQualify, loadScoreInput, prospectId, rescore } from "./prospects";
import { scoreProspect } from "./scoring";
import { sendToOutbound } from "./outbound";
import type { ProviderSet } from "./providers/types";
import type { Pricing } from "./providers/registry";
import type { MxResolver } from "./email";
import { roleFamiliesForNiche } from "./ontology/relationships";
import { stableId } from "./ontology/normalize";

/**
 * Deterministic workers.
 *
 * Jobs do the mechanical work — discovery, identity resolution, enrichment
 * through the router, scoring, rule-based qualification — with no model in
 * the loop. Bots and operators ENQUEUE jobs; they never run providers
 * directly. Status: queued → running → completed | failed | cancelled |
 * paused (a budget needs an operator's approval).
 */
export interface RunOptions {
  now?: Date;
  providers?: ProviderSet;
  pricing?: Pricing;
  resolver?: MxResolver;
}

/** Only prospects whose pre-contact fit clears this get paid enrichment. */
export const ENRICH_PRELIM_MIN = 35;

const ACTIVE_BUILD: MarketBuild["status"][] = ["draft", "planned", "approval_required", "discovering", "qualifying", "enriching", "refreshing", "paused"];

async function ensureMarketBuild(ctx: Ctx, orgId: string, market: Market, kind: JobKind, maxBudgetUsd: number): Promise<MarketBuild> {
  const existing = (await ctx.store.list("pg_market_builds", { orgId })).find((b) => b.marketId === market.id && ACTIVE_BUILD.includes(b.status));
  if (existing) return existing;
  const tx = ctx.store.tx();
  const build = tx.insert("pg_market_builds", {
    orgId,
    marketId: market.id,
    icpId: market.icpId,
    nicheId: market.nicheId,
    geography: market.geography,
    buyerTypeIds: market.buyerTypeIds,
    discoveryStrategy: market.discovery.map((s) => s.provider),
    maxDataAcquisitionBudgetUsd: maxBudgetUsd,
    companyDiscoveryCount: 0,
    companyResearchCount: 0,
    qualifiedCompanyCount: 0,
    decisionMakersRequested: 0,
    decisionMakersFound: 0,
    contactsVerified: 0,
    providerSpendUsd: 0,
    coverageMethodology: market.universeEstimate?.methodology ?? "Observed provider/source coverage only; no invented TAM.",
    status: kind === "REFRESH_MARKET" ? "refreshing" : "planned",
    createdBy: principalRef(ctx.p).name,
  });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.market_build.create", orgId, targetType: "market_build", targetId: build.id, correlationId: correlationId(), detail: market.name });
  await tx.commit();
  return build;
}

export async function enqueueJob(
  ctx: Ctx,
  orgId: string,
  kind: JobKind,
  args: { marketId?: string; prospectId?: string; params?: ProspectingJob["params"]; limits?: Partial<ProspectingJob["limits"]> } = {},
): Promise<ProspectingJob> {
  assertAllowed(ctx.p, "write_private", orgId);
  const org = await ctx.r.get("organizations", orgId);
  if (!org) throw notFound("Client");
  assertExecutable(org);
  let market: Market | undefined;
  if (args.marketId) {
    market = await getPrivate(ctx.store, "pg_markets", args.marketId, ctx.p, "write_private");
    if (market.orgId !== orgId) throw notFound();
    if (market.status !== "active") throw invalid("This market is not active.");
  }
  if (args.prospectId) {
    const p = await getPrivate(ctx.store, "pg_prospects", args.prospectId, ctx.p, "write_private");
    if (p.orgId !== orgId) throw notFound();
  }
  if ((kind === "DISCOVER_MARKET" || kind === "REFRESH_MARKET" || kind === "RESCORE_PROSPECTS" || kind === "EXPORT_TO_OUTBOUND") && !args.marketId) throw invalid("This job needs a market.");
  // One active job per market and kind — no stampedes.
  const active = (await ctx.store.list("pg_jobs", { orgId })).find((j) => j.kind === kind && j.marketId === args.marketId && j.prospectId === args.prospectId && (j.status === "queued" || j.status === "running" || j.status === "paused"));
  if (active) throw conflict("That job is already queued or running.");
  // A Bot can lower limits, never raise them above the budget.
  const limits = await runLimitsFor(ctx.store, orgId, args.marketId, args.limits);
  const build = market && (kind === "DISCOVER_MARKET" || kind === "REFRESH_MARKET")
    ? await ensureMarketBuild(ctx, orgId, market, kind, limits.maxSpendUsd)
    : undefined;
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const job = tx.insert("pg_jobs", {
    orgId, kind, marketId: args.marketId, prospectId: args.prospectId, status: "queued", progress: { done: 0, total: 0 },
    params: { ...(args.params ?? {}), ...(build ? { marketBuildId: build.id } : {}) }, requestedBy: who.name, limits, paidCalls: 0, spendUsd: 0,
  });
  audit(tx.audit, who, { action: "prospecting.job.enqueue", orgId, targetType: "prospecting_job", targetId: job.id, correlationId: correlationId(), detail: kind });
  await tx.commit();
  return job;
}

export async function cancelJob(ctx: Ctx, jobId: string): Promise<ProspectingJob> {
  const j = await getPrivate(ctx.store, "pg_jobs", jobId, ctx.p, "write_private");
  if (!["queued", "running", "paused"].includes(j.status)) return j;
  const tx = ctx.store.tx();
  const next = tx.patch("pg_jobs", j, { status: "cancelled", finishedAt: ctx.now.toISOString() });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.job.cancel", orgId: j.orgId, targetType: "prospecting_job", targetId: j.id, correlationId: correlationId() });
  await tx.commit();
  return next;
}

/** Operator approval for a job a budget paused: raise its run limits and re-queue. */
export async function approveJobSpend(ctx: Ctx, jobId: string, extra: { usd: number; calls: number }): Promise<ProspectingJob> {
  const j = await getPrivate(ctx.store, "pg_jobs", jobId, ctx.p, "read_private");
  assertAllowed(ctx.p, "spend", j.orgId);
  if (ctx.p.kind === "bot") throw invalid("Only a person can approve spend.");
  if (j.status !== "paused") throw invalid("Only a paused job can be approved.");
  if (!(extra.usd >= 0 && extra.usd <= 1000) || !(extra.calls >= 0 && extra.calls <= 5000)) throw invalid("Approve between $0–$1,000 and 0–5,000 calls.");
  const tx = ctx.store.tx();
  const next = tx.patch("pg_jobs", j, {
    status: "queued",
    pausedReason: undefined,
    limits: { ...j.limits, maxSpendUsd: Math.round((j.limits.maxSpendUsd + extra.usd) * 100) / 100, maxPaidCalls: j.limits.maxPaidCalls + Math.round(extra.calls) },
  });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.job.approve_spend", orgId: j.orgId, targetType: "prospecting_job", targetId: j.id, correlationId: correlationId(), detail: `+$${extra.usd} / +${extra.calls} calls` });
  await tx.commit();
  return next;
}

/* ───────────── Runner ───────────── */

async function save(store: ProspectGraphStore, jobId: string, changes: Partial<ProspectingJob>): Promise<ProspectingJob> {
  const cur = await store.get("pg_jobs", jobId);
  if (!cur) throw notFound("Job");
  const tx = store.tx();
  const next = tx.patch("pg_jobs", cur, changes);
  await tx.commit();
  return next;
}

async function cancelled(store: ProspectGraphStore, jobId: string): Promise<boolean> {
  return (await store.get("pg_jobs", jobId))?.status === "cancelled";
}

/** Run every queued job (oldest first), up to `max`. */
export async function runQueuedJobs(r: Repository, max = 5, opts: RunOptions = {}): Promise<ProspectingJob[]> {
  const store = graphOf(r);
  const queued = (await store.list("pg_jobs", { where: { status: "queued" }, order: "asc" })).slice(0, max);
  const out: ProspectingJob[] = [];
  for (const j of queued) out.push(await runJob(r, j.id, opts));
  return out;
}

export async function runJob(r: Repository, jobId: string, opts: RunOptions = {}): Promise<ProspectingJob> {
  const store = graphOf(r);
  const now = opts.now ?? new Date();
  let job = await store.get("pg_jobs", jobId);
  if (!job) throw notFound("Job");
  if (job.status !== "queued") return job;
  const org = await r.get("organizations", job.orgId);
  if (!org || org.status === "suspended" || org.status === "canceled") {
    return save(store, jobId, { status: "failed", error: "Client is not active.", finishedAt: now.toISOString() });
  }
  job = await save(store, jobId, { status: "running", startedAt: job.startedAt ?? now.toISOString(), error: undefined });
  const counters = { limits: job.limits, paidCalls: job.paidCalls, spendUsd: job.spendUsd };
  const marketBuildId = typeof job.params.marketBuildId === "string" ? job.params.marketBuildId : undefined;
  if (marketBuildId) await patchMarketBuild(store, marketBuildId, { status: job.kind === "REFRESH_MARKET" ? "refreshing" : "discovering", startedAt: job.startedAt ?? now.toISOString() });
  const router = new EnrichmentRouter({ store, now, spend: { orgId: job.orgId, marketBuildId, marketId: job.marketId, jobId: job.id, prospectId: job.prospectId }, job: counters, providers: opts.providers, pricing: opts.pricing, resolver: opts.resolver });
  const persistCounters = () => ({ paidCalls: counters.paidCalls, spendUsd: counters.spendUsd });

  try {
    let result: ProspectingJob["result"] = {};
    switch (job.kind) {
      case "DISCOVER_MARKET":
      case "REFRESH_MARKET":
        result = await discoverMarket(store, job, router, now);
        break;
      case "RESCORE_PROSPECTS":
        result = await rescoreMarket(store, job, now);
        break;
      case "RESEARCH_COMPANY":
      case "FIND_DECISION_MAKERS":
      case "ENRICH_CONTACT":
      case "VERIFY_CONTACT": {
        if (!job.prospectId) throw invalid("This job needs a prospect.");
        const p = await store.get("pg_prospects", job.prospectId);
        if (!p) throw notFound("Prospect");
        await enrichProspect(store, router, p, now, job.kind);
        result = { prospect: p.id };
        break;
      }
      case "EXPORT_TO_OUTBOUND":
        result = await exportMarket(r, store, job, now);
        break;
    }
    if (await cancelled(store, jobId)) return save(store, jobId, persistCounters());
    if (marketBuildId) await patchMarketBuildFromResult(store, marketBuildId, result, counters.spendUsd, "ready");
    return save(store, jobId, { ...persistCounters(), status: "completed", result, finishedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof BudgetBlocked) {
      const paused = e.onLimit === "approval";
      if (marketBuildId) await patchMarketBuild(store, marketBuildId, { status: paused ? "approval_required" : "failed", providerSpendUsd: counters.spendUsd, failureReason: paused ? e.message : e.message });
      return save(store, jobId, {
        ...persistCounters(),
        status: paused ? "paused" : "failed",
        pausedReason: paused ? e.message : undefined,
        error: paused ? undefined : e.message,
        ...(paused ? {} : { finishedAt: new Date().toISOString() }),
      });
    }
    const msg = e instanceof Error ? e.message.slice(0, 300) : "Job failed.";
    if (marketBuildId) await patchMarketBuild(store, marketBuildId, { status: "failed", providerSpendUsd: counters.spendUsd, failureReason: msg });
    return save(store, jobId, { ...persistCounters(), status: "failed", error: msg, finishedAt: new Date().toISOString() });
  }
}

async function patchMarketBuild(store: ProspectGraphStore, id: string, changes: Partial<MarketBuild>): Promise<void> {
  const cur = await store.get("pg_market_builds", id);
  if (!cur) return;
  const tx = store.tx();
  tx.patch("pg_market_builds", cur, changes);
  await tx.commit();
}

async function patchMarketBuildFromResult(store: ProspectGraphStore, id: string, result: ProspectingJob["result"], spendUsd: number, status: MarketBuild["status"]): Promise<void> {
  await patchMarketBuild(store, id, {
    status,
    companyDiscoveryCount: Number(result?.found ?? 0),
    qualifiedCompanyCount: Number(result?.qualified ?? 0),
    providerSpendUsd: spendUsd,
    finishedAt: new Date().toISOString(),
  });
}

/** The pipeline for one prospect: research → decision makers → email → verify → score → qualify. */
async function enrichProspect(store: ProspectGraphStore, router: EnrichmentRouter, p: Prospect, now: Date, only?: ProspectingJob["kind"]): Promise<Prospect> {
  const market = await store.get("pg_markets", p.marketId);
  const company = await store.get("pg_companies", p.companyId);
  if (!market || !company) return p;
  const niche = await store.get("pg_niches", market.nicheId);
  const buyer = p.buyerTypeId ? await store.get("pg_buyer_types", p.buyerTypeId) : null;
  if (!niche) return p;
  router.setProspect(p.id);
  // `only` runs a single step; no `only` runs the whole pipeline.
  const step = (k: ProspectingJob["kind"]) => !only || only === k;
  if (step("RESEARCH_COMPANY")) await router.researchCompany(company, buyer ?? undefined);

  // Value gate from the pre-contact score (decision maker and email not yet counted).
  let cur = (await store.get("pg_prospects", p.id)) ?? p;
  const prelim = scoreProspect(await loadScoreInput(store, cur, now));
  const gate: Gate = { fit: prelim.fit, minFit: ENRICH_PRELIM_MIN };

  if (step("FIND_DECISION_MAKERS")) {
    const rel = buyer ? await store.get("pg_relationships", stableId(`rel_${niche.id}|${buyer.id}`)) : null;
    const families = rel?.relevantRoleFamilies ?? roleFamiliesForNiche(niche);
    const titles = rel?.relevantDecisionMakerTitles ?? buyer?.decisionMakerTitles ?? [];
    const dms = await router.findDecisionMakers(company, { titles, families }, gate);
    if (dms.people.length) {
      cur = (await store.get("pg_prospects", p.id)) ?? cur;
      const tx = store.tx();
      cur = tx.patch("pg_prospects", cur, { decisionMakerIds: dms.people.map((x) => x.role.id) });
      await tx.commit();
    }
  }
  if (step("ENRICH_CONTACT") || step("VERIFY_CONTACT")) {
    cur = (await store.get("pg_prospects", p.id)) ?? cur;
    const firstRole = cur.decisionMakerIds[0] ? await store.get("pg_company_people", cur.decisionMakerIds[0]) : null;
    const person = firstRole ? await store.get("pg_people", firstRole.personId) : null;
    if (person && only !== "VERIFY_CONTACT") {
      const em = await router.resolveWorkEmail(person, company, gate);
      if (em.contact) {
        const tx = store.tx();
        cur = tx.patch("pg_prospects", cur, { primaryContactPointId: em.contact.id });
        await tx.commit();
      }
    }
    const cp = cur.primaryContactPointId ? await store.get("pg_contact_points", cur.primaryContactPointId) : null;
    if (cp) await router.verifyContact(cp, gate);
  }
  cur = (await store.get("pg_prospects", p.id)) ?? cur;
  const spent = (await store.list("pg_cost_events", { where: { prospectId: p.id } })).reduce((a, e) => a + e.costUsd, 0);
  if (Math.abs(spent - cur.acquisitionCostUsd) > 1e-9) {
    const tx = store.tx();
    cur = tx.patch("pg_prospects", cur, { acquisitionCostUsd: Math.round(spent * 10000) / 10000 });
    await tx.commit();
  }
  cur = await rescore(store, cur, now);
  const beforeStatus = cur.status;
  const next = await autoQualify(store, cur);
  if (!only || only === "ENRICH_CONTACT" || only === "VERIFY_CONTACT" || only === "FIND_DECISION_MAKERS") await appendOutcome(store, next, "enriched", now, `job:${only ?? "pipeline"}`);
  if (beforeStatus !== "qualified" && next.status === "qualified") await appendOutcome(store, next, "qualified", now, "rules");
  return next;
}

async function appendOutcome(store: ProspectGraphStore, p: Prospect, stage: "discovered" | "researched" | "qualified" | "enriched" | "verified", now: Date, sourceName: string): Promise<void> {
  const tx = store.tx();
  tx.insert("pg_outcomes", { orgId: p.orgId, prospectId: p.id, stage, source: "deterministic_worker", note: sourceName, occurredAt: now.toISOString() });
  await tx.commit();
}

async function discoverMarket(store: ProspectGraphStore, job: ProspectingJob, router: EnrichmentRouter, now: Date): Promise<ProspectingJob["result"]> {
  const market = await store.get("pg_markets", job.marketId!);
  if (!market) throw notFound("Market");
  const niche = await store.get("pg_niches", market.nicheId);
  if (!niche) throw notFound("Niche");
  const buyers = (await Promise.all(market.buyerTypeIds.map((id) => store.get("pg_buyer_types", id)))).filter((b): b is BuyerType => !!b);
  const max = job.limits.maxCompanies;
  const perBuyer = Math.max(1, Math.ceil(max / Math.max(1, buyers.length)));
  const state: MarketSourceState[] = [...market.discovery];
  const findState = (provider: string, buyerTypeId: string) => state.find((s) => s.provider === provider && s.buyerTypeId === buyerTypeId);
  let found = 0;
  let created = 0;
  const touched: Prospect[] = [];

  for (const buyer of buyers) {
    if (found >= max) break;
    if (await cancelled(store, job.id)) return { found, created };
    const hit = await router.discoverCompanies(
      { nicheTags: niche.tags, buyerType: { id: buyer.id, key: buyer.key, name: buyer.name, tags: buyer.tags, segmentKey: buyer.segmentKey }, geography: market.geography, limit: Math.min(perBuyer, max - found) },
      { cursorFor: (k) => findState(k, buyer.id)?.cursor, exhausted: (k) => !!findState(k, buyer.id)?.exhausted },
    );
    if (!hit) continue;
    const tx = store.tx();
    const pending = new Map<string, Company>();
    let newHere = 0;
    for (const d of hit.page.companies) {
      const fetchedAt = now.toISOString();
      const ing = await ingestCompany(store, tx, d, { provider: hit.provider.key, observedAt: fetchedAt, fetchedAt, confidence: d.confidence, demo: hit.provider.demo }, buyer, pending, policyForProvider(hit.provider));
      if (ing.created) newHere++;
      const pid = prospectId(market.orgId, market.id, ing.company.id);
      if (!(await store.get("pg_prospects", pid)) && !touched.some((t) => t.id === pid)) {
        const prospect = tx.insert("pg_prospects", {
          id: pid, orgId: market.orgId, marketId: market.id, companyId: ing.company.id, buyerTypeId: buyer.id, decisionMakerIds: [],
          status: "researching", whyNow: [], createdBy: `job:${job.kind}`, acquisitionCostUsd: 0,
        });
        touched.push(prospect);
        tx.insert("pg_outcomes", { orgId: prospect.orgId, prospectId: prospect.id, stage: "discovered", source: "deterministic_worker", note: `job:${job.kind}`, occurredAt: now.toISOString() });
        created++;
      }
      found++;
    }
    const prev = findState(hit.provider.key, buyer.id);
    const next: MarketSourceState = {
      provider: hit.provider.key, buyerTypeId: buyer.id, cursor: hit.page.nextCursor, exhausted: !hit.page.nextCursor,
      runs: (prev?.runs ?? 0) + 1, companiesSeen: (prev?.companiesSeen ?? 0) + hit.page.companies.length, lastNewCompanies: newHere, lastRunAt: now.toISOString(),
    };
    if (prev) state.splice(state.indexOf(prev), 1, next);
    else state.push(next);
    await tx.commit();
    await save(store, job.id, { progress: { done: found, total: max, note: `Discovering: ${buyer.name}` } });
  }
  const fresh = (await store.get("pg_markets", market.id)) as Market;
  {
    const tx = store.tx();
    tx.patch("pg_markets", fresh, { discovery: state, lastRefreshedAt: now.toISOString() });
    await tx.commit();
  }

  // Enrich + score the prospects this run created (never the whole graph).
  const toEnrich = touched.slice(0, max);
  let i = 0;
  let qualified = 0;
  for (const p of toEnrich) {
    if (await cancelled(store, job.id)) break;
    const done = await enrichProspect(store, router, p, now);
    if (done.status === "qualified") qualified++;
    i++;
    await save(store, job.id, { progress: { done: i, total: toEnrich.length, note: "Researching and scoring" } });
  }
  return { found, created, qualified };
}

async function rescoreMarket(store: ProspectGraphStore, job: ProspectingJob, now: Date) {
  const prospects = (await store.list("pg_prospects", { orgId: job.orgId })).filter((p) => p.marketId === job.marketId);
  let n = 0;
  for (const p of prospects) {
    if (await cancelled(store, job.id)) break;
    await autoQualify(store, await rescore(store, p, now));
    n++;
  }
  return { rescored: n };
}

async function exportMarket(r: Repository, store: ProspectGraphStore, job: ProspectingJob, now: Date) {
  const prospects = (await store.list("pg_prospects", { orgId: job.orgId })).filter((p) => p.marketId === job.marketId && p.status === "qualified");
  const budget = (await store.list("pg_budgets")).find((b) => b.scope === "client" && b.orgId === job.orgId);
  const cap = Math.min(prospects.length, budget?.maxLeadsExportedPerRun ?? 25);
  const system = { r, store, now, p: { kind: "bot" as const, botId: "export-worker", orgId: job.orgId, name: "Export worker" } };
  let sent = 0;
  let blocked = 0;
  for (const p of prospects.slice(0, cap)) {
    const res = await sendToOutbound(system, p.id, { sequenceKey: String(job.params.sequenceKey ?? "default") });
    if (res.sent) sent++;
    else if (res.violations.length) blocked++;
  }
  return { sent, blocked };
}

/** Job list for one client (or all covered clients for operators). */
export async function listJobs(ctx: Ctx, orgId?: string): Promise<ProspectingJob[]> {
  if (orgId) assertAllowed(ctx.p, "read_private", orgId);
  else assertAllowed(ctx.p, "read_shared");
  const rows = await ctx.store.list("pg_jobs", orgId ? { orgId } : {});
  return rows.filter((j) => allowed(ctx.p, "read_private", j.orgId));
}
