import Link from "next/link";
import { AlertTriangle, Bot as BotIcon, CircleDollarSign, Users } from "lucide-react";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { opsDashboard } from "@/server/services/queries";
import { PageHead, Panel, When, Empty, Banner } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { Avatar, Kpi, KpiRow, Lights, SegBar, TimelineList, toneFor, type Tone } from "@/components/platform/viz";
import { OperationsChart } from "@/components/platform/operations-chart";
import { money, titleCase } from "@/lib/platform/format";

export const metadata = { title: "Dashboard" };

const SEV_TONE: Record<string, Tone> = { critical: "bad", high: "bad", medium: "watch", low: "quiet" };

export default async function OpsDashboard() {
  const actor = await requireOperatorPage();
  const d = await opsDashboard(await repo(), actor);
  const runTotals = d.runsDaily.map((x) => x.completed + x.failed + x.other);
  const runs14 = runTotals.reduce((a, b) => a + b, 0);
  const failed14 = d.runsDaily.reduce((s, x) => s + x.failed, 0);
  const completed14 = d.runsDaily.reduce((s, x) => s + x.completed, 0);
  const finished14 = completed14 + failed14;
  const health = {
    healthy: d.fleet.filter((f) => f.health === "healthy").length,
    degraded: d.fleet.filter((f) => f.health === "degraded").length,
    offline: d.fleet.filter((f) => f.health === "offline").length,
    stopped: d.fleet.filter((f) => f.health === "stopped" || f.health === "unknown").length,
  };

  // One queue: incidents first (they carry severity), then other reasons a client needs a look.
  const queue: { key: string; tone: Tone; title: string; orgId: string; orgName: string; at?: string; href: string; tag: string }[] = [
    ...d.incidents.map((i) => ({
      key: i.id, tone: SEV_TONE[i.severity] ?? "quiet", title: i.title, orgId: i.orgId, orgName: d.orgNames.get(i.orgId) ?? "",
      at: i.lastSeenAt, href: `/ops/monitoring#incident-${i.id}`, tag: titleCase(i.severity),
    })),
  ];
  for (const { org, reasons } of d.clientsNeedingAttention) {
    for (const r of reasons) {
      if (queue.some((q) => q.orgId === org.id && q.title.toLowerCase().includes(r.toLowerCase().slice(0, 18)))) continue;
      queue.push({ key: `${org.id}-${r}`, tone: /past due/i.test(r) ? "bad" : "watch", title: r, orgId: org.id, orgName: org.name, href: `/ops/clients/${org.id}`, tag: /past due/i.test(r) ? "Billing" : "Client" });
    }
  }

  const activity = [
    ...d.recentDeployments.map((x, i) => ({ key: `dep-${i}`, at: x.at, title: <>{titleCase(x.detail.split(" — ")[0])} <span className="pf-muted ml-1.5">{x.orgName}</span></>, sub: x.detail.split(" — ")[1], tone: toneFor(x.status) })),
    ...d.recentActions.map((a, i) => ({ key: `act-${i}`, at: a.at, title: <>{titleCase(a.action.replace(/\./g, " "))}{a.orgName ? <span className="pf-muted ml-1.5">{a.orgName}</span> : null}</>, sub: `by ${a.actorName}`, tone: "info" as Tone })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  const live = [...d.activeRuns, ...d.failedRuns].slice(0, 7);

  return (
    <>
      <PageHead
        title="Control center"
        description={queue.length === 0 ? "No open decisions. Review activity and the freshness of your runtime checks below." : `${queue.length} item${queue.length === 1 ? "" : "s"} need${queue.length === 1 ? "s" : ""} a look across ${new Set(queue.map((q) => q.orgId)).size} client${new Set(queue.map((q) => q.orgId)).size === 1 ? "" : "s"}.`}
      />

      {d.eligibleForReactivation.map((o) => (
        <Banner key={o.id} tone="good" action={<Link className="btn btn-primary" href={`/ops/clients/${o.id}`}>Review {o.name}</Link>}>
          <strong>Payment received — {o.name} is eligible for reactivation.</strong> Nothing restarts until you reactivate.
        </Banner>
      ))}

      <KpiRow cols={4}>
        <Kpi icon={Users} value={d.activeClients} label="Active clients" href="/ops/clients" hint={`${d.suspended.length} suspended, ${d.pastDue.length} past due`} />
        <Kpi icon={CircleDollarSign} value={money(d.mrrCents)} label="Monthly recurring revenue" href="/ops/billing" hint="Active agreements" />
        <Kpi icon={BotIcon} value={d.activeRuns.length} label="Bots working now" href="/ops/runs?status=active" spark={runTotals} hint={`${runs14} runs in the last 14 days`} />
        <Kpi icon={AlertTriangle} value={failed14} label="Failed runs, 14 days" href="/ops/runs?status=failed" tone={failed14 ? "watch" : undefined} hint={finished14 ? `${Math.round((completed14 / finished14) * 100)}% of finished runs succeeded` : "No runs yet"} meter={finished14 ? { pct: (completed14 / finished14) * 100 } : undefined} />
      </KpiRow>
      <nav className="oc-strip" aria-label="Operator priorities">
        <Link href="/ops/monitoring"><b>{d.incidents.length}</b><span>Open incidents</span></Link>
        <Link href="/ops/approvals"><b>{d.pendingApprovals}</b><span>Awaiting approval</span></Link>
        <Link href="/ops/requests"><b>{d.newRequests}</b><span>New requests</span></Link>
        <Link href="/ops/billing"><b>{money(d.outstandingCents)}</b><span>Receivables</span></Link>
      </nav>

      <div className="pf-grid pf-grid-main">
        <Panel title="Bot runs, last 14 days" sub="Recorded activity · daily totals in UTC" action={<Link href="/ops/runs" className="pf-small font-semibold text-[var(--accent-text)]">All runs</Link>}>
          <OperationsChart dates={d.runsDaily.map(x => x.date)} series={[
            { label: "Completed", values: d.runsDaily.map(x => x.completed) },
            { label: "Failed / interrupted", values: d.runsDaily.map(x => x.failed) },
            { label: "Other states", values: d.runsDaily.map(x => x.other) },
          ]} />
        </Panel>

        <Panel title="Fleet health" sub={`${d.fleet.length} client runtime${d.fleet.length === 1 ? "" : "s"}`} action={<Link href="/ops/infrastructure" className="pf-small font-semibold text-[var(--accent-text)]">Infrastructure</Link>}>
          <SegBar
            label="Runtime health"
            items={[
              { label: "Healthy", value: health.healthy, tone: "good" },
              { label: "Degraded", value: health.degraded, tone: "watch" },
              { label: "Offline", value: health.offline, tone: "bad" },
              { label: "Unverified / stopped", value: health.stopped, tone: "quiet" },
            ]}
          />
          <p className="oc-note mt-4">Checks older than 10 minutes are unverified. These are observations, not an uptime SLA.</p>
          <ul className="pf-fleet">
            {d.fleet.map((f) => (
              <li key={f.orgId}>
                <Avatar name={f.orgName} size="sm" />
                <Link href={`/ops/clients/${f.orgId}?tab=infrastructure`} className="n">{f.orgName}</Link>
                <Lights items={[
                  { label: "Engine", tone: f.ready ? "good" : f.health === "stopped" || f.health === "unknown" ? "quiet" : "bad", title: f.ready ? "ready" : f.health },
                  { label: "Tunnel", tone: toneFor(f.tunnel === "connected" ? "connected" : f.tunnel === "down" ? "down" : undefined), title: f.tunnel },
                ]} />
                <span className="disk" title="Data volume used">{f.diskUsedPct ?? "—"}{f.diskUsedPct !== undefined ? "%" : ""}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Needs attention" sub="Incidents and client problems, most severe first" flush>
          {queue.length === 0 ? <Empty title="All clear">Nothing needs a decision right now.</Empty> : (
            <ul className="pf-queue">
              {queue.slice(0, 8).map((q) => (
                <li key={q.key} className={`edge-${q.tone}`}>
                  <Avatar name={q.orgName} size="sm" />
                  <div className="body">
                    <div className="t">{q.title}</div>
                    <div className="m"><span className={`pf-badge ${q.tone === "bad" ? "bad" : q.tone === "watch" ? "watch" : ""}`}>{q.tag}</span><span>{q.orgName}</span>{q.at && <When iso={q.at} />}</div>
                  </div>
                  <Link href={q.href} className="btn btn-outline">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent payments" flush action={<Link href="/ops/billing" className="pf-small font-semibold text-[var(--accent-text)]">Billing</Link>}>
          {d.recentPayments.length === 0 ? <Empty title="No payments yet" /> : (
            <ul className="pf-paylist">
              {d.recentPayments.map((p, i) => (
                <li key={i}>
                  <Avatar name={p.orgName} size="sm" />
                  <div className="body"><div className="t">{p.orgName}</div><div className="m"><span>{p.method.toUpperCase()}</span><span>{p.date}</span></div></div>
                  <div className="amt">{money(p.amountCents)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Working now and recent failures" flush action={<Link href="/ops/runs" className="pf-small font-semibold text-[var(--accent-text)]">Runs</Link>}>
          {live.length === 0 ? <Empty title="No runs in progress or failing" /> : (
            <ul className="pf-queue">
              {live.map((r) => (
                <li key={r.id} className={`edge-${toneFor(r.status)}`}>
                  <Avatar name={d.orgNames.get(r.orgId) ?? ""} size="sm" />
                  <div className="body">
                    <Link href={`/ops/runs/${r.id}`} className="t row-link">{r.task}</Link>
                    <div className="m"><span>{d.botNames.get(r.botId)}</span><span>{d.orgNames.get(r.orgId)}</span><When iso={r.startedAt ?? r.createdAt} /></div>
                  </div>
                  <Status value={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Activity" sub="Deployments and operator actions" flush>
          <TimelineList items={activity} empty="No activity yet." />
        </Panel>
      </div>
    </>
  );
}
