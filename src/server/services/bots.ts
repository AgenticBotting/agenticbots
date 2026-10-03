import "server-only";
import type { Bot, Conversation } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { awsControl, waitForCommand } from "@/server/aws/control";
import { botRuntime } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/runtime-errors";
import { conflict, invalid, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { botTypeOrThrow, isBotTypeKey } from "@/config/bot-catalog";
import { getSkill, skillAllowedFor } from "@/config/skills";
import { assertExecutable, audit, getOrgFor, getScoped } from "./common";
import { isDemo } from "@/server/env";

async function lifecycleForBot(r: Repository, bot: Bot, action: "park-bot" | "unpark-bot" | "deploy-bot") {
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (!runtime) throw notFound("Runtime");
  if (!runtime.instanceId && runtime.provider !== "demo" && !isDemo()) {
    throw conflict("This client's runtime is not provisioned yet.");
  }
  return awsControl().runLifecycle(runtime.id, runtime.instanceId ?? "demo", action, { profile: bot.runtimeProfile });
}

/**
 * Disabling a Bot parks its runtime profile (the engine's native
 * per-profile stop: a `gateway.parked` marker the host honours). Sessions,
 * memory, skills and scheduled work are preserved; enabling unparks it.
 */
export async function setBotEnabled(r: Repository, actor: Actor, botId: string, enabled: boolean): Promise<Bot> {
  const bot = await getScoped(r, "bots", botId, actor, "ops.bots.manage");
  if (enabled && bot.status !== "disabled") return bot;
  if (!enabled && bot.status === "disabled") return bot;
  if (enabled) assertExecutable(await getOrgFor(r, bot.orgId, actor, "ops.bots.manage"));
  const correlationId = newCorrelationId();
  const cmd = await lifecycleForBot(r, bot, enabled ? "unpark-bot" : "park-bot");
  const tx = new Tx(r);
  const next = tx.patch("bots", bot, { status: enabled ? "active" : "disabled", errorState: undefined });
  audit(tx, actor, {
    action: enabled ? "bot.enable" : "bot.disable",
    orgId: bot.orgId,
    targetType: "bot",
    targetId: bot.id,
    correlationId,
    detail: `lifecycle command ${cmd.commandId}`,
  });
  await tx.commit();
  return next;
}

export async function changeModel(
  r: Repository,
  actor: Actor,
  botId: string,
  input: { provider: string; model: string; fallbackProvider?: string; fallbackModel?: string; reasoning?: Bot["reasoning"] },
): Promise<Bot> {
  const bot = await getScoped(r, "bots", botId, actor, "ops.models.manage");
  const providers = await r.list("provider_configurations");
  const p = providers.find((x) => x.provider === input.provider);
  if (!p) throw invalid("Unknown provider. Add it under Settings → Providers first.");
  if (!p.models.some((m) => m.id === input.model)) throw invalid("That model is not configured for this provider.");
  if (input.fallbackProvider) {
    const fp = providers.find((x) => x.provider === input.fallbackProvider);
    if (!fp || (input.fallbackModel && !fp.models.some((m) => m.id === input.fallbackModel))) throw invalid("Unknown fallback model.");
  }
  if (input.reasoning && !["low", "medium", "high"].includes(input.reasoning)) throw invalid("Invalid reasoning level.");
  const tx = new Tx(r);
  const next = tx.patch("bots", bot, {
    provider: input.provider,
    model: input.model,
    fallbackProvider: input.fallbackProvider || undefined,
    fallbackModel: input.fallbackModel || undefined,
    reasoning: input.reasoning,
  });
  audit(tx, actor, {
    action: bot.provider !== input.provider ? "bot.change_provider" : "bot.change_model",
    orgId: bot.orgId,
    targetType: "bot",
    targetId: bot.id,
    correlationId: newCorrelationId(),
    detail: `${bot.provider}/${bot.model} → ${input.provider}/${input.model}`,
  });
  await tx.commit();
  return next;
}

export async function assignSkill(r: Repository, actor: Actor, botId: string, skillKey: string) {
  const bot = await getScoped(r, "bots", botId, actor, "ops.skills.manage");
  const skill = getSkill(skillKey);
  if (!skill) throw invalid("Unknown skill.");
  if (!skillAllowedFor(skillKey, bot.typeKey)) throw invalid(`${skill.name} is not permitted for this Bot type.`);
  const current = (await r.list("skill_assignments", { orgId: bot.orgId, where: { botId: bot.id, skillKey } })).find((s) => !s.removedAt);
  if (current) return current;
  const tx = new Tx(r);
  const a = tx.insert("skill_assignments", { orgId: bot.orgId, botId: bot.id, skillKey, skillVersion: skill.version, assignedBy: actor.user.id });
  audit(tx, actor, { action: "bot.assign_skill", orgId: bot.orgId, targetType: "bot", targetId: bot.id, correlationId: newCorrelationId(), detail: `${skillKey}@${skill.version}` });
  await tx.commit();
  // Push the updated skill set to the runtime profile.
  await lifecycleForBot(r, bot, "deploy-bot").catch(() => undefined);
  return a;
}

export async function removeSkill(r: Repository, actor: Actor, botId: string, skillKey: string) {
  const bot = await getScoped(r, "bots", botId, actor, "ops.skills.manage");
  const current = (await r.list("skill_assignments", { orgId: bot.orgId, where: { botId: bot.id, skillKey } })).find((s) => !s.removedAt);
  if (!current) return;
  const tx = new Tx(r);
  tx.patch("skill_assignments", current, { removedAt: nowIso() });
  audit(tx, actor, { action: "bot.remove_skill", orgId: bot.orgId, targetType: "bot", targetId: bot.id, correlationId: newCorrelationId(), detail: skillKey });
  await tx.commit();
  await lifecycleForBot(r, bot, "deploy-bot").catch(() => undefined);
}

export async function setIntegrationAccess(r: Repository, actor: Actor, botId: string, integrationIds: string[]): Promise<Bot> {
  const bot = await getScoped(r, "bots", botId, actor, "ops.integrations.manage");
  const integrations = await r.list("integrations", { orgId: bot.orgId });
  const type = botTypeOrThrow(bot.typeKey);
  for (const id of integrationIds) {
    const i = integrations.find((x) => x.id === id);
    if (!i) throw invalid("Unknown integration for this client.");
    if (!type.allowedIntegrations.includes(i.provider) && i.provider !== "mcp_server" && i.provider !== "rest_api") {
      throw invalid(`${i.displayName} is not permitted for ${type.displayName}.`);
    }
  }
  const tx = new Tx(r);
  const next = tx.patch("bots", bot, { integrationIds });
  for (const i of integrations) {
    const allowed = integrationIds.includes(i.id);
    const has = i.botIds.includes(bot.id);
    if (allowed !== has) {
      tx.patch("integrations", i, { botIds: allowed ? [...i.botIds, bot.id] : i.botIds.filter((b) => b !== bot.id) });
    }
  }
  audit(tx, actor, { action: "bot.integration_access", orgId: bot.orgId, targetType: "bot", targetId: bot.id, correlationId: newCorrelationId(), detail: `${integrationIds.length} integrations` });
  await tx.commit();
  return next;
}

export async function setInstructions(r: Repository, actor: Actor, botId: string, instructions: string): Promise<Bot> {
  const bot = await getScoped(r, "bots", botId, actor, "ops.bots.manage");
  const tx = new Tx(r);
  const next = tx.patch("bots", bot, { instructions: redactSecrets(instructions, 8000) });
  audit(tx, actor, { action: "bot.instructions", orgId: bot.orgId, targetType: "bot", targetId: bot.id, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}

/**
 * Deploy a Bot to a client from its catalog template: database instance,
 * runtime profile + its own key (created on the instance, stored in
 * Secrets Manager under the tenant path), default skills, approved
 * integrations, health validation, audit.
 */
export async function provisionBot(r: Repository, actor: Actor, orgId: string, typeKey: string): Promise<Bot> {
  const org = await getOrgFor(r, orgId, actor, "ops.provisioning");
  assertExecutable(org);
  if (!isBotTypeKey(typeKey)) throw invalid("Unknown Bot type.");
  const type = botTypeOrThrow(typeKey);
  const existing = (await r.list("bots", { orgId })).find((b) => b.typeKey === typeKey);
  if (existing) throw conflict(`${org.name} already has ${type.displayName}.`);
  const runtime = (await r.list("runtimes", { orgId }))[0];
  if (!runtime) throw conflict("Provision this client's runtime first.");
  const providers = await r.list("provider_configurations");
  const defaultProvider = providers[0];
  if (!defaultProvider || defaultProvider.models.length === 0) throw conflict("Configure a model provider in Settings first.");
  const correlationId = newCorrelationId();
  const env = org.environment === "production" ? "prod" : org.environment;

  const tx = new Tx(r);
  let bot = tx.insert("bots", {
    orgId,
    typeKey,
    name: type.displayName,
    status: "provisioning",
    runtimeId: runtime.id,
    runtimeProfile: type.runtimeProfile,
    provider: defaultProvider.provider,
    model: defaultProvider.models[0].id,
    capabilities: type.defaultCapabilities,
    integrationIds: [],
    credentialRef: `agenticbots/${env}/tenants/${org.tenantId}/profiles/${type.runtimeProfile}`,
    credentialStatus: "unknown",
  });
  for (const key of type.defaultSkills) {
    const s = getSkill(key);
    if (s) tx.insert("skill_assignments", { orgId, botId: bot.id, skillKey: key, skillVersion: s.version, assignedBy: actor.user.id });
  }
  tx.insert("deployment_events", {
    orgId, runtimeId: runtime.id, kind: "deploy_bot", status: "started",
    detail: `${type.displayName} (${type.runtimeProfile})`, actorId: actor.user.id, correlationId,
  });
  audit(tx, actor, { action: "bot.provision", orgId, targetType: "bot", targetId: bot.id, correlationId, detail: type.displayName });
  await tx.commit();

  try {
    const aws = awsControl();
    const instanceId = runtime.instanceId ?? "demo";
    const cmd = await waitForCommand(aws, await aws.runLifecycle(runtime.id, instanceId, "deploy-bot", { profile: type.runtimeProfile }), instanceId);
    if (cmd.status !== "success") {
      throw new Error(`deploy-bot ${cmd.status}${cmd.output ? `: ${cmd.output.slice(-300)}` : ""}`);
    }
    // Health validation: the new Bot must answer with its own credentials.
    // The engine may still be reloading for a few seconds.
    const rt = botRuntime(runtime, bot);
    for (let attempt = 1; ; attempt++) {
      try {
        await rt.getBot();
        break;
      } catch (e) {
        if (attempt >= 6) throw e;
        await new Promise((res) => setTimeout(res, isDemo() ? 0 : 10_000));
      }
    }
    const tx2 = new Tx(r);
    bot = tx2.patch("bots", bot, { status: "active", credentialStatus: "present" });
    tx2.insert("deployment_events", {
      orgId, runtimeId: runtime.id, kind: "deploy_bot", status: "succeeded",
      detail: `${type.displayName} healthy`, actorId: actor.user.id, correlationId,
    });
    await tx2.commit();
  } catch (e) {
    const s = sanitizeRuntimeError(e, correlationId);
    const tx2 = new Tx(r);
    bot = tx2.patch("bots", bot, { status: "degraded", errorState: { code: s.code, message: s.operator, at: nowIso(), correlationId } });
    tx2.insert("deployment_events", {
      orgId, runtimeId: runtime.id, kind: "deploy_bot", status: "failed",
      detail: s.operator, actorId: actor.user.id, correlationId,
    });
    await tx2.commit();
  }
  return bot;
}

/** Operator test chat: one conversation per (operator, Bot) start. */
export async function createConversation(r: Repository, actor: Actor, botId: string, title: string): Promise<Conversation> {
  const bot = await getScoped(r, "bots", botId, actor, "ops.runs.control");
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (!runtime) throw notFound("Runtime");
  const conv = await botRuntime(runtime, bot).createConversation(title || "Operator test");
  const tx = new Tx(r);
  const c = tx.insert("conversations", {
    orgId: bot.orgId,
    botId: bot.id,
    userId: actor.user.id,
    title: title || "Operator test",
    runtimeSessionId: conv.runtimeConversationId,
  });
  audit(tx, actor, { action: "conversation.create", orgId: bot.orgId, targetType: "conversation", targetId: c.id, correlationId: newCorrelationId() });
  await tx.commit();
  return c;
}

/** Operator-only technical view of a Bot inside its runtime. */
export async function runtimeDetails(r: Repository, actor: Actor, botId: string) {
  const bot = await getScoped(r, "bots", botId, actor, "ops.view");
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (!runtime) throw notFound("Runtime");
  const rt = botRuntime(runtime, bot);
  const engine = rt.providerLabel;
  const correlationId = newCorrelationId();
  try {
    const [caps, skills, toolsets, botInfo] = await Promise.all([
      rt.getBotCapabilities(),
      rt.listBotSkills().catch(() => []),
      rt.listBotToolsets().catch(() => []),
      rt.getBot().catch(() => undefined),
    ]);
    return { ok: true as const, engine, profile: bot.runtimeProfile, caps, skills, toolsets, runtimeStatus: botInfo?.status ?? ("offline" as const), reachable: !!botInfo };
  } catch (e) {
    const s = sanitizeRuntimeError(e, correlationId);
    return { ok: false as const, engine, profile: bot.runtimeProfile, error: s.operator, correlationId };
  }
}
