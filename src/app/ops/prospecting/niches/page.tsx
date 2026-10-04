import Link from "next/link";
import { PageHead, Panel, Table, FilterLinks } from "@/components/platform/ui";
import { Bar } from "@/components/platform/ui";
import { pageCtx } from "../_lib";

export const metadata = { title: "Service niches" };

export default async function NichesPage({ searchParams }: { searchParams: Promise<{ tier?: string; q?: string; sells?: string }> }) {
  const { ctx } = await pageCtx();
  const sp = await searchParams;
  const tier = sp.tier ?? "all";
  const [niches, rels] = await Promise.all([ctx.store.list("pg_niches"), ctx.store.list("pg_relationships")]);
  const mapped = new Map<string, number>();
  for (const r of rels) if (r.status !== "rejected" && r.status !== "needs_review") mapped.set(r.nicheId, (mapped.get(r.nicheId) ?? 0) + 1);
  const q = (sp.q ?? "").toLowerCase();
  const rows = niches
    .filter((n) => tier === "all" || n.tier === tier)
    .filter((n) => !sp.sells || n.sellsTo === sp.sells)
    .filter((n) => !q || n.name.toLowerCase().includes(q) || n.category.toLowerCase().includes(q))
    .sort((a, b) => b.attractiveness.total - a.attractiveness.total || a.name.localeCompare(b.name));
  const count = (t: string) => niches.filter((n) => t === "all" || n.tier === t).length;
  return (
    <>
      <PageHead title="Service niches" description="Ranked by a modeled attractiveness score for AgenticBots — a strategy model, not an objective fact. Open a niche to see every component and its reasoning." />
      <FilterLinks
        current={tier}
        items={["all", "A", "B", "C"].map((t) => ({ key: t, label: t === "all" ? "All" : `Tier ${t}`, href: `/ops/prospecting/niches?tier=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`, count: count(t) }))}
        trailing={
          <form className="flex gap-2">
            <input type="hidden" name="tier" value={tier} />
            <input name="q" defaultValue={sp.q} placeholder="Search niches" className="field" aria-label="Search niches" />
          </form>
        }
      />
      <Panel flush>
        <Table head={["Niche", "Category", "Sells to", "Score", "", "Tier", "Mapped buyers"]}>
          {rows.map((n) => (
            <tr key={n.id}>
              <td><Link href={`/ops/prospecting/niches/${n.id}`} className="font-semibold hover:underline">{n.name}</Link></td>
              <td className="pf-muted">{n.category}</td>
              <td>{n.sellsTo}</td>
              <td className="num">{n.attractiveness.total}</td>
              <td style={{ width: 120 }}><Bar pct={n.attractiveness.total} /></td>
              <td><span className={`pf-tag${n.tier === "A" ? " accent" : ""}`}>{n.tier}</span></td>
              <td className="num">{mapped.get(n.id) ?? 0}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
