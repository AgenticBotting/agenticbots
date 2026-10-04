import "server-only";
import type { CostEvent, PaidOperation, ProspectingBudget, ProspectingJob } from "@/lib/prospecting/types";
import { audit } from "@/server/services/common";
import { correlationId } from "@/server/ids";
import { invalid } from "@/server/errors";
import type { GraphTx, ProspectGraphStore } from "./store";
import { assertAllowed, principalRef, type Ctx } from "./access";
import { stableId } from "./ontology/normalize";

/**
 * Cost-aware prospecting.
 *
 * Every provider call — free, paid, successful or failed — writes a
 * CostEvent (append-only). Before a PAID call the router asks `checkSpend`,
 * which fails closed:
 *
 *   no client budget                     → blocked (stop)
 *   run limit (calls / USD) reached      → blocked (needs operator approval)
 *   client / market / provider / platform
 *   monthly limit would be exceeded      → blocked (budget's onLimit)
 *
 * A Bot cannot raise a limit: budgets and approvals need ops.prospecting.spend.
 */
export const DEFAULT_MAX_COMPANIES = 25;

export type SpendScopeName = "run" | "client" | "market" | "provider" | "platform" | "pricing";

export class BudgetBlocked extends Error {
  constructor(
    readonly scope: SpendScopeName,
    readonly onLimit: "stop" | "approval",
    message: string,
  ) {
    super(message);
    this.name = "BudgetBlocked";
  }
}

export interface SpendContext {
  orgId?: string;
  marketBuildId?: string;
  marketId?: string;
  jobId?: string;
  prospectId?: string;
  companyId?: string;
  personId?: string;
}

const monthOf = (d: Date) => d.toISOString().slice(0, 7);

export async function monthSpend(store: ProspectGraphStore, now: Date, filter: (e: CostEvent) => boolean): Promise<number> {
  const m = monthOf(now);
  const events = await store.list("pg_cost_events");
  return round(events.filter((e) => e.createdAt.slice(0, 7) === m && filter(e)).reduce((s, e) => s + e.costUsd, 0));
}

const round = (n: number) => Math.round(n * 10000) / 10000;
const reservedFor = (b: ProspectingBudget, month: string) => b.reservedMonth === month ? (b.reservedUsd ?? 0) : 0;

export async function budgetsFor(store: ProspectGraphStore, sc: SpendContext, provider: string) {
  const all = await store.list("pg_budgets");
  return {
    platform: all.find((b) => b.scope === "platform"),
    client: sc.orgId ? all.find((b) => b.scope === "client" && b.orgId === sc.orgId) : undefined,
    market: sc.marketId ? all.find((b) => b.scope === "market" && b.marketId === sc.marketId) : undefined,
    provider: all.find((b) => b.scope === "provider" && b.provider === provider),
  };
}

/** Throws BudgetBlocked when a paid call is not allowed. Free calls always pass. */
export async function checkSpend(
  store: ProspectGraphStore,
  now: Date,
  sc: SpendContext,
  provider: string,
  estimateUsd: number,
  job?: Pick<ProspectingJob, "limits" | "paidCalls" | "spendUsd">,
): Promise<void> {
  if (estimateUsd <= 0) return;
  if (job) {
    if (job.paidCalls + 1 > job.limits.maxPaidCalls) {
      throw new BudgetBlocked("run", "approval", `This run reached its limit of ${job.limits.maxPaidCalls} paid calls.`);
    }
    if (job.spendUsd + estimateUsd > job.limits.maxSpendUsd + 1e-9) {
      throw new BudgetBlocked("run", "approval", `This run reached its spend limit of $${job.limits.maxSpendUsd.toFixed(2)}.`);
    }
  }
  const b = await budgetsFor(store, sc, provider);
  if (!b.client) {
    throw new BudgetBlocked("client", "stop", "No prospecting budget is configured for this client, so paid data calls are off.");
  }
  const checks: [SpendScopeName, ProspectingBudget | undefined, (e: CostEvent) => boolean][] = [
    ["client", b.client, (e) => e.orgId === sc.orgId],
    ["market", b.market, (e) => e.marketId === sc.marketId],
    ["provider", b.provider, (e) => e.provider === provider],
    ["platform", b.platform, () => true],
  ];
  for (const [scope, budget, filter] of checks) {
    if (!budget) continue;
    const spent = await monthSpend(store, now, filter);
    if (spent + reservedFor(budget, monthOf(now)) + estimateUsd > budget.monthlyLimitUsd + 1e-9) {
      throw new BudgetBlocked(scope, budget.onLimit, `The ${scope} monthly prospecting budget ($${budget.monthlyLimitUsd.toFixed(2)}) would be exceeded.`);
    }
  }
}

