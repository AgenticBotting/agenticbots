"use client";

import { useId, useState } from "react";
import { ArrowRight, Building2, Check, FileText, GitBranch, Play, Search, ShieldCheck, Target } from "lucide-react";
import type { BuyerJourney } from "@/lib/public-niche-types";
import { MOTION_LABELS, routeForBuyer, type NicheBrief } from "@/lib/niche-planning";

/** A local planning illustration. No company lookup, scoring, sending or CRM access. */
export function NicheBuyerFlow({ niche, buyers, brief, channel }: {
  niche: string; buyers: BuyerJourney[]; brief: NicheBrief; channel?: "seo" | "ppc";
}) {
  const [selected, setSelected] = useState(buyers[0]?.buyer ?? "");
  const [replay, setReplay] = useState(0);
  const inputId = useId();
  const buyer = buyers.find(item => item.buyer === selected) ?? buyers[0];
  if (!buyer) return <div className="nb-empty"><Target size={25} /><h3>Your customer mix defines the plan.</h3><p>This niche is in our service catalog. Its buyer relationships need further review before we present a specific audience map.</p><p>Bring examples of your best customers, the services they buy and who makes the decision. Your audit will define the initial buyer profile and the evidence needed to qualify it.</p><a href="#audit" className="btn btn-primary">Define my buyer profile<ArrowRight size={16} /></a></div>;
  const route = routeForBuyer(buyer);
  const marketing = channel === "seo" ? { label: "Buyer questions → search content", channel: "SEO planning", action: "Use this buyer's questions to prepare service content and an enquiry path. Publication stays subject to your approval." } : channel === "ppc" ? { label: "Buyer intent → campaign brief", channel: "PPC planning", action: "Translate the approved buyer profile into search intent, service-area targeting and a campaign brief. Account and budget changes require approval." } : route;
  return <figure className="nb-flow" data-demo="true" aria-label={`${niche} buyer workflow illustration`}>
    <figcaption className="nb-toolbar"><span><GitBranch size={17} />Buyer-to-pipeline map</span><span>Illustrative planning flow · no live prospect data</span></figcaption>
    <div className="nb-layout">
      <div className="nb-audience">
        <p className="sx-kicker">01 / Select a buying audience</p>
        <label htmlFor={inputId}>Buyer type</label>
        <select id={inputId} value={buyer.buyer} onChange={event => { setSelected(event.target.value); setReplay(value => value + 1); }}>{buyers.map(item => <option key={item.buyer} value={item.buyer}>{item.profile.name}</option>)}</select>
        <div className="nb-buyer-icon"><Building2 size={25} /></div>
        <p className="nb-segment">{buyer.profile.segment}</p><h3>{buyer.profile.name}</h3>
        <div className="nb-roles"><p>Roles to verify</p>{buyer.roles.map(role => <span key={role}>{role}</span>)}</div>
        <div className="nb-fit-status"><Target size={14} />{buyer.validation === "reviewed" ? "Reviewed catalog relationship" : "Modeled fit · validate with your business"}</div>
      </div>
      <div className="nb-pipeline">
        <div className="nb-pipeline-top"><div><p className="sx-kicker">02 / Build the buying context</p><h3>A clear reason.<br /><span>A relevant next step.</span></h3></div><button type="button" className="nb-replay" onClick={() => setReplay(value => value + 1)} aria-label="Replay the illustrative workflow"><Play size={13} />Replay flow</button></div>
        <div className="nb-nodes" key={`${buyer.buyer}-${replay}`}>
          <section className="nb-node nb-node-fit"><span className="nb-node-label"><Target size={15} />Ideal customer profile</span><h4>{niche}</h4><p>Confirm service fit, operating territory and who can authorize the work.</p><div className="nb-node-tag">{MOTION_LABELS[buyer.motion]}</div></section>
          <div className="nb-connector" aria-hidden="true"><i /><ArrowRight size={14} /></div>
          <section className="nb-node nb-node-context"><span className="nb-node-label"><Search size={15} />Evidence before action</span><h4>Why this buyer. Why now.</h4><p>{brief.timing}</p><div className="nb-node-tag">Verify the source and current need</div></section>
          <div className="nb-connector nb-turn" aria-hidden="true"><i /><ArrowRight size={14} /></div>
          <section className="nb-node nb-node-route"><span className="nb-node-label"><GitBranch size={15} />Go-to-market approach</span><h4>{marketing.channel}</h4><p>{marketing.action}</p><div className="nb-node-tag">{marketing.label}</div></section>
          <div className="nb-connector nb-return" aria-hidden="true"><i /><ArrowRight size={14} /></div>
          <section className="nb-node nb-node-approval"><span className="nb-node-label"><ShieldCheck size={15} />Human approval</span><h4>Your team owns the decision.</h4><p>Review the audience, evidence and proposed action. Approved next steps can move into your existing sales process.</p><div className="nb-node-tag"><Check size={12} />No action from this preview</div></section>
        </div>
        <div className="nb-brief-output"><FileText size={18} /><div><strong>A buyer brief your team can use.</strong><p>Service fit + decision-maker role + evidence + recommended next step.</p></div></div>
      </div>
    </div>
    <div className="nb-disclosure"><p>Catalog mappings are planning hypotheses, not verified prospects or evidence of purchase intent. We confirm fit, authority and permissions for your deployment.</p><details><summary>Research sources considered during scoping</summary><p>{buyer.profile.research.length ? buyer.profile.research.join(" · ") : "Customer enquiries and records shared with permission."}</p><p>Source availability and any required integrations are confirmed in scope. This diagram does not represent active data connections.</p></details></div>
  </figure>;
}
