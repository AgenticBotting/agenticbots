import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { lookups } from "@/server/services/lookups";
import { PageHead, When, Empty } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { titleCase } from "@/lib/platform/format";

export const metadata = { title: "Audit Log" };
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ client?: string; action?: string; page?:string; result?:string }> }) {
  const actor=await requireOperatorPage();
  if(!can(actor,"ops.audit.read")) return <Empty title="You do not have access to the audit log"/>;
  const sp=await searchParams; const r=await repo(); const L=await lookups(r,actor);
  const all=(await r.list("audit_logs")).filter(a=>!a.orgId || L.visible(a.orgId));
  const rows=all.filter(a=>(!sp.client || a.orgId===sp.client) && (!sp.action || a.action.toLowerCase().includes(sp.action.toLowerCase())) && (!sp.result || a.result===sp.result));
  const pages=Math.max(1,Math.ceil(rows.length/30)); const page=Math.min(pages,Math.max(1,Math.floor(Number(sp.page)) || 1));
  const href=(n:number)=>`/ops/audit?${new URLSearchParams({...sp,page:String(n)})}`;
  return <><PageHead title="Audit history" description="A readable record of operator and BOT decisions. Open an event for its underlying details; the original history is preserved."/>
    <form className="pf-filters">
      <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>
      <input name="action" defaultValue={sp.action} className="field" placeholder="Search actions, e.g. billing" aria-label="Action"/>
      <select name="result" defaultValue={sp.result ?? ""} className="field" aria-label="Result"><option value="">All outcomes</option><option value="success">Success</option><option value="failure">Failure</option><option value="denied">Denied</option></select><button className="btn btn-outline">Filter events</button>
    </form>
    <div className="flex justify-between items-center mb-5 oc-note"><span>{rows.length.toLocaleString()} matching events</span><span>Page {page} of {pages}</span></div>
    <div className="oc-audit">{rows.slice((page-1)*30,page*30).map(a=><details className="oc-review" key={a.id}><summary><When iso={a.createdAt}/><div><h2>{titleCase(a.action.replaceAll("."," "))}</h2><p className="oc-note">{a.actorName} · {a.orgId ? L.orgs.get(a.orgId) : "Platform"}</p></div><Status value={a.result}/></summary><div className="body"><p>{a.detail || "No additional detail recorded."}</p><dl className="pf-kv"><dt>Target</dt><dd>{a.targetType} · {a.targetId ?? "—"}</dd><dt>Correlation</dt><dd className="pf-mono">{a.correlationId}</dd><dt>Recorded at</dt><dd>{a.createdAt}</dd></dl><Link className="oc-note underline" href={`/ops/monitoring?correlation=${encodeURIComponent(a.correlationId)}`}>Inspect related log entries</Link></div></details>)}</div>
    {!rows.length && <Empty title="No matching events"/>}
    <nav className="oc-links mt-6" aria-label="Audit pages">{page>1 && <Link className="btn btn-outline" href={href(page-1)}>Previous</Link>}{page<pages && <Link className="btn btn-outline" href={href(page+1)}>Next 30 events</Link>}</nav>
  </>;
}
