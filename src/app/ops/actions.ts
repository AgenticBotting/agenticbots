"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { repo, resetDemoData } from "@/server/db";
import { requireActor, PREVIEW_COOKIE } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { destroySession } from "@/server/auth/session";
import { act, centsFrom, opt, str, type ActionState } from "@/server/actions/wrap";
import { invalid, notFound } from "@/server/errors";
import { Tx } from "@/server/db/repository";
import { correlationId } from "@/server/ids";
import { isDemo } from "@/server/env";
import * as clients from "@/server/services/clients";
import * as bots from "@/server/services/bots";
import * as runs from "@/server/services/runs";
import * as requests from "@/server/services/requests";
import * as approvals from "@/server/services/approvals";
import * as automations from "@/server/services/automations";
import * as integrations from "@/server/services/integrations";
import * as incidents from "@/server/services/incidents";
import * as notes from "@/server/services/notes";
import * as accounts from "@/server/services/accounts";
import * as billing from "@/server/billing/service";
import { refreshRuntimeHealth } from "@/server/services/monitoring";
import { audit, refOf } from "@/server/services/common";
import type { NoteTarget, PaymentMethod, RequestStatus, SuspensionReason } from "@/lib/platform/types";
import type { IntegrationKey } from "@/config/bot-catalog";
import { money } from "@/lib/platform/format";

type A = (prev: ActionState, f: FormData) => Promise<ActionState>;

/* ───────────────────────────── Clients ───────────────────────────── */

export const createClientAction: A = async (_p, f) =>
  act(async () => {
    const actor = await requireActor();
    const org = await accounts.createClientOrg(await repo(), actor, {
      name: str(f, "name"),
      industry: opt(f, "industry"),
      website: opt(f, "website"),
      primaryContactName: opt(f, "contactName"),
      primaryContactEmail: opt(f, "contactEmail"),
      instanceType: opt(f, "instanceType"),
    });
    redirect(`/ops/clients/${org.id}`);
  });

export const suspendClientAction: A = async (_p, f) =>
  act(async () => {
    const res = await clients.suspendClient(await repo(), await requireActor(), str(f, "orgId"), str(f, "reason") as SuspensionReason, opt(f, "note"));
    return { ok: res.ok, message: res.message };
  });

export const reactivateClientAction: A = async (_p, f) =>
  act(async () => {
    const res = await clients.reactivateClient(await repo(), await requireActor(), str(f, "orgId"));
    return { ok: res.ok, message: res.message };
  });

export const setHoldAction: A = async (_p, f) =>
  act(async () => {
    const hold = str(f, "hold") as "manual" | "security" | "billing";
    const on = str(f, "on") === "true";
    await clients.setHold(await repo(), await requireActor(), str(f, "orgId"), hold, on);
    return `${hold.charAt(0).toUpperCase() + hold.slice(1)} hold ${on ? "added" : "removed"}.`;
  });

export const restartRuntimeAction: A = async (_p, f) =>
  act(async () => (await clients.restartRuntime(await repo(), await requireActor(), str(f, "runtimeId"))).message);

export const refreshHealthAction: A = async (_p, f) =>
  act(async () => {
    const actor = await requireActor();
    const r = await repo();
    const rt = await r.get("runtimes", str(f, "runtimeId"));
    if (!rt || !can(actor, "ops.runtime.control", rt.orgId)) throw notFound("Runtime");
    const next = await refreshRuntimeHealth(r, rt.id, refOf(actor));
    return `Health: ${next.health}${next.ready ? ", ready" : ""}.`;
  });

export const updateClientAction: A = async (_p, f) =>
  act(async () => {
    await clients.updateClientProfile(await repo(), await requireActor(), str(f, "orgId"), {
      name: opt(f, "name"), industry: opt(f, "industry"), website: opt(f, "website"),
      primaryContactName: opt(f, "contactName"), primaryContactEmail: opt(f, "contactEmail"), timezone: opt(f, "timezone"),
    });
    return "Saved.";
  });

/** "Open Client Portal View": read-only preview of exactly what the client sees. */
export async function openPortalPreview(orgId: string) {
  const actor = await requireActor();
  if (!can(actor, "ops.view", orgId)) throw notFound();
  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, orgId, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 3600 });
  redirect("/portal");
}

export async function exitPortalPreview() {
  (await cookies()).delete(PREVIEW_COOKIE);
  redirect("/ops/clients");
}

/* ─────────────────────────────── Bots ────────────────────────────── */

