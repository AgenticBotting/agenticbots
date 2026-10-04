import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Company, Prospect } from "@/lib/prospecting/types";
import type { Repository } from "@/server/db/repository";
import { AppError, forbidden, invalid, notFound, unavailable } from "@/server/errors";
import { assertAllowed, getPrivate, type Ctx, type Principal } from "./access";
import { classifyBuyerType } from "./companies";
import { enqueueJob, runJob, type RunOptions } from "./jobs";
import { listMarkets, marketCoverage } from "./markets";
import { loadScoreInput, qualifyProspect, rejectProspect, saveProspect, scoreProspectById } from "./prospects";
import { scoreProspect as computeScore } from "./scoring";
import { activeSignals } from "./signals";
import { sendToCRM, sendToOutbound } from "./outbound";
import { ensureOntology } from "./ontology/service";
import { normalizeName } from "./ontology/normalize";

/**
 * Prospecting Bot tools.
 *
 * The ONLY surface a Prospecting Bot (running in the client's runtime)
 * uses to touch the Prospect Graph. Each tool:
 *   - validates its arguments (zod)
 *   - runs as a Bot principal bound to ONE organization (access.ts)
 *   - goes through the same services as the operator console
 *   - returns small, normalized JSON — never SQL, store internals,
 *     provider names, credentials, costs or raw provider payloads
 *
 * Anything that can spend money runs as a job, so run limits and budgets
 * apply and the work shows up in the operator console.
 */
export interface ToolDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  input: S;
  /** True when the tool can trigger paid provider calls (budget-limited). */
  mayCost: boolean;
  run(ctx: Ctx, args: z.infer<S>, opts: RunOptions): Promise<unknown>;
}

const id = z.string().min(1).max(80);

/** Keeps each tool's argument type inferred from its schema. */
const tool = <S extends z.ZodTypeAny>(def: ToolDef<S>): ToolDef => def as unknown as ToolDef;

function companyOut(c: Company) {
  const l = c.locations[0];
  return { id: c.id, name: c.canonicalName, domain: c.domain ?? null, city: l?.city ?? null, state: l?.state ?? null, buyerTypeIds: c.buyerTypeIds, demo: c.demo };
}

async function prospectOut(ctx: Ctx, p: Prospect) {
  const company = await ctx.store.get("pg_companies", p.companyId);
  const role = p.decisionMakerIds[0] ? await ctx.store.get("pg_company_people", p.decisionMakerIds[0]) : null;
  const person = role ? await ctx.store.get("pg_people", role.personId) : null;
  const contact = p.primaryContactPointId ? await ctx.store.get("pg_contact_points", p.primaryContactPointId) : null;
  return {
    id: p.id,
    marketId: p.marketId,
    company: company ? companyOut(company) : null,
    status: p.status,
    fit: p.score?.fit ?? null,
    timing: p.score?.timing ?? null,
    priority: p.score?.priority ?? null,
    why: p.whyNow,
    decisionMaker: person && role ? { name: person.fullName, title: role.title, roleFamily: role.roleFamily } : null,
    email: contact ? { address: contact.value, status: contact.status } : null,
    qualification: p.qualification ? { decision: p.qualification.decision, reasons: p.qualification.reasons } : null,
  };
}

async function prospectJob(ctx: Ctx, prospectId: string, kind: "RESEARCH_COMPANY" | "FIND_DECISION_MAKERS" | "ENRICH_CONTACT" | "VERIFY_CONTACT", opts: RunOptions) {
  const p = await getPrivate(ctx.store, "pg_prospects", prospectId, ctx.p, "write_private");
  const job = await enqueueJob(ctx, p.orgId, kind, { prospectId: p.id });
  const done = await runJob(ctx.r, job.id, { now: ctx.now, ...opts });
  const after = await ctx.store.get("pg_prospects", p.id);
  return { job: { id: done.id, status: done.status, note: done.pausedReason ?? done.error ?? null }, prospect: after ? await prospectOut(ctx, after) : null };
}