export interface ReservePaidOperationInput {
  provider: string;
  capability: string;
  operation: CostEvent["operation"];
  estimateUsd: number;
  job?: Pick<ProspectingJob, "limits" | "paidCalls" | "spendUsd">;
  targetKey: string;
  demo: boolean;
}

export interface ReservedPaidOperation {
  operation: PaidOperation;
  duplicate: boolean;
}

export function paidOperationId(sc: SpendContext, provider: string, capability: string, operation: string, targetKey: string, month: string): string {
  return stableId(`paidop_${month}|${sc.orgId ?? "platform"}|${sc.marketBuildId ?? ""}|${sc.marketId ?? ""}|${sc.jobId ?? ""}|${sc.prospectId ?? ""}|${sc.companyId ?? ""}|${sc.personId ?? ""}|${provider}|${capability}|${operation}|${targetKey}`);
}

/**
 * Atomically reserve estimated spend before a paid call.
 *
 * The reservation patches every applicable budget row in the same Tx as the
 * operation insert. Repository optimistic locking makes concurrent spenders
 * retry/fail closed instead of both seeing the same remaining balance.
 */
export async function reservePaidOperation(
  store: ProspectGraphStore,
  now: Date,
  sc: SpendContext,
  input: ReservePaidOperationInput,
): Promise<ReservedPaidOperation> {
  const estimateUsd = round(input.estimateUsd);
  if (estimateUsd <= 0) {
    throw new BudgetBlocked("pricing", "stop", "Paid operation reservation requires a positive configured price.");
  }
  await checkSpend(store, now, sc, input.provider, estimateUsd, input.job);
  const month = monthOf(now);
  const id = paidOperationId(sc, input.provider, input.capability, input.operation, input.targetKey, month);
  const prior = await store.get("pg_paid_operations", id);
  if (prior) {
    if (prior.status === "settled" || prior.status === "released" || prior.status === "failed") return { operation: prior, duplicate: true };
    throw new BudgetBlocked("pricing", "stop", "A matching paid data operation is already in progress; refusing to buy the same data twice.");
  }
  const b = await budgetsFor(store, sc, input.provider);
  if (!b.client) throw new BudgetBlocked("client", "stop", "No prospecting budget is configured for this client, so paid data calls are off.");
  const checks: [PaidOperation["reservationScopes"][number], ProspectingBudget | undefined, (e: CostEvent) => boolean][] = [
    ["client", b.client, (e) => e.orgId === sc.orgId],
    ["market", b.market, (e) => e.marketId === sc.marketId],
    ["provider", b.provider, (e) => e.provider === input.provider],
    ["platform", b.platform, () => true],
  ];
  const tx = store.tx();
  const scopes: PaidOperation["reservationScopes"] = [];
  for (const [scope, budget, filter] of checks) {
    if (!budget) continue;
    const spent = await monthSpend(store, now, filter);
    const reserved = reservedFor(budget, month);
    if (spent + reserved + estimateUsd > budget.monthlyLimitUsd + 1e-9) {
      throw new BudgetBlocked(scope, budget.onLimit, `The ${scope} monthly prospecting budget ($${budget.monthlyLimitUsd.toFixed(2)}) would be exceeded.`);
    }
    scopes.push(scope);
    tx.patch("pg_budgets", budget, { reservedMonth: month, reservedUsd: round(reserved + estimateUsd) });
  }
  const op = tx.insert("pg_paid_operations", {
    id,
    operationId: id,
    orgId: sc.orgId!,
    marketBuildId: sc.marketBuildId,
    marketId: sc.marketId,
    jobId: sc.jobId,
    companyId: sc.companyId,
    personId: sc.personId,
    prospectId: sc.prospectId,
    provider: input.provider,
    capability: input.capability,
    operation: input.operation,
    estimatedCostUsd: estimateUsd,
    reservedCostUsd: estimateUsd,
    status: "reserved",
    attemptCount: 0,
    startedAt: now.toISOString(),
    reservationMonth: month,
    reservationScopes: scopes,
    demo: input.demo,
  });
  await tx.commit();
  return { operation: op, duplicate: false };
}

