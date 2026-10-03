import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, Table, Stats, Stat, BotName, Empty } from "@/components/platform/ui";
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
      <Stats>
        <Stat value={byClient.reduce((s, x) => s + x.runs, 0)} label="Bot Runs" />
        <Stat value={usd(totalModel)} label="Model cost (est.)" />
        <Stat value={usd(totalInfra, 0)} label="Infrastructure (est.)" />
        <Stat value={money(Math.round(totalRevenue * 100))} label="Contract revenue (MRR)" />
        <Stat value={usd(totalRevenue - totalModel - totalInfra, 0)} label="Est. gross margin" />
      </Stats>
      <div className="pf-grid">
        <Panel title="Cost per client" flush>
          <Table head={["Client", "Runs", "Tokens", "Model", "Infrastructure", "Revenue", "Est. margin"]} empty={<Empty title="No usage" />}>
            {byClient.map((x) => <tr key={x.org.id}><td>{x.org.name}</td><td className="num">{x.runs}</td><td className="num">{compact(x.tokens)}</td><td className="num">{usd(x.model)}</td><td className="num">{usd(x.infra, 0)}</td><td className="num">{x.revenue !== undefined ? usd(x.revenue, 0) : "—"}</td><td className="num">{x.revenue !== undefined ? usd(x.revenue - x.model - x.infra, 0) : "—"}</td></tr>)}
          </Table>
        </Panel>
        <Panel title="Cost per Bot" flush>
          <Table head={["Bot", "Client", "Runs", "Failed", "Input", "Output", "Cache reads", "Est. cost"]} empty={<Empty title="No usage" />}>
            {rows.sort((a, b) => b.modelCostUsd - a.modelCostUsd).map((u) => { const b = L.bots.get(u.botId); return <tr key={u.id}><td>{b ? <BotName typeKey={b.typeKey} name={b.name} href={`/ops/bots/${b.id}`} /> : "—"}</td><td>{L.orgs.get(u.orgId)}</td><td className="num">{u.runs}</td><td className="num">{u.failedRuns}</td><td className="num">{compact(u.usage.inputTokens)}</td><td className="num">{compact(u.usage.outputTokens)}</td><td className="num">{compact(u.usage.cacheReadTokens)}</td><td className="num">{usd(u.modelCostUsd)}</td></tr>; })}
          </Table>
        </Panel>
        <Panel title="Model rates in use" sub="Edit in Settings" flush>
          <Table head={["Provider", "Model", "Input $/M", "Output $/M", "Cache read $/M", "Status"]}>
            {providers.flatMap((p) => p.models.map((m) => <tr key={`${p.provider}${m.id}`}><td>{p.displayName}</td><td className="pf-mono">{m.id}</td><td className="num">{m.inputPerM}</td><td className="num">{m.outputPerM}</td><td className="num">{m.cacheReadPerM ?? "—"}</td><td className="pf-small">{p.status}{p.note ? <div className="pf-muted">{p.note}</div> : null}</td></tr>))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
