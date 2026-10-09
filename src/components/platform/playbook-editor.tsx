"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { OperatingDraft } from "@/lib/platform/types";
import { compilePlaybook, PLAYBOOK_TEMPLATES, STEP_LABELS, type PlaybookStep } from "@/lib/platform/playbooks";
import { ActionForm, SubmitButton } from "./actions";
import { savePlaybookAction } from "@/app/ops/playbook-actions";

export function PlaybookEditor({ kind, targetId, title: initialTitle, sourceVersion, draft, initialSteps }: {
  kind: OperatingDraft["kind"]; targetId: string; title: string; sourceVersion: number; draft: OperatingDraft | null; initialSteps?: PlaybookStep[];
}) {
  const [title,setTitle] = useState(draft?.title ?? initialTitle);
  const [steps,setSteps] = useState<PlaybookStep[]>(draft?.steps ?? initialSteps ?? PLAYBOOK_TEMPLATES[0].steps);
  const [selected,setSelected] = useState(steps[0].id);
  const [dragged,setDragged] = useState<string | null>(null);
  const [notice,setNotice] = useState("");
  const current = steps.find(s => s.id === selected) ?? steps[0];
  const update = (patch: Partial<PlaybookStep>) => setSteps(prev => prev.map(s => s.id === current.id ? {...s,...patch} : s));
  const move = (id: string, index: number) => {
    setSteps(prev => { const next = [...prev]; const from = next.findIndex(s => s.id === id); if (from < 0 || index < 0 || index >= next.length) return prev; const [item] = next.splice(from,1); next.splice(index,0,item); return next; });
    setNotice(`Step moved to position ${index+1}.`);
  };
  return <ActionForm action={savePlaybookAction} hidden={{ draft: JSON.stringify({kind,targetId,title,steps,sourceVersion,expectedVersion:draft?.version ?? 0}) }}>
    <div className="oc-editor-toolbar">
      <label className="pf-label">Procedure name<input className="field" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required /></label>
      <label className="pf-label">Start from a template<select className="field" value="" onChange={e => { const template=PLAYBOOK_TEMPLATES[Number(e.target.value)]; setSteps(template.steps.map(s=>({...s}))); setSelected(template.steps[0].id); setNotice(`${template.name} template loaded. Save to keep your changes.`); }}><option value="" disabled>Choose a template</option>{PLAYBOOK_TEMPLATES.map((t,i)=><option key={t.name} value={i}>{t.name}</option>)}</select></label>
    </div>
    <div className="oc-workspace">
      <div className="oc-canvas" aria-label="Procedure steps">
        <div className="oc-flow-start"><span className="pf-badge">{kind === "automation" ? "Scheduled trigger" : "Operator initiated"}</span><p>Select a step to edit. Drag to reorder, or use the arrow buttons.</p></div>
        <ol className="oc-node-list">{steps.map((step,i)=><li key={step.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); if(dragged) move(dragged,i);setDragged(null);}}>
          <div className={`oc-node ${current.id===step.id ? "selected":""}`}>
            <button type="button" className="oc-node-select" draggable onDragStart={()=>setDragged(step.id)} onDragEnd={()=>setDragged(null)} onClick={()=>setSelected(step.id)} aria-pressed={current.id===step.id}>
              <GripVertical size={15} aria-hidden="true" /><span className="oc-node-number">{String(i+1).padStart(2,"0")}</span><span><small>{STEP_LABELS[step.kind]}</small><strong>{step.title}</strong></span>
            </button>
            <div className="oc-node-controls"><button type="button" aria-label={`Move ${step.title} up`} disabled={!i} onClick={()=>move(step.id,i-1)}><ArrowUp size={16}/></button><button type="button" aria-label={`Move ${step.title} down`} disabled={i===steps.length-1} onClick={()=>move(step.id,i+1)}><ArrowDown size={16}/></button></div>
          </div>
        </li>)}</ol>
        <div className="oc-review-gate"><ShieldCheck size={20} aria-hidden="true"/><div><strong>Human review</strong><p>Inspect evidence and proposed changes before execution.</p></div><Check size={16} aria-hidden="true"/></div>
        <button type="button" className="btn btn-outline mt-4" disabled={steps.length>=12} onClick={()=>{const id=crypto.randomUUID();setSteps(prev=>[...prev,{id,kind:"analyze",title:"New analysis step",instruction:"Review the available evidence and prepare findings."}]);setSelected(id);}}><Plus size={16} aria-hidden="true"/>Add a step</button>
      </div>
      <aside className="oc-step-inspector" aria-label="Selected step">
        <span className="pf-badge">Step {steps.indexOf(current)+1} of {steps.length}</span>
        <label className="pf-label">Step title<input className="field" value={current.title} onChange={e=>update({title:e.target.value})} maxLength={100} required /></label>
        <label className="pf-label">Work type<select className="field" value={current.kind} onChange={e=>update({kind:e.target.value as PlaybookStep["kind"]})}>{Object.entries(STEP_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label className="pf-label">What should the BOT do?<textarea className="field" rows={9} value={current.instruction} onChange={e=>update({instruction:e.target.value})} maxLength={1800} required /></label>
        <p className="oc-note">Describe inputs, expected output and what to do when information is missing. Access comes from the BOT’s assigned tools.</p>
        <button type="button" className="btn btn-ghost" disabled={steps.length===1} onClick={()=>{setSteps(prev=>prev.filter(s=>s.id!==current.id));setSelected(steps.find(s=>s.id!==current.id)!.id);}}><Trash2 size={15} aria-hidden="true"/>Remove step</button>
      </aside>
    </div>
    <div role="status" className="oc-note">{notice}</div>
    <details className="pf-disclosure"><summary>Inspect the BOT instructions</summary><div className="body oc-preview">{compilePlaybook(title,steps)}</div></details>
    <div className="oc-editor-footer"><p className="oc-note">This is a sequential SOP for one BOT. Branching, tool execution and deployments are not configured by this canvas. Drafts stay internal until explicitly applied.</p><SubmitButton pendingLabel="Saving draft…">Save draft</SubmitButton></div>
  </ActionForm>;
}
