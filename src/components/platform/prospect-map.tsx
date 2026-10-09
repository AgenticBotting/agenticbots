"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Network } from "lucide-react";
export interface ProspectMapRow { id:string; name:string; buyers:{name:string; roles:string[]; status:string; motion:string}[] }
export function ProspectMap({niches}:{niches:ProspectMapRow[]}) {
  const [selected,setSelected]=useState(niches[0]?.id);
  const current=niches.find(n=>n.id===selected) ?? niches[0];
  if(!current) return <p className="oc-note">Import the niche and buyer ontology to inspect relationships.</p>;
  return <div className="oc-prospect-map">
    <div className="oc-map-niches"><span className="oc-note">Choose a service niche</span>{niches.map(n=><button type="button" aria-pressed={n.id===current.id} key={n.id} onClick={()=>setSelected(n.id)}>{n.name}<ArrowRight size={16} aria-hidden="true"/></button>)}</div>
    <div className="oc-map-hub"><Network size={32} aria-hidden="true"/><strong>Buyer fit</strong><p>Recorded relationships<br/>from your shared ontology</p><Link href={`/ops/prospecting/niches/${current.id}`}>Inspect all mappings →</Link></div>
    <div className="oc-map-buyers" aria-live="polite"><span className="oc-note">Example mapped buyers · {current.name}</span>{current.buyers.length ? current.buyers.map(b=><article key={b.name}><Building2 size={18} aria-hidden="true"/><div><strong>{b.name}</strong><p>{b.roles.join(" · ") || "Decision-maker roles not recorded"}</p><small>{b.motion.replaceAll("_"," ")} · {b.status.replaceAll("_"," ")}</small></div></article>) : <p className="oc-note">No approved or automatically accepted mappings yet.</p>}</div>
  </div>;
}
