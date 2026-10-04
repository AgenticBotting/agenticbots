import Link from "next/link";
import { Building2, CircleDollarSign, Layers, ListChecks, Map, Target } from "lucide-react";
import { PageHead, Panel, Table, Empty, When, Banner } from "@/components/platform/ui";
import { Kpi, KpiRow, BarRows } from "@/components/platform/viz";
import { Status } from "@/components/platform/status";
import { usd } from "@/lib/platform/format";
import { isDemo } from "@/server/env";
import { ontologyOverview } from "@/server/prospecting/ontology/service";
import { listMarkets } from "@/server/prospecting/markets";
import { listJobs } from "@/server/prospecting/jobs";
import { costSummary } from "@/server/prospecting/costs";
import { pageCtx } from "./_lib";

export const metadata = { title: "Prospecting" };

export default async function ProspectingOverview() {
  const { ctx, L } = await pageCtx();
  const [o, markets, jobs, cost, prospects, companies] = await Promise.all([
    ontologyOverview(ctx.r, ctx.p),
    listMarkets(ctx),
    listJobs(ctx),
    costSummary(ctx.store, ctx.now),
    ctx.store.list("pg_prospects"),
    ctx.store.list("pg_companies"),
  ]);
  const visible = prospects.filter((p) => L.visible(p.orgId));
  const qualified = visible.filter((p) => p.status === "qualified").length;
  const noDomain = companies.filter((c) => !c.domain).length;
  return (
    <>
      <PageHead
        title="Prospect Graph"
        description="Service niches, the buyers who purchase them, and the client markets built on top. Shared market intelligence is separate from each client's private prospects."
        actions={<Link href="/ops/prospecting/markets" className="btn btn-primary">New market</Link>}
      />
      {o.niches === 0 && !isDemo() && (
        <Banner tone="watch">The ontology is not loaded yet. Run <code>npm run prospecting:seed</code> once for this environment.</Banner>
      )}
      <KpiRow cols={6}>
        <Kpi icon={Layers} value={o.niches} label="Niches" hint={`${o.tiers.A} Tier A · ${o.tiers.B} B · ${o.tiers.C} C`} href="/ops/prospecting/niches" />
        <Kpi icon={Building2} value={o.buyers} label="Buyer types" hint={`${o.unmappedBuyers.length} unmapped`} href="/ops/prospecting/buyers" />
        <Kpi icon={ListChecks} value={o.byStatus.needs_review ?? 0} label="To review" hint={`of ${o.relationships.toLocaleString()} relationships`} href="/ops/prospecting/review" tone={(o.byStatus.needs_review ?? 0) > 0 ? "watch" : undefined} />
        <Kpi icon={Map} value={markets.length} label="Markets" href="/ops/prospecting/markets" />
        <Kpi icon={Target} value={qualified} label="Qualified" hint={`of ${visible.length} prospects`} />
        <Kpi icon={CircleDollarSign} value={usd(cost.monthUsd)} label="Spend (month)" hint={`${cost.paidCalls} paid · ${cost.freeCalls} free calls`} href="/ops/prospecting/providers" />
      </KpiRow>
      <div className="pf-grid pf-grid-2">
        <Panel title="Markets" sub="Qualified prospects per market" flush={markets.length === 0}>
          {markets.length === 0 ? (
            <Empty title="No markets yet"><Link href="/ops/prospecting/markets" className="underline">Create one</Link> from a niche and a geography.</Empty>
          ) : (
            <BarRows
              rows={markets.map((m) => {
                const ps = visible.filter((p) => p.marketId === m.id);
                const q = ps.filter((p) => p.status === "qualified").length;
                return { key: m.id, label: m.name, sub: `${L.orgs.get(m.orgId) ?? "Client"} · ${ps.length} prospects`, value: q, display: `${q} qualified`, href: `/ops/prospecting/markets/${m.id}` };
              })}
            />
          )}
        </Panel>
        <Panel title="Data health" sub="Shared graph">
          <Table head={["Check", "Result"]}>
            <tr><td>Companies in the graph</td><td>{companies.length.toLocaleString()}{companies.some((c) => c.demo) ? " (includes demo)" : ""}</td></tr>
            <tr><td>Companies without a domain</td><td>{noDomain}</td></tr>
            <tr><td>Buyer types with no niche mapped</td><td>{o.unmappedBuyers.length ? o.unmappedBuyers.map((b) => b.name).join(", ") : "None"}</td></tr>
            {o.lastImports.slice(0, 2).map((i) => (
              <tr key={`${i.kind}${i.at}`}><td>Last {i.kind === "niches" ? "niche" : "buyer type"} import</td><td><When iso={i.at} /> · {i.inserted} new, {i.updated} updated, {i.unchanged} unchanged, {i.malformed} malformed, {i.duplicates} duplicates</td></tr>
            ))}
          </Table>
        </Panel>
      </div>
      <Panel title="Recent jobs" flush>
        <Table head={["Job", "Client", "Status", "Progress", "Paid calls", "Spend", "Started"]} empty={<Empty title="No jobs yet" />}>
          {jobs.slice(0, 12).map((j) => (
            <tr key={j.id}>
              <td>{j.kind.replace(/_/g, " ").toLowerCase()}{j.marketId && <> · <Link className="underline" href={`/ops/prospecting/markets/${j.marketId}`}>market</Link></>}</td>
              <td>{L.orgs.get(j.orgId) ?? "—"}</td>
              <td><Status value={j.status} />{j.pausedReason && <div className="pf-small pf-muted">{j.pausedReason}</div>}{j.error && <div className="pf-small pf-muted">{j.error}</div>}</td>
              <td>{j.progress.done}/{j.progress.total}</td>
              <td className="num">{j.paidCalls}</td>
              <td className="num">{usd(j.spendUsd)}</td>
              <td><When iso={j.startedAt ?? j.createdAt} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