async function adjustReservations(store: ProspectGraphStore, op: PaidOperation, deltaUsd: number, tx: GraphTx): Promise<void> {
  if (Math.abs(deltaUsd) < 1e-9) return;
  const b = await budgetsFor(store, { orgId: op.orgId, marketId: op.marketId }, op.provider);
  const byScope: Partial<Record<PaidOperation["reservationScopes"][number], ProspectingBudget | undefined>> = { client: b.client, market: b.market, provider: b.provider, platform: b.platform };
  for (const scope of op.reservationScopes) {
    const budget = byScope[scope];
    if (!budget) continue;
    const current = reservedFor(budget, op.reservationMonth);
    tx.patch("pg_budgets", budget, { reservedMonth: op.reservationMonth, reservedUsd: round(Math.max(0, current + deltaUsd)) });
  }
}

export async function markPaidOperationRunning(store: ProspectGraphStore, op: PaidOperation): Promise<PaidOperation> {
  const current = await store.get("pg_paid_operations", op.id);
  if (!current || current.status !== "reserved") return current ?? op;
  const tx = store.tx();
  const next = tx.patch("pg_paid_operations", current, { status: "running", attemptCount: current.attemptCount + 1 });
  await tx.commit();
  return next;
}

export async function settlePaidOperation(
  store: ProspectGraphStore,
  op: PaidOperation,
  actualCostUsd: number,
  success: boolean,
  error?: string,
): Promise<PaidOperation> {
  const current = (await store.get("pg_paid_operations", op.id)) ?? op;
  const tx = store.tx();
  await adjustReservations(store, current, -current.reservedCostUsd, tx);
  const next = tx.patch("pg_paid_operations", current, {
    status: success ? "settled" : "failed",
    actualCostUsd: round(actualCostUsd),
    completedAt: new Date().toISOString(),
    lastError: error?.slice(0, 500),
  });
  await tx.commit();
  return next;
}

export async function releasePaidOperation(store: ProspectGraphStore, op: PaidOperation, reason?: string): Promise<PaidOperation> {
  const current = (await store.get("pg_paid_operations", op.id)) ?? op;
  const tx = store.tx();
  await adjustReservations(store, current, -current.reservedCostUsd, tx);
  const next = tx.patch("pg_paid_operations", current, { status: "released", completedAt: new Date().toISOString(), lastError: reason?.slice(0, 500) });
  await tx.commit();
  return next;
}

export function recordCost(
  tx: GraphTx,
  e: Omit<CostEvent, "id" | "createdAt" | "updatedAt" | "version" | "costUsd"> & { costUsd?: number },
): CostEvent {
  return tx.insert("pg_cost_events", { ...e, costUsd: round(e.costUsd ?? e.units * e.unitCostUsd) });
}

/** Run limits captured on a job at enqueue time. */
export async function runLimitsFor(store: ProspectGraphStore, orgId: string, marketId?: string, requested?: Partial<ProspectingJob["limits"]>): Promise<ProspectingJob["limits"]> {
  const all = await store.list("pg_budgets");
  const client = all.find((b) => b.scope === "client" && b.orgId === orgId);
  const market = marketId ? all.find((b) => b.scope === "market" && b.marketId === marketId) : undefined;
  const cap = market ?? client;
  const maxPaidCalls = Math.min(requested?.maxPaidCalls ?? Infinity, cap?.maxPaidCallsPerRun ?? 0);
  const maxCompanies = Math.min(requested?.maxCompanies ?? Infinity, cap?.maxCompaniesPerJob ?? DEFAULT_MAX_COMPANIES);
  // Without a client budget a run may not spend at all.
  const maxSpendUsd = Math.min(requested?.maxSpendUsd ?? Infinity, client ? client.monthlyLimitUsd : 0);
  return { maxPaidCalls, maxCompanies, maxSpendUsd: round(maxSpendUsd) };
}

