import "server-only";
import type { Bot, Incident, Integration, Organization, Run, Runtime, ServiceAgreement } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";
import { clientBillingStatus, deriveInvoiceStatus, outstandingCents, todayStr, type ClientBillingStatus } from "@/server/billing/domain";
import { monthKey } from "./common";
import { isActive } from "./runs";

/** Run outcomes per day, oldest first, for the last `days` days. */
export interface RunDay {
  date: string;
  completed: number;
  failed: number;
  other: number;
}

export function runsByDay(runs: Run[], days = 14, now = Date.now()): RunDay[] {
  const DAY = 86_400_000;
  const out: RunDay[] = Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * DAY).toISOString().slice(0, 10),
    completed: 0,
    failed: 0,
    other: 0,
  }));
  for (const r of runs) {
    const i = days - 1 - Math.floor((now - Date.parse(r.createdAt)) / DAY);
    if (i < 0 || i >= days) continue;
    if (r.status === "completed") out[i].completed++;
    else if (r.status === "failed" || r.status === "interrupted") out[i].failed++;
    else out[i].other++;
  }
  return out;
}

export interface ClientRow {
  org: Organization;
  agreement?: ServiceAgreement;
  paymentStatus: ClientBillingStatus;
  runtime?: Runtime;
  bots: Bot[];
  enabledBots: number;
  openApprovals: number;
  openRequests: number;
  integrationWarnings: number;
  runsThisMonth: number;
  estimatedCostUsd: number;
  openIncidents: number;
  worstIncident?: Incident["severity"];
  /** Runs per day, last 14 days (all outcomes). */
  runsDaily: number[];
}

const SEV_RANK: Record<Incident["severity"], number> = { critical: 4, high: 3, medium: 2, low: 1 };

export async function clientRows(r: Repository, actor: Actor): Promise<ClientRow[]> {
  const month = monthKey();
  const [orgs, agreements, invoices, runtimes, bots, approvals, requests, integrations, rollups, incidents, runs] = await Promise.all([
    r.list("organizations", { order: "asc" }), r.list("service_agreements"), r.list("invoices"), r.list("runtimes"), r.list("bots"),
    r.list("approvals"), r.list("requests"), r.list("integrations"), r.list("usage_rollups"), r.list("incidents"), r.list("runs", { limit: 1000 }),
  ]);
  return orgs
    .filter((o) => can(actor, "ops.view", o.id))
    .map((org) => {
      const orgBots = bots.filter((b) => b.orgId === org.id);
      const rt = runtimes.find((x) => x.orgId === org.id);
      const roll = rollups.filter((u) => u.orgId === org.id && u.period === month);
      const inc = incidents.filter((i) => i.orgId === org.id && (i.status === "open" || i.status === "investigating"));
      const worst = inc.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])[0]?.severity;
      return {
        org,
        agreement: agreements.find((a) => a.orgId === org.id && a.status !== "terminated" && a.status !== "completed"),
        paymentStatus: clientBillingStatus(invoices.filter((i) => i.orgId === org.id)),
        runtime: rt,
        bots: orgBots,
        enabledBots: orgBots.filter((b) => b.status !== "disabled").length,
        openApprovals: approvals.filter((a) => a.orgId === org.id && a.status === "pending").length,
        openRequests: requests.filter((q) => q.orgId === org.id && !["completed", "declined"].includes(q.status)).length,
        integrationWarnings: integrations.filter((i) => i.orgId === org.id && (i.status === "needs_attention" || i.status === "disconnected")).length,
        runsThisMonth: roll.reduce((s, u) => s + u.runs, 0),
        estimatedCostUsd: Math.round((roll.reduce((s, u) => s + u.modelCostUsd, 0) + (rt?.estimatedMonthlyCostUsd ?? 0)) * 100) / 100,
        openIncidents: inc.length,
        worstIncident: worst,
        runsDaily: runsByDay(runs.filter((x) => x.orgId === org.id)).map((d) => d.completed + d.failed + d.other),
      };
    });
}

export interface OpsDashboard {
  activeClients: number;
  clientsNeedingAttention: { org: Organization; reasons: string[] }[];
  incidents: Incident[];
  failedRuns: Run[];
  activeRuns: Run[];
  pendingApprovals: number;
  newRequests: number;
  disconnectedIntegrations: Integration[];
  pastDue: Organization[];
  suspended: Organization[];
  failingAutomations: number;
  providerProblems: Incident[];
  recentDeployments: { at: string; detail: string; status: string; orgName: string }[];
  usageThisMonth: { runs: number; modelCostUsd: number; infraCostUsd: number };
  outstandingCents: number;
  recentPayments: { orgName: string; amountCents: number; date: string; method: string }[];
  recentActions: { at: string; actorName: string; action: string; orgName?: string }[];
  eligibleForReactivation: Organization[];
  orgNames: Map<string, string>;
  botNames: Map<string, string>;
  runsDaily: RunDay[];
  fleet: { orgId: string; orgName: string; health: Runtime["health"]; ready: boolean; tunnel: Runtime["tunnel"]; diskUsedPct?: number; deploymentState: Runtime["deploymentState"] }[];
  mrrCents: number;
  pastDueCents: number;
}

