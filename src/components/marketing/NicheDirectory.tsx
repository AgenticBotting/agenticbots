"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { filterNicheDirectory, type NicheDirectoryEntry, type BuyerDirectoryEntry } from "@/lib/niche-directory";

export function NicheDirectory({ niches, buyers, basePath = "/industries" }: { niches: NicheDirectoryEntry[]; buyers: BuyerDirectoryEntry[]; basePath?: string }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [buyer, setBuyer] = useState("");
  const categories = [...new Set(niches.map(niche => niche.category))].sort();
  const results = filterNicheDirectory(niches, query, category, buyer);
  const filtered = Boolean(query.trim() || category || buyer);
  function reset() { setQuery(""); setCategory(""); setBuyer(""); }
  return <>
    <div className="nd-controls">
      <div><label htmlFor={`${id}-search`}>Find your service</label><input id={`${id}-search`} type="search" placeholder="Roofing, HVAC, fleet maintenance…" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div><label htmlFor={`${id}-category`}>Service category</label><select id={`${id}-category`} value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
      <div><label htmlFor={`${id}-buyer`}>Who you sell to</label><select id={`${id}-buyer`} value={buyer} onChange={event => setBuyer(event.target.value)}><option value="">All buyer types</option>{buyers.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
    </div>
    <div className="nd-results-line"><p role="status">{results.length} of {niches.length} service niches{buyer ? " with an included catalog relationship" : ""}</p>{filtered && <button type="button" onClick={reset}>Clear filters</button>}</div>
    {results.length ? <div className="nd-groups">{categories.map((item, index) => {
      const group = results.filter(niche => niche.category === item);
      return group.length ? <details className="nd-group" key={`${item}-${filtered}`} open={filtered || index === 0}>
        <summary><span>{item}<small>{group.length} {group.length === 1 ? "niche" : "niches"}</small></span><ChevronDown size={17} /></summary>
        <ul className="nd-list">{group.map(niche => <li key={niche.slug}><Link href={`${basePath}/niches/${niche.slug}`}><strong>{niche.name}</strong><small>{niche.buyers.length ? "Explore buyer roles and the marketing approach" : "Define your buyer profile and marketing approach"}</small><ArrowRight size={15} /></Link></li>)}</ul>
      </details> : null;
    })}</div> : <div className="nd-empty"><h3>{buyer ? "This buyer relationship needs scoping." : "No services match these filters."}</h3><p>{buyer ? "This buyer type is in the catalog, but no included niche relationship matches your filters. We confirm the fit before recommending an audience." : "Try a broader service name or clear your category and buyer filters."}</p></div>}
    <details className="nd-buyer-glossary"><summary>Explore all {buyers.length} buyer types and typical decision-making roles</summary><p className="nd-glossary-note">A planning taxonomy, not a list of prospects. Roles and buying authority are verified for each business. Some buyer types do not yet have an included niche relationship.</p><ul className="nd-buyer-list">{buyers.map(item => <li key={item.slug}><strong>{item.name}</strong><p>{item.segment}</p><p>{item.roles.join(" · ")}</p></li>)}</ul></details>
  </>;
}
