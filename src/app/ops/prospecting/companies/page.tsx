import { PageHead, Panel, Table, Empty, When } from "@/components/platform/ui";
import { pageCtx } from "../_lib";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { ctx } = await pageCtx();
  const q = ((await searchParams).q ?? "").toLowerCase().trim();
  const [companies, buyers, sources] = await Promise.all([ctx.store.list("pg_companies"), ctx.store.list("pg_buyer_types"), ctx.store.list("pg_company_sources")]);
  const bn = new Map(buyers.map((b) => [b.id, b.name]));
  const srcCount = new Map<string, number>();
  for (const s of sources) srcCount.set(s.companyId, (srcCount.get(s.companyId) ?? 0) + 1);
  const rows = companies
    .filter((c) => !q || c.canonicalName.toLowerCase().includes(q) || c.domain?.includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q)))
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName))
    .slice(0, 300);
  return (
    <>
      <PageHead title="Companies" description="The shared company identity graph. One record per real company, resolved across sources by domain, phone, and name + location; every source record is kept. Contains no client-private data." />
      <form className="pf-filters"><input name="q" defaultValue={q} className="field" placeholder="Search name, domain or alias" aria-label="Search companies" /><button className="btn btn-outline">Search</button></form>
      <Panel flush>
        <Table head={["Company", "Domain", "Location", "Buyer type", "Sources", "Identity", "Last seen"]} empty={<Empty title="No companies yet">Run discovery on a market.</Empty>}>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.canonicalName}</strong>{c.demo && <span className="pf-tag ml-1">demo</span>}{c.aliases.length > 0 && <div className="pf-small pf-muted">aka {c.aliases.join(", ")}</div>}</td>
              <td>{c.domain ?? "—"}</td>
              <td className="pf-small">{[c.locations[0]?.city, c.locations[0]?.state].filter(Boolean).join(", ")}{c.locations.length > 1 ? ` +${c.locations.length - 1}` : ""}</td>
              <td className="pf-small">{c.buyerTypeIds.map((id) => bn.get(id)).join(", ") || "Unclassified"}</td>
              <td className="num">{srcCount.get(c.id) ?? 0}</td>
              <td className="num">{Math.round(c.identityConfidence * 100)}%</td>
              <td><When iso={c.lastSeenAt} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
      {companies.length > rows.length && <p className="pf-small pf-muted mt-2">Showing {rows.length} of {companies.length.toLocaleString()}. Search to narrow.</p>}
    </>
  );
}
