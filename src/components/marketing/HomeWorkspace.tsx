"use client";

import { useState } from "react";
import { ArrowRight, Bot, Check, CircleCheck, FileText, Inbox, LayoutDashboard, LockKeyhole, Megaphone, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";

const EXAMPLES = [
  {
    label: "Marketing", icon: Megaphone, title: "Turn your expertise into your next campaign.",
    source: "Campaign brief", context: "Spring HVAC maintenance", detail: "Service areas, offer and brand guidelines brought together.",
    work: "Content prepared", draft: "A seasonal service campaign, built around your approved offer and the markets you serve.",
    review: "Campaign ready for review", action: "Review content before publishing", activity: "Content BOT prepared the campaign draft", owner: "Marketing manager",
  },
  {
    label: "Sales follow-up", icon: MessageSquare, title: "Give the next enquiry a clear next step.",
    source: "Website enquiry", context: "Commercial roof inspection", detail: "Property details and service request captured in one place.",
    work: "Response prepared", draft: "Thanks for reaching out. We can help with a roof inspection. What is the property address and your preferred timing?",
    review: "Response ready for review", action: "Review response before sending", activity: "Outbound BOT prepared the enquiry response", owner: "Sales manager",
  },
  {
    label: "Repeat business", icon: RefreshCw, title: "Give past customers a reason to return.",
    source: "Customer segment", context: "Annual maintenance customers", detail: "Customer history and communication eligibility reviewed.",
    work: "Outreach prepared", draft: "Your annual maintenance window is coming up. Would you like to discuss a service visit with our team?",
    review: "Outreach ready for review", action: "Review outreach before sending", activity: "Reactivation BOT prepared a customer follow-up", owner: "Customer service manager",
  },
] as const;

/** Fictional, local-only product preview; switching views cannot trigger work. */
export function HomeWorkspace() {
  const [selected, setSelected] = useState(1);
  const example = EXAMPLES[selected];

  return (
    <figure id="product-preview" className="ch-workspace" data-demo="true" aria-label="Interactive BOT workspace preview">
      <figcaption className="ch-workspace-top">
        <span><span className="ch-brand-symbol"><Bot size={19} /></span> Your BOT workspace</span>
        <span className="ch-demo-label">Illustrative preview · fictional data</span>
      </figcaption>
      <div className="ch-workspace-body">
        <aside className="ch-workspace-sidebar" aria-label="Example workspace sections">
          <span className="ch-sidebar-current"><LayoutDashboard size={16} /> Overview</span>
          <span><Bot size={16} /> BOTS</span>
          <span><ShieldCheck size={16} /> Approvals</span>
          <span><FileText size={16} /> BOT ACTIVITY</span>
          <p><LockKeyhole size={14} /> Your team stays in control</p>
        </aside>
        <div className="ch-workspace-main">
          <div className="ch-workspace-heading"><div><p>ONE CONNECTED WORKFLOW</p><h2>From opportunity to next step.</h2></div><span className="ch-status"><span /> Managed by AgenticBots</span></div>
          <div className="ch-workspace-tabs" role="group" aria-label="Choose a workflow preview">
            {EXAMPLES.map(({ label, icon: Icon }, index) => <button key={label} type="button" aria-pressed={selected === index} aria-controls="workspace-example" onClick={() => setSelected(index)}><Icon size={15} />{label}</button>)}
          </div>
          <div id="workspace-example" className="ch-workspace-example" aria-live="polite" aria-atomic="true">
            <p className="ch-workspace-summary">{example.title}</p>
            <div className="ch-workspace-flow" key={example.label}>
              <div className="ch-flow-card"><span className="ch-flow-label"><Inbox size={15} />01 · Incoming</span><span className="ch-flow-source">{example.source}</span><h3>{example.context}</h3><p>{example.detail}</p><span className="ch-flow-footer"><Check size={13} /> Context captured</span></div>
              <div className="ch-flow-card ch-flow-prepared"><span className="ch-flow-label"><Bot size={15} />02 · BOT prepares</span><h3>{example.work}</h3><blockquote>{example.draft}</blockquote><span className="ch-flow-footer"><FileText size={13} /> Draft · not sent</span></div>
              <div className="ch-flow-card"><span className="ch-flow-label"><ShieldCheck size={15} />03 · You decide</span><span className="ch-review-symbol"><ShieldCheck size={23} /></span><h3>{example.review}</h3><p>{example.action}</p><span className="ch-review-owner">Owner · {example.owner}</span></div>
            </div>
            <div className="ch-workspace-activity"><CircleCheck size={16} /><span>{example.activity}</span><span>Recorded in BOT ACTIVITY <ArrowRight size={13} /></span></div>
          </div>
        </div>
      </div>
    </figure>
  );
}