export const provisionBotAction: A = async (_p, f) =>
  act(async () => {
    const bot = await bots.provisionBot(await repo(), await requireActor(), str(f, "orgId"), str(f, "typeKey"));
    return bot.status === "active" ? `${bot.name} deployed and healthy.` : `${bot.name} created, but the health check failed — see the Bot.`;
  });

export const setBotEnabledAction: A = async (_p, f) =>
  act(async () => {
    const enabled = str(f, "enabled") === "true";
    const b = await bots.setBotEnabled(await repo(), await requireActor(), str(f, "botId"), enabled);
    return `${b.name} ${enabled ? "enabled" : "disabled"}.`;
  });

export const runBotAction: A = async (_p, f) =>
  act(async () => {
    const run = await runs.startRun(await repo(), await requireActor(), {
      botId: str(f, "botId"),
      task: str(f, "task"),
      idempotencyKey: str(f, "idempotencyKey"),
      requestId: opt(f, "requestId"),
    });
    if (run.status === "failed") return { ok: false, message: `The run could not start: ${run.failureReason ?? "runtime unavailable"}.` };
    redirect(`/ops/runs/${run.id}`);
  });

export const changeModelAction: A = async (_p, f) =>
  act(async () => {
    const [provider, model] = str(f, "model").split("::");
    const [fallbackProvider, fallbackModel] = (opt(f, "fallback") ?? "").split("::");
    await bots.changeModel(await repo(), await requireActor(), str(f, "botId"), {
      provider, model,
      fallbackProvider: fallbackProvider || undefined, fallbackModel: fallbackModel || undefined,
      reasoning: (opt(f, "reasoning") as "low" | "medium" | "high" | undefined) ?? undefined,
    });
    return "Model settings saved. New runs use them immediately.";
  });

export const assignSkillAction: A = async (_p, f) =>
  act(async () => {
    await bots.assignSkill(await repo(), await requireActor(), str(f, "botId"), str(f, "skillKey"));
    return "Skill assigned and pushed to the runtime.";
  });

export const removeSkillAction: A = async (_p, f) =>
  act(async () => {
    await bots.removeSkill(await repo(), await requireActor(), str(f, "botId"), str(f, "skillKey"));
    return "Skill removed.";
  });

export const setIntegrationAccessAction: A = async (_p, f) =>
  act(async () => {
    await bots.setIntegrationAccess(await repo(), await requireActor(), str(f, "botId"), f.getAll("integrationIds").map(String));
    return "Integration access saved.";
  });

export const setInstructionsAction: A = async (_p, f) =>
  act(async () => {
    await bots.setInstructions(await repo(), await requireActor(), str(f, "botId"), str(f, "instructions"));
    return "Instructions saved.";
  });

export const createConversationAction: A = async (_p, f) =>
  act(async () => {
    const actor = await requireActor();
    const r = await repo();
    const c = await bots.createConversation(r, actor, str(f, "botId"), str(f, "title") || "Operator test");
    const run = await runs.startRun(r, actor, { botId: c.botId, task: str(f, "message"), conversationId: c.id, idempotencyKey: `conv-${c.id}` });
    redirect(`/ops/runs/${run.id}`);
  });

/* ─────────────────────────────── Runs ────────────────────────────── */

export const stopRunAction: A = async (_p, f) =>
  act(async () => {
    const run = await runs.stopRun(await repo(), await requireActor(), str(f, "runId"));
    return run.status === "cancelled" ? "Run stopped." : "Stop requested — the run ends at the next safe point.";
  });

export const retryRunAction: A = async (_p, f) =>
  act(async () => {
    const run = await runs.retryRun(await repo(), await requireActor(), str(f, "runId"));
    redirect(`/ops/runs/${run.id}`);
  });

export const syncRunAction: A = async (_p, f) =>
  act(async () => {
    const actor = await requireActor();
    const r = await repo();
    const run = await r.get("runs", str(f, "runId"));
    if (!run || !can(actor, "ops.view", run.orgId)) throw notFound("Run");
    const next = await runs.syncRun(r, run.id);
    return `Status: ${next.status.replace(/_/g, " ")}.`;
  });

export const runNotesAction: A = async (_p, f) =>
  act(async () => {
    await runs.setRunNotes(await repo(), await requireActor(), str(f, "runId"), str(f, "notes"));
    return "Notes saved.";
  });

/* ───────────────────────────── Requests ──────────────────────────── */

