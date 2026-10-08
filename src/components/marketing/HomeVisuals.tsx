import { ArrowRight, Bot, Check, CheckCheck, FileText, Mail, Search, ShieldCheck, Star } from "lucide-react";
import { siGoogleads, siHubspot, siMeta, siSemrush, siWordpress } from "simple-icons";

const MARKS = { hubspot: siHubspot, ads: siGoogleads, meta: siMeta, wordpress: siWordpress, semrush: siSemrush };
type MarkName = keyof typeof MARKS;

export function HomeBrandMark({ name }: { name: MarkName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={MARKS[name].path} fill="currentColor" /></svg>;
}

export function HomeToolOrbit() {
  return <div className="ch-orbit" aria-hidden="true"><i /><i /><i />{(["hubspot", "ads", "meta", "wordpress"] as const).map((name) => <span key={name} className={`ch-orbit-tool ch-orbit-${name}`}><HomeBrandMark name={name} /></span>)}</div>;
}

export function HomeDemandVisual() {
  return <div className="ch-feature-art ch-demand-art" aria-label="Illustrative marketing workflow">
    <div className="ch-search-card"><span><Search size={15} /> Your next customer is searching.</span><div><span className="ch-mini-mark"><HomeBrandMark name="ads" /></span><div><strong>Your services. Your markets.</strong><p>Search · paid media · content</p></div><ArrowRight size={16} /></div><div className="ch-search-lines"><i /><i /></div></div>
    <div className="ch-floating-note"><span className="ch-mini-mark"><Bot size={18} /></span><div><strong>Campaign brief prepared</strong><p>Ready for your team to review</p></div><CheckCheck size={17} /></div>
    <span className="ch-art-caption">Illustrative workflow</span>
  </div>;
}

export function HomeFollowupVisual() {
  return <div className="ch-feature-art ch-followup-art" aria-label="Illustrative enquiry follow-up">
    <div className="ch-mini-message"><span><Mail size={15} /> New enquiry</span><strong>Can you quote our next project?</strong></div>
    <div className="ch-message-connector" aria-hidden="true"><i /></div>
    <div className="ch-mini-response"><span><Bot size={16} /> Response prepared</span><p>Project context included.<br />Next step ready for review.</p><small><ShieldCheck size={13} /> Your approval comes first</small></div>
    <span className="ch-art-caption">Fictional enquiry</span>
  </div>;
}

export function HomeRetentionVisual() {
  return <div className="ch-feature-art ch-retention-art" aria-label="Illustrative customer retention workflow"><div className="ch-retention-stack"><span><Check size={14} /> Service completed</span><span><Star size={14} /> Review request prepared</span><span><Mail size={14} /> Next service follow-up drafted</span></div><span className="ch-art-caption">Illustrative customer journey</span></div>;
}

export function HomeAuditVisual() {
  return <div className="ch-audit-document" aria-label="Illustrative proposal scope"><div><FileText size={20} /><span>YOUR IMPLEMENTATION BRIEF</span><small>Deliverable preview</small></div><h3>A clear starting point.<br />A practical plan.</h3><ol><li><span>01</span><div><strong>Opportunity assessment</strong><p>Where work stalls or gets repeated.</p></div></li><li><span>02</span><div><strong>Recommended first workflow</strong><p>The systems, people and approvals involved.</p></div></li><li><span>03</span><div><strong>Implementation priorities</strong><p>What to address before you invest.</p></div></li></ol><p><CheckCheck size={16} /> Scope and investment agreed before work begins</p></div>;
}
