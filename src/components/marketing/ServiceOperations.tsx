"use client";

import { useId, useState } from "react";
import { ArrowRight, Bot, Check, Database, FileText, ShieldCheck } from "lucide-react";
import type { ServiceActivityDemo } from "@/lib/service-activity-demo";
import type { ServiceExperience } from "@/lib/service-experience";
import "./service-operations.css";

/** Entirely local illustration: selecting a task never runs a BOT or sends data. */
export function ServiceOperations({ name, botName, activity, examples }: {
  name: string; botName: string; activity: ServiceActivityDemo; examples: ServiceExperience["examples"];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const max = Math.ceil(Math.max(...activity.values) / 10) * 10;
  const points = activity.values.map((value, i) => ({ x: 36 + i * 48, y: 190 - value / max * 160 }));
  const line = points.map((p, i) => i ? `C${(points[i - 1].x + p.x) / 2},${points[i - 1].y} ${(points[i - 1].x + p.x) / 2},${p.y} ${p.x},${p.y}` : `M${p.x},${p.y}`).join(" ");
  const checkpoint = Math.min((selected + 1) * 4 - 1, points.length - 1);
  const point = points[checkpoint];
  const total = activity.values.reduce((sum, value) => sum + value, 0);

  return <figure className="so-console" data-demo="true" aria-label={`${name} BOT activity illustration`}>
    <figcaption className="so-console-header">
      <span className="so-console-title"><span className="so-bot-icon"><Bot size={20} aria-hidden="true" /></span><span><strong>{botName}</strong><small>Service operations</small></span></span>
      <span className="so-demo-label">Illustrative preview · fictional data</span>
    </figcaption>
    <div className="so-console-grid">
      <div className="so-activity">
        <div className="so-chart-heading"><div><p>{activity.metric}</p><strong>{total}<small>in this example</small></strong></div><span>12 sample days</span></div>
        <div className="so-chart-key"><span /><p>Review activity</p><small>Volume, not business results</small></div>
        <div className="so-chart-plot"><div className="so-y-axis" aria-hidden="true"><span>{max}</span><span>{max / 2}</span><span>0</span></div><svg className="so-chart" viewBox="0 0 600 202" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-chart-title ${id}-chart-desc`}>
          <title id={`${id}-chart-title`}>{`${activity.metric} — fictional example`}</title>
          <desc id={`${id}-chart-desc`}>{`Daily ${activity.unit}: ${activity.values.join(", ")}. Sample days 1 through 12. These are illustrative review volumes, not client results.`}</desc>
          <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-text)" stopOpacity=".22" /><stop offset="100%" stopColor="var(--accent-text)" stopOpacity=".015" /></linearGradient></defs>
          {[0, .5, 1].map(tick => <g key={tick}><line x1="36" x2="576" y1={190 - tick * 160} y2={190 - tick * 160} className="so-gridline" /></g>)}
          <path d={`${line} L564,190 L36,190 Z`} fill={`url(#${id}-fill)`} />
          <path d={line} className="so-chart-line" />
          <g key={selected} className="so-checkpoint"><line x1={point.x} x2={point.x} y1="24" y2="190" /><circle cx={point.x} cy={point.y} r="9" className="so-point-halo" /><circle cx={point.x} cy={point.y} r="4" /></g>
        </svg></div>
        <div className="so-x-axis" aria-hidden="true"><span>Day 01</span><span>Day 06</span><span>Day 12</span></div>
        <div className="so-chart-caption"><span>Selected checkpoint</span><strong>Day {String(checkpoint + 1).padStart(2, "0")} · {activity.values[checkpoint]} {activity.unit}</strong></div>
        <div className="so-pipeline" aria-label="Work moves from sources through BOT analysis to human review">
          <span><Database size={16} aria-hidden="true" />Sources</span><ArrowRight size={14} aria-hidden="true" /><span><Bot size={17} aria-hidden="true" />BOT analysis</span><ArrowRight size={14} aria-hidden="true" /><span><ShieldCheck size={16} aria-hidden="true" />Your review</span>
        </div>
      </div>
      <div className="so-tasks">
        <div className="so-task-heading"><h3>Prepared for review</h3><span>{examples.length} tasks</span></div>
        <p className="so-task-hint">Select a task to inspect the work.</p>
        <div className="so-task-buttons" role="group" aria-label={`${name} example tasks`}>
          {examples.map((task, index) => <button key={task.title} type="button" aria-pressed={selected === index} aria-controls={`${id}-detail`} onClick={() => setSelected(index)}><span className="so-task-number">0{index + 1}</span><span><strong>{task.title}</strong><small>{task.context}</small></span><ArrowRight size={16} aria-hidden="true" /></button>)}
        </div>
        <div className="so-task-detail" id={`${id}-detail`} aria-live="polite" aria-atomic="true">
          {examples.map((example, index) => <div key={example.title} className="so-detail-reveal" aria-hidden={index !== selected}><span className="so-detail-label"><FileText size={14} aria-hidden="true" />Example work brief</span><h4>{example.title}</h4><p>{example.draft}</p></div>)}
        </div>
      </div>
    </div>
    <div className="so-console-footer"><span><Check size={15} aria-hidden="true" />Source context: {activity.source}</span><span><ShieldCheck size={15} aria-hidden="true" />No live actions in this preview</span></div>
  </figure>;
}