export interface BudgetInput {
  scope: ProspectingBudget["scope"];
  orgId?: string;
  marketId?: string;
  provider?: string;
  monthlyLimitUsd: number;
  maxPaidCallsPerRun?: number;
  maxCompaniesPerJob?: number;
  maxLeadsExportedPerRun?: number;
  maxProviderRetries?: number;
  onLimit?: "stop" | "approval";
}

export async function setBudget(ctx: Ctx, input: BudgetInput): Promise<ProspectingBudget> {
  assertAllowed(ctx.p, "manage_budgets", input.scope === "client" || input.scope === "market" ? input.orgId : undefined);
  if (!(input.monthlyLimitUsd >= 0) || input.monthlyLimitUsd > 100_000) throw invalid("Monthly limit must be between $0 and $100,000.");
  if ((input.scope === "client" || input.scope === "market") && !input.orgId) throw invalid("A client budget needs a client.");
  if (input.scope === "market" && !input.marketId) throw invalid("A market budget needs a market.");
  if (input.scope === "provider" && !input.provider) throw invalid("A provider budget needs a provider.");
  const all = await ctx.store.list("pg_budgets");
  const prior = all.find((b) => b.scope === input.scope && b.orgId === input.orgId && b.marketId === input.marketId && b.provider === input.provider);
  const doc = {
    scope: input.scope,
      orgId: input.orgId,
    marketId: input.marketId,
    provider: input.provider,
    monthlyLimitUsd: input.monthlyLimitUsd,
    maxPaidCallsPerRun: clampInt(input.maxPaidCallsPerRun ?? prior?.maxPaidCallsPerRun ?? 50, 0, 10_000),
    maxCompaniesPerJob: clampInt(input.maxCompaniesPerJob ?? prior?.maxCompaniesPerJob ?? DEFAULT_MAX_COMPANIES, 1, 5_000),
    maxLeadsExportedPerRun: clampInt(input.maxLeadsExportedPerRun ?? prior?.maxLeadsExportedPerRun ?? 50, 0, 1_000),
    maxProviderRetries: clampInt(input.maxProviderRetries ?? prior?.maxProviderRetries ?? 1, 0, 5),
    onLimit: input.onLimit ?? prior?.onLimit ?? "approval",
    reservedMonth: prior?.reservedMonth,
    reservedUsd: prior?.reservedUsd,
  };
  const tx = ctx.store.tx();
  const row = prior ? tx.patch("pg_budgets", prior, doc) : tx.insert("pg_budgets", doc);
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.budget.set", orgId: input.orgId, targetType: "prospecting_budget", targetId: row.id, correlationId: correlationId(), detail: `${input.scope} $${input.monthlyLimitUsd}/mo` });
  await tx.commit();
  return row;
}

const clampInt = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

export interface CostSummary {
  monthUsd: number;
  byProvider: { provider: string; usd: number; calls: number; failed: number }[];
  byOrg: { orgId: string; usd: number }[];
  paidCalls: number;
  freeCalls: number;
}

export async function costSummary(store: ProspectGraphStore, now: Date, orgId?: string): Promise<CostSummary> {
  const m = monthOf(now);
  const events = (await store.list("pg_cost_events")).filter((e) => e.createdAt.slice(0, 7) === m && (!orgId || e.orgId === orgId));
  const byP = new Map<string, { usd: number; calls: number; failed: number }>();
  const byO = new Map<string, number>();
  for (const e of events) {
    const x = byP.get(e.provider) ?? { usd: 0, calls: 0, failed: 0 };
    x.usd += e.costUsd;
    x.calls += 1;
    if (!e.success) x.failed += 1;
    byP.set(e.provider, x);
    if (e.orgId) byO.set(e.orgId, (byO.get(e.orgId) ?? 0) + e.costUsd);
  }
  return {
    monthUsd: round(events.reduce((s, e) => s + e.costUsd, 0)),
    byProvider: [...byP.entries()].map(([provider, v]) => ({ provider, usd: round(v.usd), calls: v.calls, failed: v.failed })),
    byOrg: [...byO.entries()].map(([o, usd]) => ({ orgId: o, usd: round(usd) })),
    paidCalls: events.filter((e) => e.costUsd > 0).length,
    freeCalls: events.filter((e) => e.costUsd === 0).length,
  };
}
