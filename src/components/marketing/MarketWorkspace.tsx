"use client";

import { useId, useState } from "react";
import { ArrowRight, Bot, Check, FileText, MapPin, ShieldCheck } from "lucide-react";
import { MARKET_PRIORITIES } from "@/lib/market-experience";

export function MarketWorkspace({ place, areas, areaLabel }: { place: string; areas: string[]; areaLabel: string }) {
  const [selected, setSelected] = useState(0);
  const panelId = useId();
  const priority = MARKET_PRIORITIES[selected];
  return <figure className="mx-workspace" data-demo="true" aria-label={`Illustrative BOT planning workspace for ${place}`}>
    <figcaption><span><Bot size={18} /> Your business, connected</span><span>Illustrative workflow · no live data</span></figcaption>
    <div className="mx-workspace-body">
      <aside className="mx-territory"><p><MapPin size={14} /> {areaLabel}</p><h2>{place}</h2><div className="mx-territory-lines" aria-hidden="true"><i /><i /><i /><span><MapPin size={26} /></span></div><ul>{areas.slice(0, 5).map(area => <li key={area}><span />{area}</li>)}</ul><small>Service area confirmed in your scope</small></aside>
      <div className="mx-workspace-main"><div className="mx-preview-heading"><p>Start with a business priority</p><span><ShieldCheck size={13} /> You stay in control</span></div>
        <div className="mx-priority-tabs" role="group" aria-label="Choose a business priority">{MARKET_PRIORITIES.map((item, i) => <button type="button" key={item.id} aria-pressed={i === selected} aria-controls={panelId} onClick={() => setSelected(i)}>{item.label}</button>)}</div>
        <div id={panelId} className="mx-workspace-panel" aria-live="polite" aria-atomic="true"><div key={priority.id} className="mx-preview-task"><div className="mx-task-title"><span><FileText size={18} /></span><div><p>Example prepared work</p><h3>{priority.task}</h3></div><span className="mx-draft-label">Draft</span></div><dl><div><dt>Context</dt><dd>{priority.input}</dd></div><div><dt>Prepared output</dt><dd>{priority.output}</dd></div></dl><p className="mx-preview-control"><Check size={15} />{priority.control}</p></div></div>
        <div className="mx-preview-foot"><span>Example only. Nothing is sent or changed.</span><a href={`#${priority.id}`}>Explore services <ArrowRight size={14} /></a></div>
      </div>
    </div>
  </figure>;
}
