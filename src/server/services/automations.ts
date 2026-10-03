import "server-only";
import type { AutomationJob } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { adapterFor, resolveTarget } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/errors";
import { conflict, invalid, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { assertExecutable, audit, getOrgFor, getScoped } from "./common";
import { raiseIncident } from "./incidents";

/** 5-field cron, or the engine's shorthand ("every 2h", "30m"). */
const CRON = /^(\S+\s+){4}\S+$/;
const SHORTHAND = /^(every\s+)?\d+\s*(m|h|d|min|mins|minutes|hours|days)$/i;

export function validateSchedule(s: string): string {
  const v = s.trim();
  if (!CRON.test(v) && !SHORTHAND.test(v)) throw invalid('Schedule must be a cron expression ("0 7 * * 1-5") or an interval ("every 6h").');
  return v;
}

/** Turn a schedule into the plain English a client sees. Never "cron". */
export function describeSchedule(s: string): string {
  const v = s.trim();
  const m = v.match(/^(?:every\s+)?(\d+)\s*(m|min|mins|minutes|h|hours|d|days)$/i);
  if (m) {
    const unit = m[2].toLowerCase().startsWith("m") ? "minutes" : m[2].toLowerCase().startsWith("h") ? "hours" : "days";
    return `Every ${m[1]} ${unit}`;
  }
  const parts = v.split(/\s+/);
  if (parts.length === 5) {
    const [min, hour, dom, , dow] = parts;
    const time = /^\d+$/.test(hour) && /^\d+$/.test(min)
      ? new Date(Date.UTC(2000, 0, 1, Number(hour), Number(min))).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
      : null;
    const days = dow === "1-5" ? "Weekdays" : dow === "*" ? (dom === "*" ? "Daily" : `Monthly on day ${dom}`) : dow === "1" ? "Mondays" : dow === "0" || dow === "7" ? "Sundays" : "Scheduled days";
    return time ? `${days} at ${time}` : days;
  }
  return "Scheduled";
}

async function ctx(r: Repository, botId: string) {
  const bot = await r.get("bots", botId);
  if (!bot) throw notFound("Bot");
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (!runtime) throw notFound("Runtime");
  return { bot, runtime, adapter: adapterFor(runtime), target: await resolveTarget(runtime, bot) };
}

export async function createAutomation(
  r: Repository,
  actor: Actor,
  input: { orgId: string; botId: string; name: string; prompt: string; schedule: string; trigger?: AutomationJob["trigger"] },
): Promise<AutomationJob> {
  const org = await getOrgFor(r, input.orgId, actor, "ops.automations.manage");
  assertExecutable(org);
  const name = input.name.trim();
  if (!name || name.length > 120) throw invalid("Give the automation a name under 120 characters.");
  if (input.prompt.trim().length < 5) throw invalid("Describe what the Bot should do.");
  const schedule = validateSchedule(input.schedule);
  const { bot, adapter, target } = await ctx(r, input.botId);
  if (bot.orgId !== org.id) throw notFound("Bot");
  const correlationId = newCorrelationId();
  const skills = (await r.list("skill_assignments", { orgId: org.id, where: { botId: bot.id } })).filter((s) => !s.removedAt).map((s) => s.skillKey);
  let runtimeJobId: string | undefined;
  try {
    const job = await adapter.createAutomation(target, { name, prompt: input.prompt.trim(), schedule, skills });
    runtimeJobId = job.runtimeJobId;
  } catch (e) {
    throw conflict(`The runtime did not accept the automation: ${sanitizeRuntimeError(e, correlationId).operator}`);
  }
  const tx = new Tx(r);
  const job = tx.insert("automation_jobs", {
    orgId: org.id,
    botId: bot.id,
    name,
    prompt: redactSecrets(input.prompt.trim(), 4000),
    schedule,
    scheduleLabel: describeSchedule(schedule),
    status: "active",
    runtimeJobId,
    consecutiveFailures: 0,
    trigger: input.trigger ?? "schedule",
  });
  audit(tx, actor, { action: "automation.create", orgId: org.id, targetType: "automation", targetId: job.id, correlationId, detail: `${name} (${schedule})` });
  await tx.commit();
  return job;
}

type JobAction = "pause" | "resume" | "run" | "delete";

export async function automationAction(r: Repository, actor: Actor, jobId: string, action: JobAction): Promise<AutomationJob | null> {
  const job = await getScoped(r, "automation_jobs", jobId, actor, "ops.automations.manage");
  const org = await r.get("organizations", job.orgId);
  if (!org) throw notFound();
  if (action === "run" || action === "resume") assertExecutable(org);
  const { adapter, target } = await ctx(r, job.botId);
  const correlationId = newCorrelationId();
  if (job.runtimeJobId) {
    try {
      if (action === "pause") await adapter.pauseAutomation(target, job.runtimeJobId);
      if (action === "resume") await adapter.resumeAutomation(target, job.runtimeJobId);
      if (action === "run") await adapter.runAutomationNow(target, job.runtimeJobId);
      if (action === "delete") await adapter.deleteAutomation(target, job.runtimeJobId);
    } catch (e) {
      const s = sanitizeRuntimeError(e, correlationId);
      if (!(action === "delete" && s.code === "runtime_not_found")) throw conflict(`Runtime refused: ${s.operator}`);
    }
  }
  const tx = new Tx(r);
  let next: AutomationJob | null = job;
  if (action === "delete") {
    tx.delete("automation_jobs", job.id);
    next = null;
  } else if (action === "pause") next = tx.patch("automation_jobs", job, { status: "paused" });
  else if (action === "resume") next = tx.patch("automation_jobs", job, { status: "active", consecutiveFailures: 0 });
  else next = tx.patch("automation_jobs", job, { lastRunAt: nowIso() });
  audit(tx, actor, { action: `automation.${action}`, orgId: job.orgId, targetType: "automation", targetId: job.id, correlationId });
  await tx.commit();
  return next;
}

export async function updateAutomation(r: Repository, actor: Actor, jobId: string, input: { name?: string; prompt?: string; schedule?: string; botId?: string }) {
  const job = await getScoped(r, "automation_jobs", jobId, actor, "ops.automations.manage");
  const schedule = input.schedule ? validateSchedule(input.schedule) : undefined;
  if (input.botId && input.botId !== job.botId) {
    const bot = await r.get("bots", input.botId);
    if (!bot || bot.orgId !== job.orgId) throw notFound("Bot");
    // Moving a job between Bots = recreate on the new profile.
    await automationAction(r, actor, job.id, "delete");
    return createAutomation(r, actor, { orgId: job.orgId, botId: input.botId, name: input.name ?? job.name, prompt: input.prompt ?? job.prompt, schedule: schedule ?? job.schedule, trigger: job.trigger });
  }
  const { adapter, target } = await ctx(r, job.botId);
  if (job.runtimeJobId) await adapter.updateAutomation(target, job.runtimeJobId, { name: input.name, prompt: input.prompt, schedule });
  const tx = new Tx(r);
  const next = tx.patch("automation_jobs", job, {
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.prompt ? { prompt: redactSecrets(input.prompt.trim(), 4000) } : {}),
    ...(schedule ? { schedule, scheduleLabel: describeSchedule(schedule) } : {}),
  });
  audit(tx, actor, { action: "automation.update", orgId: job.orgId, targetType: "automation", targetId: job.id, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}

/** Sync job: pull last-run state from the runtime and flag failures. */
export async function syncAutomations(r: Repository, orgId: string): Promise<void> {
  const jobs = await r.list("automation_jobs", { orgId });
  const byBot = new Map<string, AutomationJob[]>();
  for (const j of jobs) byBot.set(j.botId, [...(byBot.get(j.botId) ?? []), j]);
  for (const [botId, list] of byBot) {
    let remote;
    try {
      const { adapter, target } = await ctx(r, botId);
      remote = await adapter.listAutomations(target);
    } catch {
      continue;
    }
    for (const job of list) {
      const rj = remote.find((x) => x.runtimeJobId === job.runtimeJobId);
      if (!rj) continue;
      const failed = rj.lastStatus === "failed" && rj.lastRunAt !== job.lastRunAt;
      const consecutiveFailures = failed ? job.consecutiveFailures + 1 : rj.lastStatus === "succeeded" ? 0 : job.consecutiveFailures;
      const tx = new Tx(r);
      tx.patch("automation_jobs", job, {
        lastRunAt: rj.lastRunAt,
        lastStatus: rj.lastStatus,
        nextRunAt: rj.nextRunAt,
        lastError: rj.lastError ? redactSecrets(rj.lastError, 400) : undefined,
        consecutiveFailures,
        status: job.status === "paused" ? "paused" : consecutiveFailures >= 2 ? "failing" : "active",
      });
      await tx.commit();
      if (consecutiveFailures >= 2) {
        await raiseIncident(r, {
          orgId, type: "automation_failure", severity: "medium", title: `Automation failing: ${job.name}`,
          detail: rj.lastError ?? "Last runs failed", correlationId: newCorrelationId(), target: job.id, botId,
        });
      }
    }
  }
}
