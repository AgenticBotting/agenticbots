import { describe, expect, it, vi } from "vitest";
import { world } from "../support/fixtures";
import { Tx } from "@/server/db/repository";
import { runtimeObservation, healthHistory } from "@/lib/platform/health";
import { PLAYBOOK_TEMPLATES, compilePlaybook } from "@/lib/platform/playbooks";
import { saveDraft, loadDraft, applyAutomationDraft, applySkillDraft } from "@/server/services/playbooks";
import { supportEvidence, prepareSupportDraft } from "@/server/services/support-planning";
import { refreshRuntimeHealth } from "@/server/services/monitoring";
import { runsByDay, clientRows } from "@/server/services/queries";
import type { RuntimeHealthSample } from "@/lib/platform/types";
import { TABLE_NAMES, APPEND_ONLY_TABLES } from "@/lib/platform/types";
import { PLATFORM_TABLES, APPEND_ONLY } from "../../convex/platformTables";
import { BotRuntime } from "@/server/runtime";
import { approvalDisplayStatus } from "@/lib/platform/approval-status";
import { asUser, ctxOf } from "@/server/prospecting/access";
import { costSummary } from "@/server/prospecting/costs";

const asOf=Date.parse("2026-10-09T12:00:00Z");
describe("operator health evidence",()=>{
  it("never shows stale, missing or future timestamps as healthy",()=>{
    const rt={health:"healthy" as const,ready:true,deploymentState:"deployed" as const};
    for(const lastHeartbeatAt of [undefined,"invalid","2026-10-02T12:00:00Z","2026-10-10T12:00:00Z"]){
      expect(runtimeObservation({...rt,lastHeartbeatAt},asOf)).toMatchObject({health:"unknown",ready:false,fresh:false});
    }
    expect(runtimeObservation({...rt,lastHeartbeatAt:"2026-10-09T11:55:00Z"},asOf).health).toBe("healthy");
    expect(runtimeObservation({...rt,ready:false,lastHeartbeatAt:"2026-10-09T11:55:00Z"},asOf).health).toBe("degraded");
  });
  it("keeps unobserved intervals empty and surfaces failed samples",()=>{
    const sample={checkedAt:"2026-10-09T11:30:00Z",health:"healthy",ready:true} as RuntimeHealthSample;
    const bins=healthHistory([sample,{...sample,checkedAt:"2026-10-09T11:31:00Z",health:"offline",ready:false}],asOf);
    expect(bins).toHaveLength(24);expect(bins.filter(b=>b.state==="unknown")).toHaveLength(23);
    expect(bins.find(b=>b.count===2)).toMatchObject({state:"bad",good:1});
  });
  it("records health observations and the responsible operator atomically",async()=>{
    const w=await world();const rt=(await w.r.list("runtimes",{orgId:w.acme.id}))[0];
    await refreshRuntimeHealth(w.r,rt.id,{id:w.admin.user.id,name:w.admin.user.name});
    const samples=await w.r.list("runtime_health_samples",{orgId:w.acme.id});
    expect(samples).toHaveLength(1);expect(samples[0]).toMatchObject({runtimeId:rt.id,demo:true});
    expect((await w.r.list("audit_logs")).some(a=>a.action==="runtime.health_checked" && a.actorId===w.admin.user.id)).toBe(true);
  });
  it("uses UTC calendar boundaries for charts",async()=>{
    const w=await world();const base=(await w.r.list("runs"))[0];
    const days=runsByDay([{...base,createdAt:"2026-10-08T23:59:00Z",status:"completed"}],2,asOf);
    expect(days.map(d=>d.completed)).toEqual([1,0]);
    const runtime=(await w.r.list("runtimes",{orgId:w.acme.id}))[0];
    const tx=new Tx(w.r);tx.patch("runtimes",runtime,{lastHeartbeatAt:"2020-01-01T00:00:00Z",lastCheckedAt:"2020-01-01T00:00:00Z"});await tx.commit();
    expect((await clientRows(w.r,w.admin)).find(x=>x.org.id===w.acme.id)?.runtime?.health).toBe("unknown");
  });
  it("records failed attempts without inventing a successful heartbeat",async()=>{
    const w=await world();const rt=(await w.r.list("runtimes",{orgId:w.acme.id}))[0];
    const check=vi.spyOn(BotRuntime.prototype,"getDetailedHealth").mockRejectedValue(new Error("Unavailable"));
    try {
      const next=await refreshRuntimeHealth(w.r,rt.id);
      expect(next.lastHeartbeatAt).toBe(rt.lastHeartbeatAt);
      expect(next.lastCheckedAt).toBeDefined();
      expect(runtimeObservation(next).health).toBe("offline");
      expect((await w.r.list("runtime_health_samples"))[0]).toMatchObject({health:"offline",ready:false});
    } finally {check.mockRestore();}
  });
  it("derives expiry without changing historical approval records",()=>{
    expect(approvalDisplayStatus({status:"pending",expiresAt:"2026-10-09T11:59:00Z"},asOf)).toBe("expired");
    expect(approvalDisplayStatus({status:"approved",expiresAt:"2026-10-09T11:59:00Z"},asOf)).toBe("approved");
    expect(approvalDisplayStatus({status:"pending",expiresAt:"2026-10-09T13:00:00Z"},asOf)).toBe("pending");
  });
});

