"use server";

import { redirect } from "next/navigation";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { act, opt, str, type ActionState } from "@/server/actions/wrap";
import { invalid } from "@/server/errors";
import { asUser, ctxOf } from "@/server/prospecting/access";
import { reviewRelationship } from "@/server/prospecting/ontology/service";
import { createIcp, createMarket, setUniverseEstimate } from "@/server/prospecting/markets";
import { approveJobSpend, cancelJob, enqueueJob, runJob } from "@/server/prospecting/jobs";
import { qualifyProspect, recordOutcome, rejectProspect } from "@/server/prospecting/prospects";
import { sendToCRM, sendToOutbound } from "@/server/prospecting/outbound";
import { addSuppression, liftSuppression } from "@/server/prospecting/compliance";
import { setBudget } from "@/server/prospecting/costs";
import type { Geography, JobKind, OutcomeStage, Suppression, SuppressionReason } from "@/lib/prospecting/types";

type A = (prev: ActionState, f: FormData) => Promise<ActionState>;
const R = "/ops/prospecting";

async function ctx() {
  return ctxOf(await repo(), asUser(await requireActor()));
}

const num = (f: FormData, k: string): number | undefined => {
  const v = opt(f, k);
  if (v === undefined) return undefined;
  const n = Number(v.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) throw invalid(`"${k}" must be a number.`);
  return n;
};

/* ── Ontology review ── */

export const reviewRelationshipAction: A = async (_p, f) =>
  act(async () => {
    const decision = str(f, "decision");
    if (decision !== "approve" && decision !== "reject") throw invalid("Choose approve or reject.");
    const c = await ctx();
    await reviewRelationship(c.r, c.p, str(f, "relId"), { decision, note: opt(f, "note") });
    return decision === "approve" ? "Approved." : "Rejected.";
  }, R);

export const editRelationshipAction: A = async (_p, f) =>
  act(async () => {
    const c = await ctx();
    const titles = opt(f, "titles");
    await reviewRelationship(c.r, c.p, str(f, "relId"), {
      decision: "edit",
      note: opt(f, "note"),
      priority: num(f, "priority"),
      relevantDecisionMakerTitles: titles ? titles.split(/[;\n]/) : undefined,
    });
    return "Saved and approved.";
  }, R);

/* ── ICPs and markets ── */

function geography(f: FormData, prefix = ""): Geography {
  return {
    kind: (str(f, `${prefix}kind`) || "county") as Geography["kind"],
    name: str(f, `${prefix}name`),
    state: str(f, `${prefix}state`).toUpperCase(),
    zips: opt(f, `${prefix}zips`)?.split(/[\s,]+/),
  };
}

export const createIcpAction: A = async (_p, f) =>
  act(async () => {
    const c = await ctx();
    const icp = await createIcp(c, str(f, "orgId"), {
      name: str(f, "name"),
      nicheIds: f.getAll("nicheIds").map(String).filter(Boolean),
      services: opt(f, "services")?.split(/[,\n]/),
      geographies: [geography(f, "geo_")],
      preferredBuyerTypeIds: f.getAll("preferred").map(String).filter(Boolean),
      excludedBuyerTypeIds: f.getAll("excluded").map(String).filter(Boolean),
      notes: opt(f, "notes"),
      minOpportunityUsd: num(f, "minOpportunityUsd"),
    });
    return `ICP "${icp.name}" saved.`;
  }, R);

export const createMarketAction: A = async (_p, f) =>
  act(async () => {
    const c = await ctx();
    const m = await createMarket(c, str(f, "orgId"), {
      nicheId: str(f, "nicheId"),
      icpId: opt(f, "icpId"),
      geography: geography(f, "geo_"),
      name: opt(f, "name"),
    });
    redirect(`/ops/prospecting/markets/${m.id}`);
  }, R);

export const setEstimateAction: A = async (_p, f) =>
  act(async () => {
    await setUniverseEstimate(await ctx(), str(f, "marketId"), Math.round(num(f, "count") ?? -1), str(f, "methodology"));
    return "Estimate recorded (shown as Estimated).";
  }, R);

/* ── Jobs ── */

const JOB_KINDS: JobKind[] = ["DISCOVER_MARKET", "REFRESH_MARKET", "RESCORE_PROSPECTS", "EXPORT_TO_OUTBOUND", "RESEARCH_COMPANY", "FIND_DECISION_MAKERS", "ENRICH_CONTACT", "VERIFY_CONTACT"];

