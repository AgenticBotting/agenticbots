"use client";

import { useId, useState } from "react";
import { ArrowRight, Bot, Check, FileText, ListFilter, ShieldCheck } from "lucide-react";
import type { ServiceExperience } from "@/lib/service-experience";

/** Local example selector only. It cannot publish, send or update any system. */
export function ServiceWorkspace({ title, botName, examples }: {
  title: string; botName: string; examples: ServiceExperience["examples"];
}) {
  const [selected, setSelected] = useState(0);
  const panelId = useId();
  const example = examples[selected];
  return (
    <figure className="sx-workspace" data-demo="true" aria-label={`${title} interactive preview`}>
      <figcaption className="sx-workspace-bar">
        <span><span className="sx-bot-mark"><Bot size={18} /></span>{title}</span>
        <span>Illustrative preview · fictional data</span>
      </figcaption>
      <div className="sx-workspace-content">
        <div className="sx-work-queue">
          <p className="sx-queue-label"><ListFilter size={15} /> Prepared work <span>Preview</span></p>
          <div role="group" aria-label="Choose an example task" className="sx-task-list">
            {examples.map((item, index) => (
              <button key={item.title} type="button" aria-pressed={selected === index} aria-controls={panelId} onClick={() => setSelected(index)}>
                <span className="sx-task-icon"><FileText size={17} /></span>
                <span><strong>{item.title}</strong><small>{item.context}</small></span><ArrowRight size={15} />
              </button>
            ))}
          </div>
          <div className="sx-queue-footer"><span className="sx-dot" />{botName}</div>
        </div>
        <div className="sx-work-detail" id={panelId} aria-live="polite" aria-atomic="true">
          <div className="sx-detail-top"><span><FileText size={14} /> Draft workspace</span><span className="sx-status">Awaiting review</span></div>
          <div className="sx-draft" key={example.title}><p>{example.context}</p><h2>{example.title}</h2><blockquote>{example.draft}</blockquote><span><Check size={13} /> Prepared for your team</span></div>
          <div className="sx-review-bar"><ShieldCheck size={20} /><div><strong>Your approval comes first.</strong><p>This preview sends nothing and changes no records.</p></div></div>
        </div>
      </div>
    </figure>
  );
}