describe("reviewable playbooks",()=>{
  it("saves drafts without changing the automation, and rejects stale versions",async()=>{
    const w=await world(); const job=(await w.r.list("automation_jobs",{orgId:w.acme.id}))[0];
    const input={kind:"automation",targetId:job.id,title:"Campaign review",steps:PLAYBOOK_TEMPLATES[2].steps,sourceVersion:job.version,expectedVersion:0};
    const draft=await saveDraft(w.r,w.admin,input);
    expect(await w.r.get("automation_jobs",job.id)).toEqual(job);
    expect((await loadDraft(w.r,w.admin,"automation",job.id)).draft?.id).toBe(draft.id);
    await expect(saveDraft(w.r,w.admin,input)).rejects.toMatchObject({code:"conflict"});
    const changed=await saveDraft(w.r,w.admin,{...input,expectedVersion:draft.version,title:"Reviewed campaign SOP"});
    expect(changed.version).toBe(draft.version+1);
    expect((await w.r.list("audit_logs")).filter(a=>a.action==="playbook.draft_saved")).toHaveLength(2);
  });
  it("rejects client actors and cross-tenant records",async()=>{
    const w=await world();const job=(await w.r.list("automation_jobs",{orgId:w.acme.id}))[0];
    const scoped={...w.operator,user:{...w.operator.user,operatorOrgIds:[w.bayside.id]}};
    for(const actor of [w.owner,scoped]) {
      await expect(loadDraft(w.r,actor,"automation",job.id)).rejects.toMatchObject({code:"not_found"});
      await expect(saveDraft(w.r,actor,{kind:"automation",targetId:job.id,title:"Cross tenant attempt",steps:PLAYBOOK_TEMPLATES[0].steps,sourceVersion:job.version,expectedVersion:0})).rejects.toMatchObject({code:"not_found"});
    }
  });
  it("validates steps, rejects secrets and requires paused automation to apply",async()=>{
    const w=await world();const job=(await w.r.list("automation_jobs",{orgId:w.acme.id})).find(j=>j.status==="active")!;
    const input={kind:"automation",targetId:job.id,title:"Review only",steps:PLAYBOOK_TEMPLATES[0].steps,sourceVersion:job.version,expectedVersion:0};
    await expect(saveDraft(w.r,w.admin,{...input,steps:[]})).rejects.toMatchObject({code:"validation"});
    await expect(saveDraft(w.r,w.admin,{...input,title:"token=fictional-secret-value"})).rejects.toMatchObject({code:"validation"});
    const draft=await saveDraft(w.r,w.admin,input);
    await expect(applyAutomationDraft(w.r,w.admin,draft.id,draft.version)).rejects.toMatchObject({code:"conflict"});
    expect(compilePlaybook(draft.title,draft.steps)).toContain("FINAL GATE — Human review");
  });
  it("detects underlying changes and incompatible skill assignments",async()=>{
    const w=await world();const bot=(await w.r.list("bots",{orgId:w.acme.id})).find(b=>b.typeKey==="ads")!;
    await expect(loadDraft(w.r,w.admin,"skill",`${bot.id}:prospecting`)).rejects.toMatchObject({code:"not_found"});
    const draft=await saveDraft(w.r,w.admin,{kind:"skill",targetId:`${bot.id}:google-ads-analysis`,title:"Client strategy",steps:PLAYBOOK_TEMPLATES[0].steps,sourceVersion:bot.version,expectedVersion:0});
    const tx=new Tx(w.r);tx.patch("bots",bot,{name:"Changed BOT"});await tx.commit();
    await expect(applySkillDraft(w.r,w.admin,draft.id,draft.version)).rejects.toMatchObject({code:"conflict"});
  });
  it("prepares scoped support evidence without starting a run",async()=>{
    const w=await world();const req=(await w.r.list("requests",{orgId:w.acme.id}))[0];const before=await w.r.list("runs");
    const evidence=await supportEvidence(w.r,w.admin,req.id);expect(evidence.request.orgId).toBe(w.acme.id);
    const draft=await prepareSupportDraft(w.r,w.admin,req.id,0);expect(draft.kind).toBe("support");expect(draft.orgId).toBe(w.acme.id);
    expect(await w.r.list("runs")).toEqual(before);
    await expect(supportEvidence(w.r,{...w.operator,user:{...w.operator.user,operatorOrgIds:[w.bayside.id]}},req.id)).rejects.toMatchObject({code:"not_found"});
  });
  it("applies a reviewed skill strategy and never silently truncates its approval gate",async()=>{
    const w=await world();let bot=(await w.r.list("bots",{orgId:w.acme.id})).find(b=>b.typeKey==="ads")!;
    const input={kind:"skill",targetId:`${bot.id}:google-ads-analysis`,title:"Client strategy",steps:PLAYBOOK_TEMPLATES[0].steps,sourceVersion:bot.version,expectedVersion:0};
    const draft=await saveDraft(w.r,w.admin,input);
    await applySkillDraft(w.r,w.admin,draft.id,draft.version);
    bot=(await w.r.get("bots",bot.id))!;
    expect(bot.instructions).toContain("FINAL GATE — Human review");
    expect((await w.r.list("audit_logs")).some(a=>a.action==="bot.instructions" && a.targetId===bot.id)).toBe(true);
    const long=await saveDraft(w.r,w.admin,{...input,sourceVersion:bot.version,expectedVersion:draft.version,steps:Array.from({length:6},(_,i)=>({id:`step-${i}`,kind:"analyze",title:"Review evidence",instruction:"Review available evidence. ".repeat(60)}))});
    await expect(applySkillDraft(w.r,w.admin,long.id,long.version)).rejects.toMatchObject({code:"validation"});
    expect((await w.r.get("bots",bot.id))?.instructions).toBe(bot.instructions);
  });
  it("keeps both storage registries and append-only rules aligned",()=>{
    expect([...TABLE_NAMES].sort()).toEqual([...PLATFORM_TABLES].sort());
    expect([...APPEND_ONLY_TABLES].sort()).toEqual([...APPEND_ONLY].sort());
  });
  it("limits prospecting cost totals to the operator's assigned clients",async()=>{
    const w=await world();const ctx=ctxOf(w.r,asUser(w.admin));const tx=ctx.store.tx();
    for(const [orgId,costUsd] of [[w.acme.id,4],[w.bayside.id,7],[undefined,10]] as const) tx.insert("pg_cost_events",{orgId,costUsd,provider:"test",operation:"research",units:1,unitCostUsd:costUsd,pricingSource:"configured",success:true,demo:true});
    await tx.commit();
    const scoped={...w.operator,user:{...w.operator.user,operatorOrgIds:[w.acme.id]}};
    expect((await costSummary(ctxOf(w.r,asUser(scoped)))).monthUsd).toBe(4);
    expect((await costSummary(ctx)).monthUsd).toBe(21);
    await expect(costSummary(ctxOf(w.r,asUser(w.owner)))).rejects.toMatchObject({code:"forbidden"});
  });
});
