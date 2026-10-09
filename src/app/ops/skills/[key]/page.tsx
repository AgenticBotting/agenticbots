import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { getSkill, skillAllowedFor } from "@/config/skills";
import { loadDraft } from "@/server/services/playbooks";
import { PageHead, Panel, Empty } from "@/components/platform/ui";
import { PlaybookEditor } from "@/components/platform/playbook-editor";
import { ConfirmAction } from "@/components/platform/actions";
import { applySkillPlaybookAction } from "../../playbook-actions";
export const metadata = {title:"Skill workspace"};
export default async function SkillWorkspace({params,searchParams}:{params:Promise<{key:string}>;searchParams:Promise<{bot?:string}>}) {
  const {key}=await params; const {bot:botId}=await searchParams; const skill=getSkill(key);if(!skill) notFound();
  const actor=await requireOperatorPage();const r=await repo(); const L=await lookups(r,actor);
  const bots=[...L.bots.values()].filter(b=>skillAllowedFor(key,b.typeKey));
  const bot=botId ? bots.find(b=>b.id===botId) : bots[0];
  if(botId && !bot) notFound();
  const loaded=bot ? await loadDraft(r,actor,"skill",`${bot.id}:${key}`) : null;
  const source=await readFile(join(process.cwd(),"runtime/skills",skill.key,"SKILL.md"),"utf8");
  return <><PageHead title={skill.name} crumbs={[{label:"Skills",href:"/ops/skills"}]} description={`Base playbook v${skill.version} · ${skill.description}`}/>
    <div className="oc-steps"><div><span className="n">01 · Base skill</span><strong>Version {skill.version}</strong><p>Reviewed instructions in the skill library.</p></div><div><span className="n">02 · Client strategy</span><strong>{bot ? L.orgs.get(bot.orgId) : "Choose a client"}</strong><p>Customize the SOP for the selected BOT.</p></div><div><span className="n">03 · Review</span><strong>Your decision</strong><p>Apply the strategy to future manual runs after reviewing the draft.</p></div></div>
    <form className="pf-filters"><select name="bot" className="field" aria-label="Client and BOT" defaultValue={bot?.id}>{bots.map(b=><option value={b.id} key={b.id}>{L.orgs.get(b.orgId)} — {b.name}</option>)}</select><button className="btn btn-outline">Open strategy</button></form>
    {bot && loaded ? <Panel title={`${bot.name} · strategy workspace`} sub="Applying replaces this BOT's custom instructions. The base skill and existing automation prompts stay unchanged.">
      <PlaybookEditor key={`${bot.id}-${bot.version}-${loaded.draft?.version ?? 0}`} kind="skill" targetId={`${bot.id}:${key}`} title={skill.name} sourceVersion={bot.version} draft={loaded.draft}/>
      {loaded.draft && loaded.draft.sourceVersion === bot.version && <div className="mt-6"><ConfirmAction action={applySkillPlaybookAction} hidden={{draftId:loaded.draft.id,version:String(loaded.draft.version),confirmed:"yes"}} label="Apply reviewed strategy" variant="outline" title={`Replace ${bot.name}'s custom instructions?`} body="The saved strategy becomes the instruction overlay for future manual BOT RUNS. Review existing instructions below before replacing them. This does not start a run or deploy a new skill version." confirmLabel="Apply strategy"/></div>}
      {loaded.draft && loaded.draft.sourceVersion !== bot.version && <p className="oc-note mt-4">The BOT configuration changed. Review and save a fresh draft before applying a strategy.</p>}
      <details className="mt-6"><summary className="oc-note cursor-pointer">Current BOT custom instructions</summary><pre className="oc-preview mt-3">{bot.instructions || "No custom instructions configured."}</pre></details>
    </Panel> : <Empty title="No eligible BOTS">Assign an eligible BOT from the <Link href="/ops/bots" className="underline">BOT library</Link> to create a client strategy.</Empty>}
    <details className="pf-disclosure mt-6"><summary>Inspect base skill · version {skill.version}</summary><pre className="body oc-preview">{source}</pre></details>
  </>;
}
