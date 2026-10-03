import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { lookups } from "@/server/services/lookups";
import { runtimeDetails } from "@/server/services/bots";
import { botTypeOrThrow } from "@/config/bot-catalog";
import { SKILLS } from "@/config/skills";
import { PageHead, Panel, KV, Stats, Stat, Banner, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, ConfirmAction, SubmitButton } from "@/components/platform/actions";
import { AutomationsTable, RunsTable } from "@/components/platform/lists";
import { NoteBox } from "@/components/platform/NoteBox";
import { compact, usd } from "@/lib/platform/format";
import * as A from "../../actions";

export const metadata = { title: "Bot" };

export default async function BotDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tech?: string }> }) {
  const actor = await requireOperatorPage();
  const { id } = await params;
  const showTech = (await searchParams).tech === "1";
  const r = await repo();
  const bot = await r.get("bots", id);
  if (!bot || !can(actor, "ops.view", bot.orgId)) notFound();
  const type = botTypeOrThrow(bot.typeKey);
  const [org, runs, jobs, skills, integrations, providers, rollups, notes] = await Promise.all([
    r.get("organizations", bot.orgId), r.list("runs", { orgId: bot.orgId, where: { botId: id } }), r.list("automation_jobs", { orgId: bot.orgId, where: { botId: id } }),
    r.list("skill_assignments", { orgId: bot.orgId, where: { botId: id } }), r.list("integrations", { orgId: bot.orgId }), r.list("provider_configurations"),
    r.list("usage_rollups", { orgId: bot.orgId, where: { botId: id } }), r.list("operator_notes", { orgId: bot.orgId, where: { targetType: "bot", targetId: id } }),
  ]);
  const L = await lookups(r, actor);
  const activeSkills = skills.filter((s) => !s.removedAt);
  const month = new Date().toISOString().slice(0, 7);
  const roll = rollups.find((u) => u.period === month);
  const tech = showTech ? await runtimeDetails(r, actor, id) : null;
  const disabled = bot.status === "disabled";
  const suspended = org?.status === "suspended";

  return (
    <>
      <PageHead
        title={<span className="inline-flex items-center gap-3">{bot.name}</span>}
        crumbs={[{ href: "/ops/bots", label: "Bots" }, { href: `/ops/clients/${bot.orgId}`, label: org?.name ?? "Client" }]}
        description={<span className="inline-flex gap-4 items-center flex-wrap"><Status value={bot.status} /><span>{type.shortDescription}</span></span>}
        actions={
          <>
            {bot.currentRunId && <Link className="btn btn-outline" href={`/ops/runs/${bot.currentRunId}`}>Open current run</Link>}
            <Link className="btn btn-outline" href={`/ops/bots/${id}?tech=${showTech ? "0" : "1"}`}>{showTech ? "Hide runtime details" : "View runtime details"}</Link>
            {disabled ? (
              <ActionButton action={A.setBotEnabledAction} hidden={{ botId: id, enabled: "true" }} label="Enable Bot" variant="primary" />
            ) : (
              <ConfirmAction action={A.setBotEnabledAction} hidden={{ botId: id, enabled: "false" }} label="Disable Bot" title={`Disable ${bot.name}?`}
                body="The Bot's runtime profile is parked: it stops taking work and its automations stop ticking. Memory, sessions, skills and schedules are kept and resume when you enable it." confirmLabel="Disable Bot" />
            )}
          </>
        }
      />
      {bot.errorState && <Banner tone="bad"><strong>{bot.errorState.code}</strong> — {bot.errorState.message} <span className="pf-mono">{bot.errorState.correlationId}</span></Banner>}
      {suspended && <Banner tone="bad">This client is suspended. Bots cannot run until the client is reactivated.</Banner>}

      <Stats>
        <Stat value={roll?.runs ?? 0} label="Runs this month" />
        <Stat value={roll?.failedRuns ?? 0} label="Failed this month" tone={roll?.failedRuns ? "watch" : undefined} />
        <Stat value={compact((roll?.usage.inputTokens ?? 0) + (roll?.usage.outputTokens ?? 0))} label="Tokens this month" />
        <Stat value={usd(roll?.modelCostUsd ?? 0)} label="Est. model cost" />
        <Stat value={<When iso={bot.lastActivityAt} />} label="Last activity" />
      </Stats>

      {tech && (
        <Panel title="Runtime details" sub="Technical view — operators only" className="mb-4">
          {tech.ok ? (
            <div className="pf-grid pf-grid-2">
              <KV rows={[
                ["Engine", tech.engine],
                ["Profile", <span key="p" className="pf-mono">{tech.profile}</span>],
                ["Runtime reports", <Status key="rs" value={tech.runtimeStatus} />],
                ["Credential", <span key="c" className="pf-mono">{bot.credentialRef}</span>],
                ["Capabilities", Object.entries(tech.caps.reported).filter(([, v]) => v).map(([k]) => k).join(", ")],
              ]} />
              <div>
                <div className="pf-small pf-muted mb-1">Toolsets</div>
                {tech.toolsets.map((t) => <div key={t.name} className="pf-small"><Status value={t.enabled ? "active" : "disabled"} label={t.label ?? t.name} /> <span className="pf-mono pf-muted">{t.tools.join(", ")}</span></div>)}
                <div className="pf-small pf-muted mt-3 mb-1">Skills installed on the runtime</div>
                <div className="pf-small pf-mono">{tech.skills.map((s) => s.name).join(", ") || "none reported"}</div>
              </div>
            </div>
          ) : (
            <div className="pf-msg err">Runtime did not answer: {tech.error} <span className="pf-mono">{tech.correlationId}</span></div>
          )}
        </Panel>
      )}

      <div className="pf-grid pf-grid-main">
        <div className="pf-grid">
          <Panel title="Run this Bot" sub="Read-only research runs on its own. Sending, publishing and changes stop for approval.">
            <ActionForm action={A.runBotAction} hidden={{ botId: id, idempotencyKey: randomUUID() }}>
              <label className="pf-label">Task<textarea name="task" className="field" rows={3} required minLength={3} placeholder={`What should ${bot.name} do?`} /></label>
              <div><SubmitButton disabled={disabled || suspended} pendingLabel="Starting…">Start Bot Run</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Runs" flush action={<Link href={`/ops/runs?bot=${id}`} className="pf-small underline">All</Link>}>
            <RunsTable runs={runs.slice(0, 10)} names={{ orgs: L.orgs, bots: L.bots }} showClient={false} />
          </Panel>
          <Panel title="Automations" flush>
            <AutomationsTable jobs={jobs} names={{ orgs: L.orgs, bots: L.bots }} showClient={false} />
          </Panel>
          <Panel title="Test conversation" sub="Operator-only. Starts a conversation and runs the first message.">
            <ActionForm action={A.createConversationAction} hidden={{ botId: id }}>
              <label className="pf-label">Message<textarea name="message" className="field" rows={2} required /></label>
              <div><SubmitButton variant="outline" disabled={disabled || suspended}>Start conversation</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
        <div className="pf-grid">
          <Panel title="Model and provider">
            <ActionForm action={A.changeModelAction} hidden={{ botId: id }}>
              <label className="pf-label">Model
                <select name="model" className="field" defaultValue={`${bot.provider}::${bot.model}`}>
                  {providers.flatMap((p) => p.models.map((m) => <option key={`${p.provider}::${m.id}`} value={`${p.provider}::${m.id}`}>{p.displayName} — {m.label}</option>))}
                </select>
              </label>
              <label className="pf-label">Fallback
                <select name="fallback" className="field" defaultValue={bot.fallbackProvider ? `${bot.fallbackProvider}::${bot.fallbackModel}` : ""}>
                  <option value="">None</option>
                  {providers.flatMap((p) => p.models.map((m) => <option key={`f-${p.provider}::${m.id}`} value={`${p.provider}::${m.id}`}>{p.displayName} — {m.label}</option>))}
                </select>
              </label>
              <label className="pf-label">Reasoning
                <select name="reasoning" className="field" defaultValue={bot.reasoning ?? "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
              </label>
              <div><SubmitButton variant="outline">Save model settings</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Skills" sub="Least capability: only skills permitted for this Bot type can be assigned.">
            <div className="grid gap-2 mb-3">
              {activeSkills.length === 0 && <p className="pf-small pf-muted">No skills assigned.</p>}
              {activeSkills.map((s) => (
                <div key={s.id} className="flex justify-between gap-2 items-center">
                  <span><strong className="text-[13.5px]">{SKILLS.find((x) => x.key === s.skillKey)?.name ?? s.skillKey}</strong> <span className="pf-mono pf-muted">v{s.skillVersion}</span></span>
                  <ActionButton action={A.removeSkillAction} hidden={{ botId: id, skillKey: s.skillKey }} label="Remove" variant="ghost" />
                </div>
              ))}
            </div>
            <ActionForm action={A.assignSkillAction} hidden={{ botId: id }}>
              <select name="skillKey" className="field" aria-label="Skill">
                {SKILLS.filter((s) => s.botTypes.includes(bot.typeKey) && !activeSkills.some((a) => a.skillKey === s.key)).map((s) => <option key={s.key} value={s.key}>{s.name} v{s.version}</option>)}
              </select>
              <div><SubmitButton variant="outline">Assign skill</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Integration access">
            <ActionForm action={A.setIntegrationAccessAction} hidden={{ botId: id }}>
              {integrations.filter((i) => type.allowedIntegrations.includes(i.provider) || i.provider === "mcp_server" || i.provider === "rest_api").map((i) => (
                <label key={i.id} className="pf-check"><input type="checkbox" name="integrationIds" value={i.id} defaultChecked={bot.integrationIds.includes(i.id)} /> {i.displayName} <Status value={i.status} /></label>
              ))}
              <div><SubmitButton variant="outline">Save access</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Business context" sub="Instructions layered onto every run. Never shown to the client.">
            <ActionForm action={A.setInstructionsAction} hidden={{ botId: id }}>
              <textarea name="instructions" className="field" rows={4} defaultValue={bot.instructions} aria-label="Instructions" />
              <div><SubmitButton variant="outline">Save</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Internal notes"><NoteBox orgId={bot.orgId} targetType="bot" targetId={id} notes={notes} /></Panel>
        </div>
      </div>
    </>
  );
}
