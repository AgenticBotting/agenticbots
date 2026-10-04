import Link from "next/link";
import { PageHead, Panel, Table, FilterLinks } from "@/components/platform/ui";
import { recipesForBuyer } from "@/server/prospecting/ontology/discovery-recipes";
import { pageCtx } from "../_lib";

export const metadata = { title: "Buyer types" };

export default async function BuyersPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const { ctx } = await pageCtx();
  const sp = await searchParams;
  const [buyers, rels, niches] = await Promise.all([ctx.store.list("pg_buyer_types"), ctx.store.list("pg_relationships"), ctx.store.list("pg_niches")]);
  const nicheName = new Map(niches.map((n) => [n.id, n]));
  const segments = [...new Set(buyers.map((b) => b.segment))].sort();
  const seg = sp.segment ?? "all";
  const rows = buyers.filter((b) => seg === "all" || b.segment === seg).sort((a, b) => a.segment.localeCompare(b.segment) || a.name.localeCompare(b.name));
  return (
    <>
      <PageHead title="Buyer types" description="Who buys contractor services, the titles that decide, and where to find them. Titles are normalized into role families so matching never depends on exact wording." />
      <FilterLinks current={seg} items={[{ key: "all", label: "All", href: "/ops/prospecting/buyers", count: buyers.length }, ...segments.map((s) => ({ key: s, label: s, href: `/ops/prospecting/buyers?segment=${encodeURIComponent(s)}`, count: buyers.filter((b) => b.segment === s).length }))]} />
      <Panel flush>
        <Table head={["Buyer type", "Kind", "Decision-maker titles", "Role families", "Top niches", "Find them via"]}>
          {rows.map((b) => {
            const rs = rels.filter((r) => r.buyerTypeId === b.id && r.status !== "rejected").sort((x, y) => (nicheName.get(y.nicheId)?.attractiveness.total ?? 0) - (nicheName.get(x.nicheId)?.attractiveness.total ?? 0));
            return (
              <tr key={b.id}>
                <td><strong>{b.name}</strong><div className="pf-small pf-muted">{b.segment}</div></td>
                <td>{b.buyerKind}</td>
                <td className="pf-small">{b.decisionMakerTitles.join(", ")}</td>
                <td className="pf-small">{b.roleFamilies.map((f) => f.replace(/_/g, " ")).join(", ")}</td>
                <td className="pf-small">
                  {rs.length === 0 ? <span className="pf-muted">Unmapped</span> : rs.slice(0, 4).map((r) => {
                    const n = nicheName.get(r.nicheId);
                    return n ? <div key={r.id}><Link className="hover:underline" href={`/ops/prospecting/niches/${n.id}`}>{n.name}</Link> <span className="pf-muted">({n.tier})</span></div> : null;
                  })}
                  {rs.length > 4 && <div className="pf-muted">+{rs.length - 4} more</div>}
                </td>
                <td className="pf-small">{recipesForBuyer(b).slice(0, 3).map((r) => r.label).join(", ") || "—"}</td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