export const updateRequestAction: A = async (_p, f) =>
  act(async () => {
    const operatorId = f.has("assignedOperatorId") ? str(f, "assignedOperatorId") : undefined;
    await requests.updateRequest(await repo(), await requireActor(), str(f, "requestId"), {
      status: (opt(f, "status") as RequestStatus | undefined) ?? undefined,
      assignedOperatorId: operatorId === undefined ? undefined : operatorId || null,
      assignedBotIds: f.has("assignedBotIds") ? f.getAll("assignedBotIds").map(String) : undefined,
      deliverable: opt(f, "deliverableLabel") ? { label: str(f, "deliverableLabel"), url: opt(f, "deliverableUrl") } : undefined,
      clarification: opt(f, "clarification"),
    });
    return "Request updated.";
  });

export const requestRunAction: A = async (_p, f) =>
  act(async () => {
    const run = await requests.startRunForRequest(await repo(), await requireActor(), str(f, "requestId"), str(f, "botId"), str(f, "task"), str(f, "idempotencyKey"));
    redirect(`/ops/runs/${run.id}`);
  });

export const requestMessageAction: A = async (_p, f) =>
  act(async () => {
    await requests.addMessage(await repo(), await requireActor(), str(f, "requestId"), str(f, "text"));
    return "Reply sent to the client.";
  });

/* ───────────────────────────── Approvals ─────────────────────────── */

export const resolveApprovalAction: A = async (_p, f) =>
  act(async () => {
    const decision = str(f, "decision") === "approve" ? "approve" : "deny";
    await approvals.resolveApproval(await repo(), await requireActor(), str(f, "approvalId"), decision, opt(f, "note"));
    return decision === "approve" ? "Approved." : "Declined.";
  });

export const createApprovalAction: A = async (_p, f) =>
  act(async () => {
    await approvals.createDeliverableApproval(await repo(), await requireActor(), {
      orgId: str(f, "orgId"),
      botId: str(f, "botId"),
      category: str(f, "category") as "external_send",
      title: str(f, "title"),
      explanation: str(f, "explanation"),
      expectedImpact: str(f, "expectedImpact"),
      risk: (str(f, "risk") || "low") as "low",
      preview: opt(f, "preview"),
      requestId: opt(f, "requestId"),
      audience: (opt(f, "audience") as "client" | "operator" | undefined) ?? "client",
    });
    return "Approval sent to the client.";
  });

/* ──────────────────────────── Automations ────────────────────────── */

export const createAutomationAction: A = async (_p, f) =>
  act(async () => {
    const r = await repo();
    const bot = await r.get("bots", str(f, "botId"));
    if (!bot) throw notFound("Bot");
    await automations.createAutomation(r, await requireActor(), {
      orgId: bot.orgId, botId: bot.id, name: str(f, "name"), prompt: str(f, "prompt"), schedule: str(f, "schedule"),
    });
    return "Automation created.";
  });

export const automationAction: A = async (_p, f) =>
  act(async () => {
    const op = str(f, "op") as "pause" | "resume" | "run" | "delete";
    if (!["pause", "resume", "run", "delete"].includes(op)) throw invalid("Unknown action.");
    await automations.automationAction(await repo(), await requireActor(), str(f, "jobId"), op);
    return { pause: "Paused.", resume: "Resumed.", run: "Started — results appear in Runs.", delete: "Deleted." }[op];
  });

export const updateAutomationAction: A = async (_p, f) =>
  act(async () => {
    await automations.updateAutomation(await repo(), await requireActor(), str(f, "jobId"), {
      name: opt(f, "name"), prompt: opt(f, "prompt"), schedule: opt(f, "schedule"), botId: opt(f, "botId"),
    });
    return "Automation updated.";
  });

/* ──────────────────────────── Integrations ───────────────────────── */

export const createIntegrationAction: A = async (_p, f) =>
  act(async () => {
    const meta: Record<string, string> = {};
    const toolset = opt(f, "toolset");
    if (toolset) meta.toolset = toolset;
    await integrations.createIntegration(await repo(), await requireActor(), {
      orgId: str(f, "orgId"), provider: str(f, "provider") as IntegrationKey, displayName: opt(f, "displayName"), secretRef: opt(f, "secretRef"), metadata: meta,
    });
    return "Integration added. It shows as connected only after a check or your verification.";
  });

