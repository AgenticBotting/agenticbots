import Link from "next/link";
import { ArrowUpRight, Layers, Users } from "lucide-react";
import { PageHead, Bar, FilterLinks, Empty } from "@/components/platform/ui";
import { pageCtx } from "../_lib";

export const metadata = { title: "Service niches" };

export default async function NichesPage({ searchParams }: { searchParams: Promise<{ tier?: string; q?: string; sells?: string; page?: string }> }) {
  const { ctx } = await pageCtx();
  const sp = await searchParams;
  const tier = sp.tier ?? "all";
  const [niches, rels] = await Promise.all([ctx.store.list("pg_niches"), ctx.store.list("pg_relationships")]);
  const mapped = new Map<string, number>();
  for (const r of rels) if (r.status === "approved" || r.status === "auto_approved") mapped.set(r.nicheId, (mapped.get(r.nicheId) ?? 0) + 1);
  const q = (sp.q ?? "").toLowerCase().trim();
  const rows = niches.filter(n => tier === "all" || n.tier === tier)
    .filter(n => !sp.sells || n.sellsTo === sp.sells)
    .filter(n => !q || `${n.name} ${n.category}`.toLowerCase().includes(q))
    .sort((a,b) => b.attractiveness.total - a.attractiveness.total || a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(rows.length / 24));
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.page ?? "1") || 1));
  const href = (t = tier, p = 1) => `/ops/prospecting/niches?${new URLSearchParams({tier:t, ...(q ? {q} : {}), ...(sp.sells ? {sells:sp.sells} : {}), page:String(p)})}`;
  return <>
    <PageHead title="Service niches" description="Explore the services your clients sell and the buyers mapped to them. Scores express a strategy model; open a niche to inspect the reasoning." />
    <FilterLinks current={tier} items={["all","A","B","C"].map(t=>({key:t,label:t === "all" ? "All niches" : `Tier ${t}`,href:href(t),count:niches.filter(n=>t === "all" || n.tier === t).length}))}
      trailing={<form className="flex gap-2"><input type="hidden" name="tier" value={tier}/>{sp.sells && <input type="hidden" name="sells" value={sp.sells}/>}<input name="q" defaultValue={sp.q} placeholder="Find a service niche" className="field" aria-label="Search niches"/><button className="btn btn-outline">Search</button></form>}/>
    <div className="oc-directory-meta"><span>{rows.length} matching niches · ranked by modeled score</span><span>Page {page} of {pages}</span></div>
    {!rows.length && <Empty title="No niches match">Try a broader service name or another tier.</Empty>}
    <div className="pf-cards">
      {rows.slice((page-1)*24,page*24).map(n=><Link className="pf-card-x oc-directory-card" key={n.id} href={`/ops/prospecting/niches/${n.id}`}>
        <div className="flex justify-between items-center"><span className="oc-note flex gap-2 items-center"><Layers size={16}/>{n.category}</span><span className={`pf-tag${n.tier === "A" ? " accent" : ""}`}>Tier {n.tier}</span></div>
        <h2 className="title">{n.name}</h2>
        <div className="oc-niche-score"><div><span>Modeled fit</span><strong>{n.attractiveness.total}<small>/100</small></strong></div><Bar pct={n.attractiveness.total}/></div>
        <div className="oc-directory-footer"><span className="flex gap-2 items-center"><Users size={16}/>{mapped.get(n.id) ?? 0} mapped buyers</span><ArrowUpRight size={19}/></div>
      </Link>)}
    </div>
    <nav aria-label="Niche pages" className="oc-pagination">{page > 1 && <Link className="btn btn-outline" href={href(tier,page-1)}>Previous</Link>}{page < pages && <Link className="btn btn-outline" href={href(tier,page+1)}>Next 24 niches →</Link>}</nav>
  </>;
}
