"use client";

import { ProposalLink } from "@/components/marketing/ProposalLink";
import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Search, X } from "lucide-react";
import { filterMarketGroups, type MarketGroup } from "@/lib/market-experience";
import "./market-directory.css";

export function MarketDirectory({ groups, label, placeholder, showFilters = false, groupLabel = "Region", itemLabel = "destination", proposalFocus }: {
  groups: MarketGroup[]; label: string; placeholder: string; showFilters?: boolean;
  groupLabel?: string; itemLabel?: "city" | "destination"; proposalFocus?: string;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const inputId = useId();
  const resultsId = useId();
  const groupId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => filterMarketGroups(groups, query, active), [groups, query, active]);
  const destinations = filtered.flatMap(group => group.items.map(item => ({ ...item, group: group.name })));
  const total = destinations.length;
  const plural = itemLabel === "city" ? "cities" : "destinations";
  const clearSearch = () => { setQuery(""); searchRef.current?.focus(); };
  const reset = () => { setQuery(""); setActive("all"); searchRef.current?.focus(); };

  return <div className="mx-directory">
    <div className="mx-directory-toolbar">
      <div className="mx-search">
        <label htmlFor={inputId}>{label}</label>
        <div><Search size={18} aria-hidden="true" /><input ref={searchRef} id={inputId} type="search" placeholder={placeholder} value={query} onChange={event => setQuery(event.target.value)} aria-controls={resultsId} />
          <button type="button" onClick={clearSearch} aria-label="Clear search" disabled={!query}><X size={17} aria-hidden="true" /></button>
        </div>
      </div>
      {!showFilters && groups.length > 1 && <div className="mx-group-filter"><label htmlFor={groupId}>{groupLabel}</label><select id={groupId} value={active} onChange={event => setActive(event.target.value)} aria-controls={resultsId}><option value="all">All {groupLabel.toLowerCase()}s</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>}
      <p className="mx-result-count" role="status" aria-atomic="true"><strong>{total}</strong> {total === 1 ? itemLabel : plural}{query.trim() && " found"}</p>
    </div>
    {showFilters && <div className="mx-region-filters" role="group" aria-label="Filter by region"><button type="button" aria-pressed={active === "all"} onClick={() => setActive("all")}>All regions</button>{groups.map(group => <button type="button" key={group.id} aria-pressed={active === group.id} onClick={() => setActive(group.id)}>{group.name}</button>)}</div>}
    <div id={resultsId} className="mx-directory-results">
      {total ? <ul className="mx-destination-list" aria-label="Service-area destinations">{destinations.map(item => <li key={item.href}><Link href={item.href} prefetch={false}><span><strong>{item.name}</strong><small>{item.detail ? `${item.group} · ${item.detail}` : item.group}</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link></li>)}</ul> : <div className="mx-search-empty"><Search size={24} aria-hidden="true" /><h3>No matching location.</h3><p>Try another city or area, or reset the filters to see every location in this directory.</p><button type="button" onClick={reset}>Reset search <ArrowRight size={16} aria-hidden="true" /></button></div>}
    </div>
    <div className="mx-directory-footer"><div><strong>More than one service area?</strong><p>Tell us where you work. We’ll scope the right implementation.</p></div><ProposalLink focus={proposalFocus} className="btn btn-outline">Begin Step-1 <ArrowRight size={16} aria-hidden="true" /></ProposalLink></div>
  </div>;
}