export const checkIntegrationAction: A = async (_p, f) =>
  act(async () => {
    const i = await integrations.checkIntegration(await repo(), await requireActor(), str(f, "integrationId"));
    return `${i.displayName}: ${i.status.replace(/_/g, " ")}${i.lastError ? ` — ${i.lastError}` : ""}`;
  });

export const setIntegrationStatusAction: A = async (_p, f) =>
  act(async () => {
    await integrations.setIntegrationStatusManually(await repo(), await requireActor(), str(f, "integrationId"), str(f, "status") as "connected", str(f, "evidence"));
    return "Status recorded.";
  });

export const disconnectIntegrationAction: A = async (_p, f) =>
  act(async () => {
    await integrations.disconnectIntegration(await repo(), await requireActor(), str(f, "integrationId"));
    return "Disconnected. Bots no longer have access.";
  });

/* ──────────────────────── Incidents & notes ──────────────────────── */

export const incidentStatusAction: A = async (_p, f) =>
  act(async () => {
    await incidents.setIncidentStatus(await repo(), await requireActor(), str(f, "incidentId"), str(f, "status") as "resolved", correlationId());
    return "Incident updated.";
  });

export const addNoteAction: A = async (_p, f) =>
  act(async () => {
    await notes.addNote(await repo(), await requireActor(), {
      orgId: str(f, "orgId"), targetType: str(f, "targetType") as NoteTarget, targetId: str(f, "targetId"), text: str(f, "text"),
    });
    return "Note added.";
  });

/* ───────────────────────────── Billing ───────────────────────────── */

export const createAgreementAction: A = async (_p, f) =>
  act(async () => {
    const monthly = centsFrom(f, "monthlyValue");
    await billing.createAgreement(await repo(), await requireActor(), str(f, "orgId"), {
      name: str(f, "name"),
      monthlyValueCents: monthly,
      implementationFeeCents: centsFrom(f, "implementationFee"),
      setupFeeCents: centsFrom(f, "setupFee"),
      billingFrequency: (opt(f, "billingFrequency") as "monthly") ?? "monthly",
      paymentTermsDays: Number(str(f, "paymentTermsDays") || "5"),
      preferredPaymentMethod: (opt(f, "preferredPaymentMethod") as PaymentMethod) ?? "ach",
      startDate: str(f, "startDate"),
      renewalDate: opt(f, "renewalDate"),
      gracePeriodDays: Number(str(f, "gracePeriodDays") || "7"),
      autoSuspendEnabled: f.get("autoSuspendEnabled") === "on",
      autoReactivateOnPayment: f.get("autoReactivateOnPayment") === "on",
      notes: opt(f, "notes"),
    });
    return `Service agreement created at ${money(monthly)}/month.`;
  }, "/ops");

export const updateAgreementAction: A = async (_p, f) =>
  act(async () => {
    await billing.updateAgreement(await repo(), await requireActor(), str(f, "agreementId"), {
      status: opt(f, "status") as "active" | undefined,
      gracePeriodDays: f.has("gracePeriodDays") ? Number(str(f, "gracePeriodDays")) : undefined,
      autoSuspendEnabled: f.has("autoFlags") ? f.get("autoSuspendEnabled") === "on" : undefined,
      autoReactivateOnPayment: f.has("autoFlags") ? f.get("autoReactivateOnPayment") === "on" : undefined,
      monthlyValueCents: opt(f, "monthlyValue") ? centsFrom(f, "monthlyValue") : undefined,
      notes: f.has("notes") ? str(f, "notes") : undefined,
    });
    return "Agreement updated.";
  });

export const createInvoiceAction: A = async (_p, f) =>
  act(async () => {
    const lines: { description: string; quantity: number; unitCents: number; kind: "custom" | "usage" }[] = [];
    for (let i = 0; i < 4; i++) {
      const d = opt(f, `line${i}Desc`);
      if (!d) continue;
      lines.push({ description: d, quantity: 1, unitCents: centsFrom(f, `line${i}Amount`), kind: "custom" });
    }
    const inv = await billing.createInvoice(await repo(), await requireActor(), str(f, "orgId"), {
      serviceAgreementId: opt(f, "serviceAgreementId"),
      issueDate: opt(f, "issueDate"),
      dueDate: opt(f, "dueDate"),
      includeRecurring: f.get("includeRecurring") === "on",
      includeImplementationFee: f.get("includeImplementationFee") === "on",
      includeSetupFee: f.get("includeSetupFee") === "on",
      lineItems: lines,
      notes: opt(f, "notes"),
    });
    redirect(`/ops/billing/invoices/${inv.id}`);
  });