const orgOf = (ctx: Ctx, orgId?: string): string => {
  if (ctx.p.kind === "bot") {
    if (orgId && orgId !== ctx.p.orgId) throw notFound();
    return ctx.p.orgId;
  }
  if (!orgId) throw invalid("orgId is required for operators.");
  return orgId;
};

export const PROSPECTING_TOOLS: ToolDef[] = [
  tool({
    name: "searchMarkets",
    description: "List this client's prospecting markets, and service niches matching a query (with tier).",
    input: z.object({ query: z.string().max(80).optional(), orgId: id.optional() }),
    mayCost: false,
    async run(ctx, a) {
      const orgId = orgOf(ctx, a.orgId);
      const markets = await listMarkets(ctx, orgId);
      const q = a.query ? normalizeName(a.query) : "";
      const niches = q ? (await ctx.store.list("pg_niches")).filter((n) => n.normalizedName.includes(q)).slice(0, 15) : [];
      return {
        markets: markets.map((m) => ({ id: m.id, name: m.name, status: m.status, buyerTypeIds: m.buyerTypeIds })),
        niches: niches.map((n) => ({ id: n.id, name: n.name, category: n.category, tier: n.tier, attractiveness: n.attractiveness.total })),
      };
    },
  }),
  tool({
    name: "discoverCompanies",
    description: "Run discovery for one market: find companies, then research, enrich, score and qualify the new ones (budget-limited).",
    input: z.object({ marketId: id, maxCompanies: z.number().int().min(1).max(200).optional() }),
    mayCost: true,
    async run(ctx, a, opts) {
      const m = await getPrivate(ctx.store, "pg_markets", a.marketId, ctx.p, "write_private");
      const job = await enqueueJob(ctx, m.orgId, "DISCOVER_MARKET", { marketId: m.id, limits: a.maxCompanies ? { maxCompanies: a.maxCompanies } : undefined });
      const done = await runJob(ctx.r, job.id, { now: ctx.now, ...opts });
      return { job: { id: done.id, status: done.status, result: done.result ?? null, note: done.pausedReason ?? done.error ?? null } };
    },
  }),
  tool({
    name: "getMarketCoverage",
    description: "Observed coverage of a market (found, qualified, sent) and whether its sources are exhausted.",
    input: z.object({ marketId: id }),
    mayCost: false,
    async run(ctx, a) {
      const c = await marketCoverage(ctx, a.marketId);
      return { observed: c.observed, exhaustion: c.exhaustion, estimate: c.estimate ? { count: c.estimate.count, methodology: c.estimate.methodology, label: "Estimated" } : null };
    },
  }),
  tool({
    name: "researchCompany",
    description: "Research a prospect's company for observed 'why now' signals (cached when fresh).",
    input: z.object({ prospectId: id }),
    mayCost: true,
    run: (ctx, a, opts) => prospectJob(ctx, a.prospectId, "RESEARCH_COMPANY", opts),
  }),
  tool({
    name: "classifyBuyerType",
    description: "Classify a company into a buyer type using rules (no guessing below confidence).",
    input: z.object({ companyId: id }),
    mayCost: false,
    async run(ctx, a) {
      assertAllowed(ctx.p, "read_shared");
      const c = await ctx.store.get("pg_companies", a.companyId);
      if (!c) throw notFound("Company");
      if (c.buyerClassification) return { buyerTypeId: c.buyerClassification.buyerTypeId, confidence: c.buyerClassification.confidence, method: c.buyerClassification.method };
      const hit = classifyBuyerType(c, await ctx.store.list("pg_buyer_types"));
      return hit && hit.confidence >= 0.6 ? { buyerTypeId: hit.buyerTypeId, confidence: hit.confidence, method: "rules" } : { buyerTypeId: null, confidence: hit?.confidence ?? 0, method: "rules", note: "Not confident enough — leave for an operator." };
    },
  }),
  tool({
    name: "findDecisionMakers",
    description: "Find decision makers at a prospect's company for the niche's role families (cache first; budget-limited).",
    input: z.object({ prospectId: id }),
    mayCost: true,
    run: (ctx, a, opts) => prospectJob(ctx, a.prospectId, "FIND_DECISION_MAKERS", opts),
  }),
  tool({
    name: "findWorkEmail",
    description: "Resolve the decision maker's work email (cache, known pattern, then providers; budget-limited) and verify it.",
    input: z.object({ prospectId: id }),
    mayCost: true,
    run: (ctx, a, opts) => prospectJob(ctx, a.prospectId, "ENRICH_CONTACT", opts),
  }),
  tool({
    name: "verifyWorkEmail",
    description: "Verify the prospect's work email (cached for 30 days).",
    input: z.object({ prospectId: id }),
    mayCost: true,
    run: (ctx, a, opts) => prospectJob(ctx, a.prospectId, "VERIFY_CONTACT", opts),
  }),
  tool({
    name: "getCompanySignals",
    description: "Observed, unexpired 'why now' signals for a company. Never inferred.",
    input: z.object({ companyId: id }),
    mayCost: false,
    async run(ctx, a) {
      assertAllowed(ctx.p, "read_shared");
      const signals = await activeSignals(ctx.store, a.companyId, ctx.now);
      return { signals: signals.map((s) => ({ type: s.type, summary: s.summary, observedAt: s.observedAt, expiresAt: s.expiresAt, demo: s.provenance.demo })) };
    },
  }),
  tool({
    name: "scoreCompany",
    description: "Score a company against one of this client's markets without saving it.",
    input: z.object({ companyId: id, marketId: id }),
    mayCost: false,
    async run(ctx, a) {
      const m = await getPrivate(ctx.store, "pg_markets", a.marketId, ctx.p);
      const c = await ctx.store.get("pg_companies", a.companyId);
      if (!c) throw notFound("Company");
      const temp = { id: "preview", orgId: m.orgId, marketId: m.id, companyId: c.id, buyerTypeId: c.buyerClassification?.buyerTypeId ?? c.buyerTypeIds[0], decisionMakerIds: [], status: "new", whyNow: [], createdBy: "preview", acquisitionCostUsd: 0, createdAt: "", updatedAt: "", version: 0 } as Prospect;
      const s = computeScore(await loadScoreInput(ctx.store, temp, ctx.now));
      return { fit: s.fit, timing: s.timing, priority: s.priority, reasons: s.reasons, version: s.version };
    },
  }),
  tool({
    name: "scoreProspect",
    description: "Recompute a prospect's Fit, Timing and Priority with reasons.",
    input: z.object({ prospectId: id }),
    mayCost: false,
    async run(ctx, a) {
      return prospectOut(ctx, await scoreProspectById(ctx, a.prospectId));
    },
  }),
  tool({
    name: "saveProspect",
    description: "Save a known company into one of this client's markets.",
    input: z.object({ marketId: id, companyId: id, buyerTypeId: id.optional(), notes: z.string().max(2000).optional() }),
    mayCost: false,
    async run(ctx, a) {
      return prospectOut(ctx, await saveProspect(ctx, a.marketId, a.companyId, { buyerTypeId: a.buyerTypeId, notes: a.notes }));
    },
  }),
  tool({
    name: "qualifyProspect",
    description: "Apply the qualification rules to a prospect. A Bot cannot override the rules.",
    input: z.object({ prospectId: id }),
    mayCost: false,
    async run(ctx, a) {
      return prospectOut(ctx, await qualifyProspect(ctx, a.prospectId));
    },
  }),
  tool({
    name: "rejectProspect",
    description: "Reject a prospect with a reason.",
    input: z.object({ prospectId: id, reason: z.string().min(3).max(500) }),
    mayCost: false,
    async run(ctx, a) {
      return prospectOut(ctx, await rejectProspect(ctx, a.prospectId, a.reason));
    },
  }),
  tool({
    name: "sendToOutbound",
    description: "Hand a QUALIFIED prospect to the outbound system. Suppression and policy checks always run and cannot be overridden.",
    input: z.object({ prospectId: id, sequenceKey: z.string().max(60).optional() }),
    mayCost: false,
    async run(ctx, a, opts) {
      // A Bot never gets the person-only overrides, whatever it passes.
      const r = await sendToOutbound(ctx, a.prospectId, { sequenceKey: a.sequenceKey, providers: opts.providers });
      return { sent: r.sent, status: r.handoff.status, violations: r.violations };
    },
  }),
  tool({
    name: "sendToCRM",
    description: "Queue a qualified prospect for the client's CRM Bot.",
    input: z.object({ prospectId: id }),
    mayCost: false,
    async run(ctx, a) {
      const r = await sendToCRM(ctx, a.prospectId);
      return { queued: r.sent, status: r.handoff.status, violations: r.violations };
    },
  }),
];

