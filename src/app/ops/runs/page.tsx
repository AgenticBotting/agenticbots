import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { RunsTable } from "@/components/platform/lists";
import { isActive } from "@/server/services/runs";
import { runsByDay } from "@/server/services/queries";
import { Kpi, KpiRow } from "@/components/platform/viz";
import { OperationsChart } from "@/components/platform/operations-chart";
import { compact, isoDaysAgo, usd } from "@/lib/platform/format";
import { Activity, CheckCircle2, Clock, DollarSign } from "lucide-react";

export const metadata = { title: "Runs" };

export default async function RunsPage({ searchParams }: { searchParams: Promise<{ status?: string; bot?: string; client?: string; limit?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const allRuns = (await r.list("runs", { limit: 500 })).filter((x) => L.visible(x.orgId) && (!sp.client || x.orgId === sp.client));
  let runs = allRuns;
  const days = runsByDay(allRuns, 14);
  const limit = Math.min(500, Math.max(25, Number(sp.limit) || 30));
  const weekAgo = isoDaysAgo(7);
  const week = allRuns.filter((x) => x.createdAt >= weekAgo);
  const done = week.filter((x) => x.status === "completed").length;
  const bad = week.filter((x) => x.status === "failed" || x.status === "interrupted").length;
  const durations = week.filter((x) => x.startedAt && x.endedAt).map((x) => Date.parse(x.endedAt!) - Date.parse(x.startedAt!)).sort((a, b) => a - b);
  const medianMin = durations.length ? Math.round(durations[Math.floor((durations.length - 1) / 2)] / 60_000) : null;
  const cost = week.reduce((s, x) => s + (x.estimatedCostUsd ?? 0), 0);
  const tokens = week.reduce((s, x) => s + x.usage.inputTokens + x.usage.outputTokens, 0);
  const n = (f: (x: (typeof allRuns)[number]) => boolean) => allRuns.filter(f).length;
  if (sp.status === "active") runs = runs.filter((x) => isActive(x.status));
  else if (sp.status === "failed") runs = runs.filter((x) => x.status === "failed" || x.status === "interrupted");
  else if (sp.status) runs = runs.filter((x) => x.status === sp.status);
  if (sp.bot) runs = runs.filter((x) => x.botId === sp.bot);
  if (sp.client) runs = runs.filter((x) => x.orgId === sp.client);
  const q = (s: string) => `/ops/runs?${new URLSearchParams({ ...(sp.client ? { client: sp.client } : {}), ...(sp.bot ? { bot: sp.bot } : {}), ...(s ? { status: s } : {}) })}`;
  return (
    <>
      <PageHead title="Runs" description="Every Bot Run. Open one for its timeline, usage and runtime identifiers." />
      <KpiRow cols={4}>
        <Kpi icon={Activity} value={week.length} label="Runs, last 7 days" spark={days.slice(-7).map((x) => x.completed + x.failed + x.other)} hint={`${allRuns.filter((x) => isActive(x.status)).length} running now`} />
        <Kpi icon={CheckCircle2} value={done + bad ? `${Math.round((done / (done + bad)) * 100)}%` : "—"} label="Success rate, 7 days" tone={bad ? "watch" : undefined} meter={done + bad ? { pct: (done / (done + bad)) * 100, tone: bad / (done + bad) > 0.2 ? "bad" : undefined } : undefined} hint={`${done} completed, ${bad} failed`} />
        <Kpi icon={Clock} value={medianMin === null ? "—" : `${medianMin} min`} label="Typical run time" hint="Median of finished runs, 7 days" />
        <Kpi icon={DollarSign} value={usd(cost, 2)} label="Est. model cost, 7 days" hint={`${compact(tokens)} tokens`} />
      </KpiRow>

      <Panel title="Runs per day" sub="Last 14 days" className="mb-4">
        <OperationsChart dates={days.map(x=>x.date)} series={[
          {label:"Completed",values:days.map(x=>x.completed)},
          {label:"Failed / interrupted",values:days.map(x=>x.failed)},
          {label:"Other states",values:days.map(x=>x.other)},
        ]}/>
      </Panel>

      <FilterLinks current={sp.status ?? ""} items={[
        { key: "", label: "All", href: q(""), count: allRuns.length }, { key: "active", label: "Active", href: q("active"), count: n((x) => isActive(x.status)) },
        { key: "waiting_for_approval", label: "Waiting for approval", href: q("waiting_for_approval"), count: n((x) => x.status === "waiting_for_approval") },
        { key: "failed", label: "Failed", href: q("failed"), count: n((x) => x.status === "failed" || x.status === "interrupted") }, { key: "completed", label: "Completed", href: q("completed"), count: n((x) => x.status === "completed") },
        { key: "cancelled", label: "Cancelled", href: q("cancelled"), count: n((x) => x.status === "cancelled") },
      ]} />
      <form className="pf-filters">
        <input type="hidden" name="status" value={sp.status ?? ""} />
        <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <button className="btn btn-outline" type="submit">Apply</button>
      </form>
      <Panel flush>
        <RunsTable runs={runs.slice(0, limit)} names={{ orgs: L.orgs, bots: L.bots }} />
        {runs.length > limit && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)] pf-small">
            <span className="pf-muted">Showing {limit} of {runs.length} runs</span>
            <a className="btn btn-outline" href={`${q(sp.status ?? "")}&limit=${limit + 50}`}>Show 50 more</a>
          </div>
        )}
      </Panel>
    </>
  );
}
