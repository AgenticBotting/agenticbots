import Link from "next/link";
import { Building2, ArrowUpRight } from "lucide-react";
import { PageHead, FilterLinks, Empty } from "@/components/platform/ui";
import { recipesForBuyer } from "@/server/prospecting/ontology/discovery-recipes";
import { pageCtx } from "../_lib";

export const metadata = { title: "Buyer types" };

export default async function BuyersPage({ searchParams }: { searchParams: Promise<{ segment?: string; q?: string; page?: string }> }) {
  const { ctx } = await pageCtx();
  const sp = await searchParams;
  const [buyers,rels,niches] = await Promise.all([ctx.store.list("pg_buyer_types"),ctx.store.list("pg_relationships"),ctx.store.list("pg_niches")]);
  const nicheById = new Map(niches.map(n=>[n.id,n]));
  const segments = [...new Set(buyers.map(b=>b.segment))].sort();
  const seg = sp.segment ?? "all";
  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = buyers.filter(b=>seg === "all" || b.segment === seg).filter(b=>!q || `${b.name} ${b.decisionMakerTitles.join(" ")}`.toLowerCase().includes(q)).sort((a,b)=>a.segment.localeCompare(b.segment) || a.name.localeCompare(b.name));
  const pages = Math.max(1,Math.ceil(rows.length/18));
  const page = Math.min(pages,Math.max(1,Number.parseInt(sp.page ?? "1") || 1));
  const href = (segment = seg,p = 1) => `/ops/prospecting/buyers?${new URLSearchParams({segment,...(q ? {q} : {}),page:String(p)})}`;
  return <>
    <PageHead title="Know the buyer" description="The organizations that buy, the people who decide, and the service relationships behind your targeting. Explore one buyer profile at a time." />
    <FilterLinks current={seg} items={["all",...segments].map(s=>({key:s,label:s === "all" ? "All buyers" : s,href:href(s),count:buyers.filter(b=>s === "all" || b.segment === s).length}))}/>
    <form className="flex gap-2 mb-5"><input type="hidden" name="segment" value={seg}/><input className="field max-w-lg" name="q" defaultValue={sp.q} placeholder="Search buyer or decision-maker title" aria-label="Search buyers"/><button className="btn btn-outline">Search</button></form>
    <div className="oc-directory-meta"><span>{rows.length} matching buyer profiles</span><span>Page {page} of {pages}</span></div>
    {!rows.length && <Empty title="No buyers match">Try another organization type or role.</Empty>}
    <div className="pf-cards">
      {rows.slice((page-1)*18,page*18).map(b=>{
        const rs=rels.filter(r=>r.buyerTypeId === b.id && (r.status === "approved" || r.status === "auto_approved")).sort((x,y)=>(nicheById.get(y.nicheId)?.attractiveness.total ?? 0)-(nicheById.get(x.nicheId)?.attractiveness.total ?? 0));
        return <article className="pf-card-x oc-directory-card" key={b.id}>
          <span className="oc-note flex gap-2 items-center"><Building2 size={16}/>{b.segment}</span>
          <h2 className="title">{b.name}</h2>
          <div><h3 className="oc-field-label">Who decides</h3><div className="oc-role-tags">{b.decisionMakerTitles.slice(0,3).map(t=><span key={t}>{t}</span>)}{!b.decisionMakerTitles.length && <span>No titles recorded</span>}</div></div>
          <div><h3 className="oc-field-label">Mapped services</h3><div className="oc-buyer-links">{rs.slice(0,3).map(r=>{const n=nicheById.get(r.nicheId);return n && <Link key={r.id} href={`/ops/prospecting/niches/${n.id}`}>{n.name}<ArrowUpRight size={15}/></Link>;})}{!rs.length && <p className="oc-note">Buyer mapping needs review.</p>}</div></div>
          <details className="oc-buyer-details"><summary>Explore buyer context · {rs.length} mappings</summary><div className="grid gap-3 mt-4"><p className="oc-note"><strong>Decision titles:</strong> {b.decisionMakerTitles.join(", ") || "Not recorded"}</p><p className="oc-note"><strong>Role families:</strong> {b.roleFamilies.map(f=>f.replaceAll("_"," ")).join(", ") || "Not recorded"}</p><p className="oc-note"><strong>Discovery routes:</strong> {recipesForBuyer(b).map(r=>r.label).join(", ") || "Not recorded"}</p>{rs.length>3 && <div className="oc-buyer-links">{rs.slice(3).map(r=>{const n=nicheById.get(r.nicheId);return n && <Link key={r.id} href={`/ops/prospecting/niches/${n.id}`}>{n.name}<ArrowUpRight size={15}/></Link>;})}</div>}</div></details>
        </article>;
      })}
    </div>
    <nav aria-label="Buyer pages" className="oc-pagination">{page>1 && <Link className="btn btn-outline" href={href(seg,page-1)}>Previous</Link>}{page<pages && <Link className="btn btn-outline" href={href(seg,page+1)}>Next 18 buyers →</Link>}</nav>
  </>;
}
