"use client";

import { ProposalLink } from "@/components/marketing/ProposalLink";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { filterMarketGroups, type MarketGroup } from "@/lib/market-experience";

export function MarketDirectory({ groups, label, placeholder, showFilters = false }: {
  groups: MarketGroup[]; label: string; placeholder: string; showFilters?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const inputId = useId();
  const resultsId = useId();
  const filtered = useMemo(() => filterMarketGroups(groups, query, active), [groups, query, active]);
  const total = filtered.reduce((sum, group) => sum + group.items.length, 0);
  const reset = () => { setQuery(""); setActive("all"); };
  return <div className="mx-directory">
    <div className="mx-directory-toolbar">
      <div className="mx-search"><label htmlFor={inputId}>{label}</label><div><Search size={18} /><input id={inputId} type="search" placeholder={placeholder} value={query} onChange={event => setQuery(event.target.value)} aria-controls={resultsId} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div></div>
      <p role="status">{total} {total === 1 ? "destination" : "destinations"}{query && " found"}</p>
    </div>
    {showFilters && <div className="mx-region-filters" role="group" aria-label="Filter by region"><button type="button" aria-pressed={active === "all"} onClick={() => setActive("all")}>All regions</button>{groups.map(group => <button type="button" key={group.id} aria-pressed={active === group.id} onClick={() => setActive(group.id)}>{group.name}</button>)}</div>}
    <div id={resultsId} className="mx-directory-results">
      {filtered.length ? filtered.map(group => <section key={group.id} className="mx-destination-group"><h3>{group.name}<span>{group.items.length}</span></h3><ul>{group.items.map(item => <li key={item.href}><Link href={item.href}><span><strong>{item.name}</strong>{item.detail && <small>{item.detail}</small>}</span><ArrowRight size={16} /></Link></li>)}</ul></section>) : <div className="mx-search-empty"><Search size={25} /><h3>No matching destination.</h3><p>Try a city, metro or state name from this directory. Your service area can also be discussed during proposal scoping.</p><div><button type="button" onClick={reset}>Reset search</button><ProposalLink >Discuss your service area <ArrowRight size={15} /></ProposalLink></div></div>}
    </div>
  </div>;
}
