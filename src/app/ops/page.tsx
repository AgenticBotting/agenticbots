import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { opsDashboard } from "@/server/services/queries";
import { PageHead, Panel, Stat, Stats, Table, When, Empty, Banner } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { money, usd, titleCase } from "@/lib/platform/format";

export const metadata = { title: "Dashboard" };

export default async function OpsDashboard() {
  const actor = await requireOperatorPage();
  const d = await opsDashboard(await repo(), actor);
  const attention = d.clientsNeedingAttention;

  return (
    <>
      <PageHead
        title="What needs attention"
        description={attention.length === 0 && d.incidents.length === 0 ? "Nothing is waiting on you. Bots are running." : `${attention.length} client${attention.length === 1 ? "" : "s"} need${attention.length === 1 ? "s" : ""} a look.`}
      />

      {d.eligibleForReactivation.map((o) => (
        <Banner key={o.id} tone="good" action={<Link className="btn btn-primary" href={`/ops/clients/${o.id}`}>Review {o.name}</Link>}>
          <strong>Payment received — {o.name} is eligible for reactivation.</strong> Nothing restarts until you reactivate.
        </Banner>
      ))}

      <Stats>
        <Stat value={d.activeClients} label="Active clients" href="/ops/clients" />
        <Stat value={d.incidents.length} label="Open incidents" href="/ops/monitoring" tone={d.incidents.some((i) => i.severity === "critical") ? "bad" : d.incidents.length ? "watch" : undefined} />
        <Stat value={d.activeRuns.length} label="Bots working now" href="/ops/runs?status=active" />
        <Stat value={d.failedRuns.length} label="Recent failed runs" href="/ops/runs?status=failed" tone={d.failedRuns.length ? "watch" : undefined} />
        <Stat value={d.pendingApprovals} label="Pending approvals" href="/ops/approvals" />
        <Stat value={d.newRequests} label="New requests" href="/ops/requests?status=submitted" tone={d.newRequests ? "watch" : undefined} />
        <Stat value={d.disconnectedIntegrations.length} label="Integration problems" href="/ops/integrations?status=problems" tone={d.disconnectedIntegrations.length ? "watch" : undefined} />
        <Stat value={money(d.outstandingCents)} label="Outstanding receivables" href="/ops/billing" />
      </Stats>

      <div className="pf-grid pf-grid-main">
        <div className="pf-grid">
          <Panel title="Clients needing attention" flush>
            {attention.length === 0 ? (
              <Empty title="All clients look healthy" />
            ) : (
              <Table head={["Client", "Why", "Status"]}>
                {attention.map(({ org, reasons }) => (
                  <tr key={org.id}>
                    <td><Link className="row-link" href={`/ops/clients/${org.id}`}>{org.name}</Link></td>
                    <td>{reasons.slice(0, 3).map((r, i) => <div key={i}>{r}</div>)}</td>
                    <td><Status value={org.status} /></td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>

          <Panel title="Runtime and provider incidents" action={<Link href="/ops/monitoring" className="pf-small underline">All incidents</Link>} flush>
            <Table head={["Severity", "Incident", "Client", "Last seen", "Count"]} empty={<Empty title="No open incidents" />}>
              {d.incidents.map((i) => (
                <tr key={i.id}>
                  <td><Status value={i.severity} /></td>
                  <td>{i.title}</td>
                  <td>{d.orgNames.get(i.orgId)}</td>
                  <td><When iso={i.lastSeenAt} /></td>
                  <td className="num">{i.occurrences}</td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Bots working and recent failures" flush>
            <Table head={["Bot", "Client", "Task", "Status", "Started"]} empty={<Empty title="No runs in progress or failing" />}>
              {[...d.activeRuns, ...d.failedRuns].slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{d.botNames.get(r.botId)}</td>
                  <td>{d.orgNames.get(r.orgId)}</td>
                  <td><Link className="row-link pf-trunc inline-block" href={`/ops/runs/${r.id}`}>{r.task}</Link></td>
                  <td><Status value={r.status} /></td>
                  <td><When iso={r.startedAt ?? r.createdAt} /></td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>

        <div className="pf-grid">
          <Panel title="Accounts">
            <dl className="pf-kv">
              <dt>Past due</dt><dd>{d.pastDue.length ? d.pastDue.map((o) => <div key={o.id}><Link className="underline" href={`/ops/clients/${o.id}?tab=billing`}>{o.name}</Link></div>) : "None"}</dd>
              <dt>Suspended</dt><dd>{d.suspended.length ? d.suspended.map((o) => <div key={o.id}><Link className="underline" href={`/ops/clients/${o.id}`}>{o.name}</Link></div>) : "None"}</dd>
              <dt>Failing automations</dt><dd><Link className="underline" href="/ops/automations?status=failed">{d.failingAutomations}</Link></dd>
              <dt>Provider problems</dt><dd>{d.providerProblems.length || "None"}</dd>
            </dl>
          </Panel>
          <Panel title="This month" sub="Estimates from operator-entered rates">
            <dl className="pf-kv">
              <dt>Bot Runs</dt><dd>{d.usageThisMonth.runs}</dd>
              <dt>Model cost</dt><dd>{usd(d.usageThisMonth.modelCostUsd)}</dd>
              <dt>Infrastructure</dt><dd>{usd(d.usageThisMonth.infraCostUsd, 0)}</dd>
            </dl>
          </Panel>
          <Panel title="Recent payments" flush>
            <Table head={["Client", "Amount", "Received"]} empty={<Empty title="No payments yet" />}>
              {d.recentPayments.map((p, i) => (
                <tr key={i}><td>{p.orgName}<div className="pf-muted pf-small">{p.method.toUpperCase()}</div></td><td className="num">{money(p.amountCents)}</td><td>{p.date}</td></tr>
              ))}
            </Table>
          </Panel>
          <Panel title="Recent deployments" flush>
            <Table head={["Change", "When"]} empty={<Empty title="No deployments yet" />}>
              {d.recentDeployments.map((x, i) => (
                <tr key={i}><td>{x.orgName}<div className="pf-small pf-muted">{x.detail}</div></td><td><When iso={x.at} /></td></tr>
              ))}
            </Table>
          </Panel>
          <Panel title="Recent operator actions" flush>
            <Table head={["Who", "Action", "When"]} empty={<Empty title="No actions yet" />}>
              {d.recentActions.map((a, i) => (
                <tr key={i}><td>{a.actorName}</td><td>{titleCase(a.action.replace(/\./g, " "))}{a.orgName ? <div className="pf-small pf-muted">{a.orgName}</div> : null}</td><td><When iso={a.at} /></td></tr>
              ))}
            </Table>
          </Panel>
        </div>
      </div>
    </>
  );
}