export const runJobAction: A = async (_p, f) =>
  act(async () => {
    const c = await ctx();
    const kind = str(f, "kind") as JobKind;
    if (!JOB_KINDS.includes(kind)) throw invalid("Unknown job.");
    const maxCompanies = num(f, "maxCompanies");
    const job = await enqueueJob(c, str(f, "orgId"), kind, {
      marketId: opt(f, "marketId"),
      prospectId: opt(f, "prospectId"),
      limits: maxCompanies ? { maxCompanies } : undefined,
      params: opt(f, "sequenceKey") ? { sequenceKey: str(f, "sequenceKey") } : undefined,
    });
    // V1: jobs run inline after enqueue (small, bounded by run limits).
    const done = await runJob(c.r, job.id);
    if (done.status === "paused") return { ok: false, message: `Paused: ${done.pausedReason}` };
    if (done.status === "failed") return { ok: false, message: `Failed: ${done.error}` };
    const r = done.result ?? {};
    return `Done. ${Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(", ")}`;
  }, R);

export const cancelJobAction: A = async (_p, f) =>
  act(async () => {
    await cancelJob(await ctx(), str(f, "jobId"));
    return "Cancelled.";
  }, R);

export const approveJobAction: A = async (_p, f) =>
  act(async () => {
    const c = await ctx();
    const job = await approveJobSpend(c, str(f, "jobId"), { usd: num(f, "usd") ?? 0, calls: Math.round(num(f, "calls") ?? 0) });
    const done = await runJob(c.r, job.id);
    return `Approved. Job is ${done.status}.`;
  }, R);

/* ── Prospects ── */

export const qualifyAction: A = async (_p, f) =>
  act(async () => {
    const decision = opt(f, "decision") as "qualified" | "review" | "rejected" | undefined;
    const p = await qualifyProspect(await ctx(), str(f, "prospectId"), decision ? { decision, reason: str(f, "reason") } : undefined);
    return `Status: ${p.status}.`;
  }, R);

export const rejectAction: A = async (_p, f) =>
  act(async () => {
    await rejectProspect(await ctx(), str(f, "prospectId"), str(f, "reason"));
    return "Rejected.";
  }, R);

export const outboundAction: A = async (_p, f) =>
  act(async () => {
    const res = await sendToOutbound(await ctx(), str(f, "prospectId"), {
      sequenceKey: opt(f, "sequenceKey"),
      overrideSoft: f.get("overrideSoft") === "on",
      allowCatchAll: f.get("allowCatchAll") === "on",
    });
    return res.sent ? "Handed to outbound." : { ok: false, message: res.violations.length ? `Blocked: ${res.violations.join(" ")}` : `Handoff ${res.handoff.status}.` };
  }, R);

export const crmAction: A = async (_p, f) =>
  act(async () => {
    const res = await sendToCRM(await ctx(), str(f, "prospectId"));
    return res.sent ? "Queued for the CRM Bot." : { ok: false, message: `Blocked: ${res.violations.join(" ")}` };
  }, R);

export const outcomeAction: A = async (_p, f) =>
  act(async () => {
    const dollars = num(f, "value");
    await recordOutcome(await ctx(), str(f, "prospectId"), {
      stage: str(f, "stage") as OutcomeStage,
      valueCents: dollars !== undefined ? Math.round(dollars * 100) : undefined,
      source: "operator",
      note: opt(f, "note"),
    });
    return "Outcome recorded.";
  }, R);

/* ── Suppression ── */

export const addSuppressionAction: A = async (_p, f) =>
  act(async () => {
    await addSuppression(await ctx(), {
      orgId: opt(f, "orgId"),
      kind: str(f, "kind") as Suppression["kind"],
      value: str(f, "value"),
      reason: str(f, "reason") as SuppressionReason,
      hard: f.get("soft") !== "on",
      note: opt(f, "note"),
    });
    return "Suppressed.";
  }, R);

export const liftSuppressionAction: A = async (_p, f) =>
  act(async () => {
    await liftSuppression(await ctx(), str(f, "id"), opt(f, "note"));
    return "Lifted.";
  }, R);

/* ── Budgets ── */

export const setBudgetAction: A = async (_p, f) =>
  act(async () => {
    await setBudget(await ctx(), {
      scope: str(f, "scope") as "platform" | "client" | "market" | "provider",
      orgId: opt(f, "orgId"),
      marketId: opt(f, "marketId"),
      provider: opt(f, "provider"),
      monthlyLimitUsd: num(f, "monthlyLimitUsd") ?? 0,
      maxPaidCallsPerRun: num(f, "maxPaidCallsPerRun"),
      maxCompaniesPerJob: num(f, "maxCompaniesPerJob"),
      maxLeadsExportedPerRun: num(f, "maxLeadsExportedPerRun"),
      onLimit: (opt(f, "onLimit") as "stop" | "approval" | undefined) ?? "approval",
    });
    return "Budget saved.";
  }, R);