export const TOOL_NAMES = PROSPECTING_TOOLS.map((t) => t.name);

/** Run one tool. Unknown tools and bad arguments are refused before any work. */
export async function runProspectingTool(ctx: Ctx, name: string, args: unknown, opts: RunOptions = {}): Promise<unknown> {
  const tool = PROSPECTING_TOOLS.find((t) => t.name === name);
  if (!tool) throw invalid(`Unknown tool "${String(name).slice(0, 40)}".`);
  const parsed = tool.input.safeParse(args ?? {});
  if (!parsed.success) throw invalid(`Invalid arguments for ${tool.name}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"} ${i.message}`).join("; ").slice(0, 300)}`);
  await ensureOntology(ctx.r);
  return tool.run(ctx, parsed.data, opts);
}

/* ───────────── Bot principal + tool token ───────────── */

/**
 * Resolve a Bot principal. The Bot must exist, belong to the org in its
 * token, be a Prospecting Bot, not be disabled, and the org must be able
 * to run work. Otherwise: refused.
 */
export async function botPrincipal(r: Repository, botId: string, orgId: string): Promise<Principal> {
  const bot = await r.get("bots", botId);
  if (!bot || bot.orgId !== orgId) throw forbidden("bot");
  if (bot.typeKey !== "prospecting") throw forbidden("Only a Prospecting Bot can use prospecting tools.");
  if (bot.status === "disabled" || bot.status === "provisioning") throw forbidden("This Bot is not active.");
  const org = await r.get("organizations", orgId);
  if (!org || org.status === "suspended" || org.status === "canceled") throw forbidden("This client is not active.");
  return { kind: "bot", botId: bot.id, orgId, name: bot.name };
}

function toolSecret(): string {
  const s = process.env.PROSPECTING_TOOL_SECRET;
  if (!s || s.length < 32) throw unavailable("Prospecting tools are not configured.");
  return s;
}

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

/** Short-lived token the platform gives a Bot's runtime. Contains no secret. */
export function issueToolToken(botId: string, orgId: string, ttlSeconds = 3600, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ b: botId, o: orgId, e: Math.floor(now / 1000) + Math.min(ttlSeconds, 86_400) })).toString("base64url");
  return `${payload}.${sign(payload, toolSecret())}`;
}

export function verifyToolToken(token: string, now = Date.now()): { botId: string; orgId: string } {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) throw new AppError("unauthenticated", "Invalid tool token.", 401);
  const want = Buffer.from(sign(payload, toolSecret()));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) throw new AppError("unauthenticated", "Invalid tool token.", 401);
  let data: { b?: string; o?: string; e?: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new AppError("unauthenticated", "Invalid tool token.", 401);
  }
  if (!data.b || !data.o || !data.e || data.e * 1000 < now) throw new AppError("unauthenticated", "Tool token expired.", 401);
  return { botId: data.b, orgId: data.o };
}