/** "What needs my attention?" — the operator's default screen. */
export async function opsDashboard(r: Repository, actor: Actor): Promise<OpsDashboard> {
  const month = monthKey();
  const [orgs, incidents, runs, approvals, requests, integrations, jobs, deployments, rollups, runtimes, invoices, payments, audits, bots] = await Promise.all([
    r.list("organizations"), r.list("incidents"), r.list("runs", { limit: 400 }), r.list("approvals"), r.list("requests"),
    r.list("integrations"), r.list("automation_jobs"), r.list("deployment_events", { limit: 50 }), r.list("usage_rollups"),
    r.list("runtimes"), r.list("invoices"), r.list("payments", { limit: 50 }), r.list("audit_logs", { limit: 60 }), r.list("bots"),
  ]);
  const visible = new Set(orgs.filter((o) => can(actor, "ops.view", o.id)).map((o) => o.id));
  const v = <T extends { orgId?: string }>(rows: T[]) => rows.filter((x) => x.orgId && visible.has(x.orgId));
  const orgNames = new Map(orgs.map((o) => [o.id, o.name]));
  const vOrgs = orgs.filter((o) => visible.has(o.id));
  const openInc = v(incidents).filter((i) => i.status === "open" || i.status === "investigating");
  const today = todayStr();

  const attention = new Map<string, string[]>();
  const add = (orgId: string, reason: string) => attention.set(orgId, [...(attention.get(orgId) ?? []), reason]);
  for (const i of openInc.filter((x) => x.severity === "critical" || x.severity === "high")) add(i.orgId, i.title);
  for (const x of v(integrations).filter((i) => i.status === "needs_attention")) add(x.orgId, `${x.displayName} needs attention`);
  for (const o of vOrgs.filter((o) => o.eligibleForReactivation)) add(o.id, "Payment received — eligible for reactivation");
  for (const o of vOrgs) {
    const inv = invoices.filter((i) => i.orgId === o.id).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }));
    if (inv.some((i) => i.status === "past_due")) add(o.id, "Invoice past due");
  }
  for (const a of v(approvals).filter((a) => a.status === "pending" && a.audience === "operator")) add(a.orgId, "Approval waiting on AgenticBots");

  const vRuntimes = v(runtimes);
  const openInvoices = v(invoices).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }));
  const agreementsAll = await r.list("service_agreements");
  return {
    runsDaily: runsByDay(v(runs)),
    fleet: vRuntimes
      .filter((rt) => rt.deploymentState !== "not_provisioned")
      .map((rt) => ({ orgId: rt.orgId, orgName: orgNames.get(rt.orgId) ?? "", health: rt.health, ready: rt.ready, tunnel: rt.tunnel, diskUsedPct: rt.diskUsedPct, deploymentState: rt.deploymentState })),
    mrrCents: v(agreementsAll).filter((a) => a.status === "active" || a.status === "past_due").reduce((s, a) => s + a.monthlyValueCents, 0),
    pastDueCents: openInvoices.filter((i) => i.status === "past_due").reduce((s, i) => s + Math.max(0, i.balanceDueCents), 0),
    activeClients: vOrgs.filter((o) => o.status === "active" || o.status === "past_due").length,
    clientsNeedingAttention: [...attention.entries()].map(([id, reasons]) => ({ org: vOrgs.find((o) => o.id === id)!, reasons })).filter((x) => x.org),
    incidents: openInc.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]).slice(0, 8),
    failedRuns: v(runs).filter((x) => x.status === "failed" || x.status === "interrupted").slice(0, 6),
    activeRuns: v(runs).filter((x) => isActive(x.status)),
    pendingApprovals: v(approvals).filter((a) => a.status === "pending").length,
    newRequests: v(requests).filter((q) => q.status === "submitted").length,
    disconnectedIntegrations: v(integrations).filter((i) => i.status === "needs_attention" || i.status === "disconnected"),
    pastDue: vOrgs.filter((o) => invoices.some((i) => i.orgId === o.id && deriveInvoiceStatus(i, today) === "past_due")),
    suspended: vOrgs.filter((o) => o.status === "suspended"),
    failingAutomations: v(jobs).filter((j) => j.status === "failed").length,
    providerProblems: openInc.filter((i) => i.type === "provider_failure" || i.type === "run_failure_spike"),
    recentDeployments: v(deployments).slice(0, 5).map((d) => ({ at: d.createdAt, detail: `${d.kind.replace(/_/g, " ")} — ${d.detail}`, status: d.status, orgName: orgNames.get(d.orgId) ?? "" })),
    usageThisMonth: {
      runs: v(rollups).filter((u) => u.period === month).reduce((s, u) => s + u.runs, 0),
      modelCostUsd: Math.round(v(rollups).filter((u) => u.period === month).reduce((s, u) => s + u.modelCostUsd, 0) * 100) / 100,
      infraCostUsd: vRuntimes.filter((rt) => rt.deploymentState !== "not_provisioned").reduce((s, rt) => s + rt.estimatedMonthlyCostUsd, 0),
    },
    outstandingCents: outstandingCents(v(invoices).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }))),
    recentPayments: v(payments).filter((p) => p.amountCents > 0).slice(0, 5).map((p) => ({ orgName: orgNames.get(p.orgId) ?? "", amountCents: p.amountCents, date: p.dateReceived, method: p.method })),
    recentActions: audits.filter((a) => a.actorId !== "system" && (!a.orgId || visible.has(a.orgId))).slice(0, 8).map((a) => ({ at: a.createdAt, actorName: a.actorName, action: a.action, orgName: a.orgId ? orgNames.get(a.orgId) : undefined })),
    eligibleForReactivation: vOrgs.filter((o) => o.eligibleForReactivation),
    orgNames,
    botNames: new Map(bots.map((b) => [b.id, b.name])),
  };
}