export const sendInvoiceAction: A = async (_p, f) =>
  act(async () => (await billing.markInvoiceSent(await repo(), await requireActor(), str(f, "invoiceId"))).note);

export const voidInvoiceAction: A = async (_p, f) =>
  act(async () => {
    await billing.voidInvoice(await repo(), await requireActor(), str(f, "invoiceId"), str(f, "reason"));
    return "Invoice voided. It stays in the history.";
  });

export const markPastDueAction: A = async (_p, f) =>
  act(async () => {
    await billing.markPastDue(await repo(), await requireActor(), str(f, "invoiceId"));
    return "Marked past due.";
  });

export const recordPaymentAction: A = async (_p, f) =>
  act(async () => {
    const res = await billing.recordPayment(await repo(), await requireActor(), {
      invoiceId: str(f, "invoiceId"),
      amountCents: centsFrom(f, "amount"),
      dateReceived: str(f, "dateReceived"),
      method: str(f, "method") as PaymentMethod,
      referenceNumber: opt(f, "referenceNumber"),
      operatorNotes: opt(f, "operatorNotes"),
    });
    const base = `${money(res.payment.amountCents, { exact: true })} recorded. Balance ${money(res.invoice.balanceDueCents, { exact: true })}.`;
    return res.eligibleForReactivation ? `${base} Payment received — client eligible for reactivation.` : base;
  });

export const reversePaymentAction: A = async (_p, f) =>
  act(async () => {
    await billing.reversePayment(await repo(), await requireActor(), str(f, "paymentId"), str(f, "reason"));
    return "Payment reversed. The original stays in the history.";
  });

/* ──────────────────────── Users, providers, demo ─────────────────── */

export const inviteUserAction: A = async (_p, f) =>
  act(async () => {
    const res = await accounts.inviteUser(await repo(), await requireActor(), {
      email: str(f, "email"),
      name: str(f, "name"),
      platformRole: (opt(f, "platformRole") as "operator" | "superadmin" | undefined) ?? undefined,
      orgId: opt(f, "orgId"),
      clientRole: (opt(f, "clientRole") as "client_admin" | "client_member" | undefined) ?? undefined,
    });
    return { ok: true, message: `Invitation created for ${res.user.email}. Send them this one-time link (valid 7 days):`, link: res.setPasswordPath };
  });

export const setUserStatusAction: A = async (_p, f) =>
  act(async () => {
    await accounts.setUserStatus(await repo(), await requireActor(), str(f, "userId"), str(f, "status") as "active" | "disabled");
    return "User updated.";
  });

export const upsertProviderAction: A = async (_p, f) =>
  act(async () => {
    const actor = await requireActor();
    if (!can(actor, "ops.models.manage")) throw notFound();
    const r = await repo();
    const provider = str(f, "provider").toLowerCase();
    if (!/^[a-z0-9_-]{2,40}$/.test(provider)) throw invalid("Provider key: lowercase letters, numbers, - or _.");
    const modelId = str(f, "modelId");
    if (!/^[A-Za-z0-9_.:/-]{2,80}$/.test(modelId)) throw invalid("Enter the model id exactly as the provider names it.");
    const model = {
      id: modelId,
      label: str(f, "modelLabel") || modelId,
      inputPerM: Number(str(f, "inputPerM")),
      outputPerM: Number(str(f, "outputPerM")),
      cacheReadPerM: opt(f, "cacheReadPerM") ? Number(str(f, "cacheReadPerM")) : undefined,
    };
    if (!(model.inputPerM >= 0) || !(model.outputPerM >= 0)) throw invalid("Rates must be numbers (USD per million tokens).");
    const existing = (await r.list("provider_configurations")).find((p) => p.provider === provider);
    const tx = new Tx(r);
    if (existing) {
      tx.patch("provider_configurations", existing, { models: [...existing.models.filter((m) => m.id !== model.id), model] });
    } else {
      tx.insert("provider_configurations", { provider, displayName: str(f, "displayName") || provider, status: "unknown", models: [model] });
    }
    audit(tx, actor, { action: "provider.upsert", targetType: "provider", targetId: provider, correlationId: correlationId(), detail: model.id });
    await tx.commit();
    return "Provider saved.";
  });

export const resetDemoAction: A = async () =>
  act(async () => {
    const actor = await requireActor();
    if (!isDemo() || !can(actor, "ops.view")) throw notFound();
    await resetDemoData();
    return "Demo data reset.";
  });

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
