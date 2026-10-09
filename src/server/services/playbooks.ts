import "server-only";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getSkill, skillAllowedFor } from "@/config/skills";
import type { OperatingDraft } from "@/lib/platform/types";
import { compilePlaybook } from "@/lib/platform/playbooks";
import type { Actor } from "@/server/auth/policy";
import { Tx, type Repository } from "@/server/db/repository";
import { conflict, invalid, notFound } from "@/server/errors";
import { correlationId } from "@/server/ids";
import { redactSecrets } from "@/server/redact";
import { audit, getScoped } from "./common";
import { updateAutomation } from "./automations";

const shape = z.object({
  kind: z.enum(["automation", "skill", "support"]), targetId: z.string().min(1).max(180),
  title: z.string().trim().min(3).max(120), expectedVersion: z.number().int().nonnegative(),
  sourceVersion: z.number().int().positive(),
  steps: z.array(z.object({ id: z.string().regex(/^[\w-]{1,60}$/), kind: z.enum(["context", "analyze", "prepare"]), title: z.string().trim().min(3).max(100), instruction: z.string().trim().min(5).max(1800) })).min(1).max(12),
});

export async function draftTarget(r: Repository, actor: Actor, kind: OperatingDraft["kind"], targetId: string) {
  if (kind === "automation") return getScoped(r, "automation_jobs", targetId, actor, "ops.automations.manage");
  if (kind === "support") return getScoped(r, "requests", targetId, actor, "ops.requests.manage");
  const [botId, skillKey, extra] = targetId.split(":");
  const bot = await getScoped(r, "bots", botId, actor, "ops.skills.manage");
  if (extra || !getSkill(skillKey) || !skillAllowedFor(skillKey, bot.typeKey)) throw notFound("Skill");
  return bot;
}

const draftId = (kind: string, targetId: string) => `draft_${createHash("sha256").update(`${kind}:${targetId}`).digest("hex").slice(0,32)}`;
export async function loadDraft(r: Repository, actor: Actor, kind: OperatingDraft["kind"], targetId: string) {
  const target = await draftTarget(r, actor, kind, targetId);
  const draft = await r.get("operating_drafts", draftId(kind, targetId));
  if (draft && draft.orgId !== target.orgId) throw notFound();
  return { target, draft };
}

export async function saveDraft(r: Repository, actor: Actor, input: unknown) {
  const parsed = shape.safeParse(input);
  if (!parsed.success) throw invalid("Use a title and 1–12 steps, with a short title and instructions for each.");
  const data = parsed.data;
  if (new Set(data.steps.map(s => s.id)).size !== data.steps.length) throw invalid("Step identifiers must be unique.");
  const { target, draft } = await loadDraft(r, actor, data.kind, data.targetId);
  if ((draft?.version ?? 0) !== data.expectedVersion) throw conflict("This draft changed in another window. Reload before saving.");
  if (target.version !== data.sourceVersion) throw conflict("The underlying configuration changed. Reload and review your draft.");
  // Reject credential-shaped input instead of silently retaining it in prompts.
  const text = JSON.stringify({ title: data.title, steps: data.steps });
  if (redactSecrets(text, 30_000) !== text) throw invalid("Remove credentials or secrets from this draft. Use connected tools for access.");
  const tx = new Tx(r);
  const fields = { orgId: target.orgId, kind: data.kind, targetId: data.targetId, title: data.title, steps: data.steps, updatedBy: actor.user.id, sourceVersion: target.version, formatVersion: 1 as const };
  const next = draft ? tx.patch("operating_drafts", draft, fields) : tx.insert("operating_drafts", { ...fields, id: draftId(data.kind, data.targetId) });
  audit(tx, actor, { action: "playbook.draft_saved", orgId: target.orgId, targetType: data.kind, targetId: target.id, correlationId: correlationId(), detail: `Draft v${next.version}: ${data.title}` });
  await tx.commit();
  return next;
}

/** Apply only to a paused schedule, after an explicit operator confirmation. */
export async function applyAutomationDraft(r: Repository, actor: Actor, id: string, expectedVersion: number) {
  const draft = await getScoped(r, "operating_drafts", id, actor, "ops.automations.manage");
  if (draft.kind !== "automation" || draft.version !== expectedVersion) throw conflict("Reload and review the latest automation draft.");
  const job = await getScoped(r, "automation_jobs", draft.targetId, actor, "ops.automations.manage");
  if (job.status !== "paused") throw conflict("Pause this automation before applying the reviewed SOP.");
  if (job.version !== draft.sourceVersion) throw conflict("The automation changed. Save a fresh draft against its latest configuration.");
  const prompt = compilePlaybook(draft.title, draft.steps);
  if (prompt.length > 4000) throw invalid("Shorten the SOP to fit the runtime's 4,000-character instruction limit.");
  await updateAutomation(r, actor, job.id, { prompt });
}

/** Client-specific strategy overlay; base, versioned skill files stay unchanged. */
export async function applySkillDraft(r: Repository, actor: Actor, id: string, expectedVersion: number) {
  const draft = await getScoped(r, "operating_drafts", id, actor, "ops.skills.manage");
  if(draft.kind !== "skill" || draft.version !== expectedVersion) throw conflict("Reload and review the latest skill draft.");
  const { target: bot } = await loadDraft(r,actor,"skill",draft.targetId);
  if(bot.version !== draft.sourceVersion) throw conflict("The BOT changed. Save a fresh draft against its latest configuration.");
  const prompt = compilePlaybook(draft.title,draft.steps);
  if (prompt.length > 8000) throw invalid("Shorten the strategy to fit the BOT's 8,000-character instruction limit.");
  const {setInstructions}=await import("./bots");
  await setInstructions(r,actor,bot.id,prompt);
}
