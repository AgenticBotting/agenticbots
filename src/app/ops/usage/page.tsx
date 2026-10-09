import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, Table, BotName, Empty } from "@/components/platform/ui";
import { BarRows, Kpi, KpiRow } from "@/components/platform/viz";
import { Activity, CircleDollarSign, Cpu, Server, TrendingUp } from "lucide-react";
import { compact, usd, money } from "@/lib/platform/format";

export const metadata = { title: "Usage & Cost" };

export default async function UsagePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const actor = await requireOperatorPage();
  const r = await repo();
  const L = await lookups(r, actor);
  const period = (await searchParams).period ?? new Date().toISOString().slice(0, 7);
  const [rollups, runtimes, agreements, providers] = await Promise.all([r.list("usage_rollups"), r.list("runtimes"), r.list("service_agreements"), r.list("provider_configurations")]);
  const rows = rollups.filter((u) => u.period === period && L.visible(u.orgId));
  const periods = [...new Set(rollups.map((u) => u.period))].sort().reverse();
  const byClient = L.orgList.map((o) => {
    const rs = rows.filter((u) => u.orgId === o.id);
    const model = rs.reduce((s, u) => s + u.modelCostUsd, 0);
    const infra = runtimes.filter((rt) => rt.orgId === o.id && rt.deploymentState !== "not_provisioned").reduce((s, rt) => s + rt.estimatedMonthlyCostUsd, 0);
    const ag = agreements.find((a) => a.orgId === o.id && (a.status === "active" || a.status === "past_due"));
    const revenue = ag ? ag.monthlyValueCents / 100 : undefined;
    return { org: o, runs: rs.reduce((s, u) => s + u.runs, 0), tokens: rs.reduce((s, u) => s + u.usage.inputTokens + u.usage.outputTokens, 0), model, infra, revenue };
  });
  const totalModel = byClient.reduce((s, x) => s + x.model, 0);
  const totalInfra = byClient.reduce((s, x) => s + x.infra, 0);
  const totalRevenue = byClient.reduce((s, x) => s + (x.revenue ?? 0), 0);
  return (
    <>
      <PageHead title="Usage & Cost" description="Estimates from operator-entered model rates and instance costs. Internal only — margins are never shown to clients." />
      <form className="pf-filters"><select name="period" defaultValue={period} className="field" aria-label="Month">{periods.map((p) => <option key={p}>{p}</option>)}</select><button className="btn btn-outline">Show</button></form>
      <KpiRow cols={5}>
        <Kpi icon={Activity} value={byClient.reduce((s, x) => s + x.runs, 0)} label="Bot Runs" hint={`${compact(byClient.reduce((s, x) => s + x.tokens, 0))} tokens`} />
        <Kpi icon={Cpu} value={usd(totalModel)} label="Model cost (est.)" hint="From operator-entered rates" />
        <Kpi icon={Server} value={usd(totalInfra, 0)} label="Infrastructure (est.)" hint={`${byClient.filter((x) => x.infra > 0).length} runtimes`} />
        <Kpi icon={CircleDollarSign} value={money(Math.round(totalRevenue * 100))} label="Contract revenue" hint="Monthly recurring" />
        <Kpi icon={TrendingUp} value={usd(totalRevenue - totalModel - totalInfra, 0)} label="Est. contribution" meter={totalRevenue ? { pct: ((totalRevenue - totalModel - totalInfra) / totalRevenue) * 100 } : undefined} hint={totalRevenue ? `${Math.round(((totalRevenue - totalModel - totalInfra) / totalRevenue) * 100)}% of revenue` : "No active agreements"} />
      </KpiRow>
      <p className="oc-note mb-6">Estimates exclude labor, data vendors, taxes and other overhead. Contract values and infrastructure are current snapshots; changing the month selects usage only. Contribution is not accounting profit or cash received.</p>
      <div className="pf-grid">
        <div className="pf-grid pf-grid-2">
          <Panel title="Contribution by client" sub="Current contract value less selected model usage and current infrastructure estimate">
            <BarRows
              rows={byClient
                .map((x) => ({ x, m: x.revenue !== undefined ? x.revenue - x.model - x.infra : -(x.model + x.infra) }))
                .sort((a, b) => b.m - a.m)
                .map(({ x, m }) => ({
                  key: x.org.id,
                  label: x.org.name,
                  sub: x.revenue !== undefined ? `${usd(x.revenue, 0)} revenue, ${usd(x.model + x.infra, 0)} cost` : `No active agreement, ${usd(x.model + x.infra, 0)} cost`,
                  value: Math.max(0, m),
                  tone: x.revenue === undefined ? ("quiet" as const) : m < 0 ? ("bad" as const) : ("good" as const),
                  display: x.revenue !== undefined ? `${usd(m, 0)}` : "—",
                  href: `/ops/clients/${x.org.id}?tab=usage`,
                }))}
            />
          </Panel>
          <Panel title="Model cost by Bot" sub="Highest first">
            <BarRows
              rows={[...rows].sort((a, b) => b.modelCostUsd - a.modelCostUsd).slice(0, 8).map((u) => {
                const b = L.bots.get(u.botId);
                return {
                  key: u.id,
                  label: b?.name ?? "Bot",
                  sub: `${L.orgs.get(u.orgId)}, ${u.runs} runs${u.failedRuns ? `, ${u.failedRuns} failed` : ""}`,
                  value: u.modelCostUsd,
                  display: usd(u.modelCostUsd),
                  href: b ? `/ops/bots/${b.id}` : undefined,
                };
              })}
            />
          </Panel>
        </div>
        <details className="pf-disclosure">
          <summary>Detailed tables</summary>
          <div className="body pf-grid">
            <Panel title="Cost per client" flush>
              <Table head={["Client", "Runs", "Tokens", "Model", "Infrastructure", "Revenue", "Est. margin"]} empty={<Empty title="No usage" />}>
                {byClient.map((x) => <tr key={x.org.id}><td>{x.org.name}</td><td className="num">{x.runs}</td><td className="num">{compact(x.tokens)}</td><td className="num">{usd(x.model)}</td><td className="num">{usd(x.infra, 0)}</td><td className="num">{x.revenue !== undefined ? usd(x.revenue, 0) : "—"}</td><td className="num">{x.revenue !== undefined ? usd(x.revenue - x.model - x.infra, 0) : "—"}</td></tr>)}
              </Table>
            </Panel>
            <Panel title="Cost per Bot" flush>
              <Table head={["Bot", "Client", "Runs", "Failed", "Input", "Output", "Cache reads", "Est. cost"]} empty={<Empty title="No usage" />}>
                {[...rows].sort((a, b) => b.modelCostUsd - a.modelCostUsd).map((u) => { const b = L.bots.get(u.botId); return <tr key={u.id}><td>{b ? <BotName typeKey={b.typeKey} name={b.name} href={`/ops/bots/${b.id}`} /> : "—"}</td><td>{L.orgs.get(u.orgId)}</td><td className="num">{u.runs}</td><td className="num">{u.failedRuns}</td><td className="num">{compact(u.usage.inputTokens)}</td><td className="num">{compact(u.usage.outputTokens)}</td><td className="num">{compact(u.usage.cacheReadTokens)}</td><td className="num">{usd(u.modelCostUsd)}</td></tr>; })}
              </Table>
            </Panel>
          </div>
        </details>
        <Panel title="Model rates in use" sub="Edit in Settings" flush>
          <Table head={["Provider", "Model", "Input $/M", "Output $/M", "Cache read $/M", "Status"]}>
            {providers.flatMap((p) => p.models.map((m) => <tr key={`${p.provider}${m.id}`}><td>{p.displayName}</td><td className="pf-mono">{m.id}</td><td className="num">{m.inputPerM}</td><td className="num">{m.outputPerM}</td><td className="num">{m.cacheReadPerM ?? "—"}</td><td className="pf-small">{p.status}{p.note ? <div className="pf-muted">{p.note}</div> : null}</td></tr>))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
